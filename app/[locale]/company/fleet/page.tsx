'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Bus, Upload, Plus, CheckCircle2, ShieldAlert } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

interface Vehicle {
  id: string
  name: string
  plate_number: string
  capacity: number
  comfort_class: string
  amenities: string[]
  photos: string[]
}

export default function FleetPage() {
  const router = useRouter()
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)

  // Form state
  const [name, setName] = useState('')
  const [plateNumber, setPlateNumber] = useState('')
  const [capacity, setCapacity] = useState(14)
  const [comfortClass, setComfortClass] = useState('Standard')
  const [amenities, setAmenities] = useState<string[]>([])
  const [photoFiles, setPhotoFiles] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const amenitiesOptions = ['Air Conditioning', 'WiFi', 'USB Chargers', 'Reclining Seats', 'TV/Entertainment']

  const fetchFleet = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: company } = await supabase
        .from('companies')
        .select('id')
        .eq('owner_id', user.id)
        .single()

      if (!company) return

      const { data: fleetData, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('company_id', company.id)

      if (error) throw error

      // Convert amenities & photos if stored as json
      const formatted = (fleetData || []).map(v => ({
        ...v,
        amenities: Array.isArray(v.amenities) ? v.amenities : [],
        photos: Array.isArray(v.photos) ? v.photos : [],
      }))
      setVehicles(formatted)
    } catch (err) {
      console.error('Error fetching fleet:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFleet()
  }, [])

  const handleAmenityToggle = (amenity: string) => {
    setAmenities(prev =>
      prev.includes(amenity) ? prev.filter(a => a !== amenity) : [...prev, amenity]
    )
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setPhotoFiles(Array.from(e.target.files))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setAdding(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const { data: company } = await supabase
        .from('companies')
        .select('id')
        .eq('owner_id', user.id)
        .single()

      if (!company) throw new Error('Company onboarding not completed.')

      // Upload photos to vehicle_photos storage bucket
      const uploadedUrls: string[] = []
      for (const file of photoFiles) {
        const fileName = `${company.id}/${Date.now()}_${file.name}`
        const { error: uploadErr } = await supabase.storage
          .from('vehicle_photos')
          .upload(fileName, file)

        if (uploadErr) throw uploadErr

        const { data: { publicUrl } } = supabase.storage
          .from('vehicle_photos')
          .getPublicUrl(fileName)

        uploadedUrls.push(publicUrl)
      }

      // Save vehicle record in vehicles table
      const { error: dbError } = await supabase.from('vehicles').insert({
        company_id: company.id,
        name,
        vehicle_number: 'V-' + Math.floor(Math.random() * 10000), // generated batch identifier/number
        plate_number: plateNumber,
        capacity,
        comfort_class: comfortClass,
        amenities,
        photos: uploadedUrls,
        is_active: true
      })

      if (dbError) throw dbError

      // Reset form
      setName('')
      setPlateNumber('')
      setCapacity(14)
      setComfortClass('Standard')
      setAmenities([])
      setPhotoFiles([])
      fetchFleet()
      alert('Vehicle added successfully!')
    } catch (err: any) {
      console.error('Error adding vehicle:', err)
      alert(err.message || 'Failed to add vehicle.')
    } finally {
      setAdding(false)
    }
  }

  return (
    <div style={{ background: '#F8FAFC', minHeight: '100vh', padding: '24px 20px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', fontFamily: 'Outfit, sans-serif' }}>Fleet Management</h1>
            <p style={{ fontSize: 14, color: '#64748B' }}>Add and manage your transport vehicles</p>
          </div>
          <button onClick={() => router.push('/en/company/dashboard')} className="mt-btn-outline" style={{ padding: '10px 20px' }}>
            Dashboard
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24 }}>
          
          {/* List of Vehicles */}
          <div className="mt-card" style={{ padding: 24 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', marginBottom: 16 }}>Your Vehicles</h2>
            {loading ? (
              <p style={{ color: '#64748B' }}>Loading vehicles...</p>
            ) : vehicles.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748B' }}>
                <Bus size={36} style={{ color: '#94A3B8', marginBottom: 12, margin: '0 auto' }} />
                <p style={{ fontSize: 14, fontWeight: 600 }}>No vehicles in your fleet</p>
                <p style={{ fontSize: 12, marginTop: 4 }}>Add your first bus using the form on the right.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {vehicles.map(v => (
                  <div key={v.id} style={{ display: 'flex', gap: 16, padding: 14, border: '1px solid #E2E8F0', borderRadius: 12, background: 'white' }}>
                    {v.photos.length > 0 ? (
                      <img src={v.photos[0]} alt={v.name} style={{ width: 80, height: 80, borderRadius: 8, objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: 80, height: 80, background: '#F1F5F9', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Bus size={32} color="#94A3B8" />
                      </div>
                    )}
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>{v.name}</p>
                      <p style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                        Plate: <strong>{v.plate_number}</strong> · Class: <strong>{v.comfort_class}</strong>
                      </p>
                      <p style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>Capacity: {v.capacity} seats</p>
                      {v.amenities.length > 0 && (
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 8 }}>
                          {v.amenities.map(a => (
                            <span key={a} style={{ fontSize: 10, background: '#F1F5F9', color: '#475569', padding: '2px 6px', borderRadius: 4 }}>{a}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add Vehicle Form */}
          <div className="mt-card" style={{ padding: 24 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', marginBottom: 16 }}>Add New Vehicle</h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="mt-label">Vehicle name / Model</label>
                <input 
                  type="text" 
                  placeholder="e.g. Toyota HiAce 2022" 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  required 
                  className="mt-input" 
                />
              </div>

              <div>
                <label className="mt-label">Plate Number</label>
                <input 
                  type="text" 
                  placeholder="e.g. APP-123AA" 
                  value={plateNumber} 
                  onChange={e => setPlateNumber(e.target.value)} 
                  required 
                  className="mt-input" 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="mt-label">Seats Capacity</label>
                  <input 
                    type="number" 
                    min={1} 
                    value={capacity} 
                    onChange={e => setCapacity(parseInt(e.target.value))} 
                    required 
                    className="mt-input" 
                  />
                </div>
                <div>
                  <label className="mt-label">Comfort Class</label>
                  <select 
                    value={comfortClass} 
                    onChange={e => setComfortClass(e.target.value)} 
                    className="mt-input"
                  >
                    <option value="Economy">Economy</option>
                    <option value="Standard">Standard</option>
                    <option value="Executive">Executive</option>
                    <option value="VIP Luxury">VIP Luxury</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mt-label">Vehicle Amenities</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
                  {amenitiesOptions.map(opt => (
                    <label key={opt} style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, cursor: 'pointer', color: '#374151' }}>
                      <input 
                        type="checkbox" 
                        checked={amenities.includes(opt)} 
                        onChange={() => handleAmenityToggle(opt)} 
                        style={{ accentColor: '#16A34A' }}
                      />
                      {opt}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="mt-label">Vehicle Photos</label>
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  multiple 
                  accept="image/*"
                  style={{ display: 'none' }} 
                />
                <button 
                  type="button" 
                  onClick={() => fileInputRef.current?.click()} 
                  style={{ width: '100%', padding: '16px', border: '1.5px dashed #CBD5E1', borderRadius: 8, background: '#F8FAFC', cursor: 'pointer', transition: 'all 0.2s' }}
                >
                  <Upload size={18} color="#64748B" style={{ margin: '0 auto 6px' }} />
                  <p style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>
                    {photoFiles.length > 0 ? `${photoFiles.length} photos selected` : 'Upload vehicle photos'}
                  </p>
                </button>
              </div>

              <button 
                type="submit" 
                disabled={adding} 
                className="mt-btn-primary" 
                style={{ width: '100%', padding: '12px', marginTop: 6 }}
              >
                {adding ? 'Uploading & Adding...' : 'Add Vehicle to Fleet'}
              </button>
            </form>
          </div>

        </div>

      </div>
    </div>
  )
}
