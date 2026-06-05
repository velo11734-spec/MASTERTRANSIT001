'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MapPin, Plus, ArrowRight } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

interface Route {
  id: string
  origin: string
  destination: string
  distance_km: number
  estimated_hours: number
}

export default function RoutesPage() {
  const router = useRouter()
  const [routes, setRoutes] = useState<Route[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)

  // Form state
  const [origin, setOrigin] = useState('')
  const [destination, setDestination] = useState('')
  const [distanceKm, setDistanceKm] = useState('')
  const [estimatedHours, setEstimatedHours] = useState('')

  const fetchRoutes = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: company } = await supabase
        .from('companies')
        .select('id')
        .eq('owner_id', user.id)
        .single()

      if (!company) return

      const { data: routeData, error } = await supabase
        .from('routes')
        .select('*')
        .eq('company_id', company.id)

      if (error) throw error
      setRoutes(routeData || [])
    } catch (err) {
      console.error('Error fetching routes:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRoutes()
  }, [])

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

      const { error: dbError } = await supabase.from('routes').insert({
        company_id: company.id,
        origin,
        destination,
        distance_km: parseFloat(distanceKm),
        estimated_hours: parseFloat(estimatedHours),
      })

      if (dbError) throw dbError

      // Reset form
      setOrigin('')
      setDestination('')
      setDistanceKm('')
      setEstimatedHours('')
      fetchRoutes()
      alert('Route added successfully!')
    } catch (err: any) {
      console.error('Error adding route:', err)
      alert(err.message || 'Failed to add route.')
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
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', fontFamily: 'Outfit, sans-serif' }}>Route Management</h1>
            <p style={{ fontSize: 14, color: '#64748B' }}>Define travel routes and paths for your trips</p>
          </div>
          <button onClick={() => router.push('/en/company/dashboard')} className="mt-btn-outline" style={{ padding: '10px 20px' }}>
            Dashboard
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24 }}>
          
          {/* List of Routes */}
          <div className="mt-card" style={{ padding: 24 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', marginBottom: 16 }}>Your Travel Routes</h2>
            {loading ? (
              <p style={{ color: '#64748B' }}>Loading routes...</p>
            ) : routes.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748B' }}>
                <MapPin size={36} style={{ color: '#94A3B8', marginBottom: 12, margin: '0 auto' }} />
                <p style={{ fontSize: 14, fontWeight: 600 }}>No routes defined yet</p>
                <p style={{ fontSize: 12, marginTop: 4 }}>Add your routes using the form on the right.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {routes.map(r => (
                  <div key={r.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 16, border: '1px solid #E2E8F0', borderRadius: 12, background: 'white' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 40, height: 40, background: '#EDE9FE', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <MapPin size={20} color="#7C3AED" />
                      </div>
                      <div>
                        <p style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 6 }}>
                          {r.origin} <ArrowRight size={14} color="#64748B" /> {r.destination}
                        </p>
                        <p style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                          Distance: <strong>{r.distance_km} km</strong> · Est. Time: <strong>{r.estimated_hours} hrs</strong>
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add Route Form */}
          <div className="mt-card" style={{ padding: 24 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', marginBottom: 16 }}>Create New Route</h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="mt-label">Origin City / Terminal</label>
                <input 
                  type="text" 
                  placeholder="e.g. Lagos (Jibowu)" 
                  value={origin} 
                  onChange={e => setOrigin(e.target.value)} 
                  required 
                  className="mt-input" 
                />
              </div>

              <div>
                <label className="mt-label">Destination City / Terminal</label>
                <input 
                  type="text" 
                  placeholder="e.g. Abuja (Utako)" 
                  value={destination} 
                  onChange={e => setDestination(e.target.value)} 
                  required 
                  className="mt-input" 
                />
              </div>

              <div>
                <label className="mt-label">Distance (km)</label>
                <input 
                  type="number" 
                  step="0.1"
                  placeholder="e.g. 750" 
                  value={distanceKm} 
                  onChange={e => setDistanceKm(e.target.value)} 
                  required 
                  className="mt-input" 
                />
              </div>

              <div>
                <label className="mt-label">Estimated Travel Time (hours)</label>
                <input 
                  type="number" 
                  step="0.1"
                  placeholder="e.g. 10.5" 
                  value={estimatedHours} 
                  onChange={e => setEstimatedHours(e.target.value)} 
                  required 
                  className="mt-input" 
                />
              </div>

              <button 
                type="submit" 
                disabled={adding} 
                className="mt-btn-primary" 
                style={{ width: '100%', padding: '12px', marginTop: 6 }}
              >
                {adding ? 'Creating...' : 'Create Route'}
              </button>
            </form>
          </div>

        </div>

      </div>
    </div>
  )
}
