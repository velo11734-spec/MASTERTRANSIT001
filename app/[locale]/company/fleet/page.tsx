'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import {
  Truck,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  FileText,
  UserCheck
} from 'lucide-react'

export default function FleetPage() {
  const [company, setCompany] = useState<any>(null)
  const [vehicles, setVehicles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Add vehicle modal states
  const [showModal, setShowModal] = useState(false)
  const [regNo, setRegNo] = useState('')
  const [make, setMake] = useState('')
  const [model, setModel] = useState('')
  const [year, setYear] = useState('')
  const [capacity, setCapacity] = useState('')
  const [vType, setVType] = useState('bus')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadFleet() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user) return

        const { data: comp } = await supabase
          .from('companies')
          .select('*')
          .eq('owner_id', session.user.id)
          .maybeSingle()

        if (comp) {
          setCompany(comp)
          const { data: vData } = await supabase
            .from('fleet_vehicles')
            .select('*')
            .eq('company_id', comp.id)
            .order('created_at', { ascending: false })
          setVehicles(vData || [])
        }
      } catch (err) {
        console.error('Failed to load fleet:', err)
      } finally {
        setLoading(false)
      }
    }

    loadFleet()
  }, [])

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!company) return

    setError(null)
    setSubmitting(true)

    const capNum = parseInt(capacity)
    const yearNum = parseInt(year)

    if (isNaN(capNum) || capNum <= 0) {
      setError('Please enter a valid seat capacity.')
      setSubmitting(false)
      return
    }

    try {
      const { data, error: addErr } = await supabase
        .from('fleet_vehicles')
        .insert({
          company_id: company.id,
          registration_number: regNo,
          make,
          model,
          year: isNaN(yearNum) ? null : yearNum,
          capacity: capNum,
          vehicle_type: vType,
          status: 'available'
        })
        .select()
        .single()

      if (addErr) throw addErr

      // Log action
      await supabase.from('audit_logs').insert({
        actor_id: (await supabase.auth.getUser()).data.user?.id,
        actor_email: (await supabase.auth.getUser()).data.user?.email,
        action: 'company_vehicle_add',
        entity_type: 'fleet_vehicles',
        entity_id: data.id,
        new_value: { registration_number: regNo, model }
      })

      setVehicles(prev => [data, ...prev])
      setShowModal(false)
      setRegNo('')
      setMake('')
      setModel('')
      setYear('')
      setCapacity('')
      setVType('bus')
    } catch (err: any) {
      console.error('Add vehicle error:', err)
      setError(err.message || 'Failed to register vehicle to fleet.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteVehicle = async (id: string) => {
    if (!confirm('Are you sure you want to delete this vehicle from the fleet registry?')) return

    try {
      const { error: delErr } = await supabase
        .from('fleet_vehicles')
        .delete()
        .eq('id', id)

      if (delErr) throw delErr

      // Log action
      await supabase.from('audit_logs').insert({
        actor_id: (await supabase.auth.getUser()).data.user?.id,
        actor_email: (await supabase.auth.getUser()).data.user?.email,
        action: 'company_vehicle_delete',
        entity_type: 'fleet_vehicles',
        entity_id: id
      })

      setVehicles(prev => prev.filter(v => v.id !== id))
    } catch (err) {
      console.error('Delete vehicle error:', err)
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'available': return { bg: '#DCFCE7', text: '#15803D' }
      case 'scheduled':
      case 'in_transit': return { bg: '#EFF6FF', text: '#1D4ED8' }
      case 'maintenance': return { bg: '#FEF9C3', text: '#854D0E' }
      default: return { bg: '#F1F5F9', text: '#475569' }
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div className="skeleton" style={{ height: 48, width: '40%' }} />
        <div className="skeleton" style={{ height: 300, borderRadius: 12 }} />
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }} className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: '#0F172A', fontFamily: 'Outfit, sans-serif' }}>Fleet Registry</h1>
          <p style={{ fontSize: 13, color: '#64748B' }}>Add, update, or remove operational vehicles from your company fleet database</p>
        </div>
        <button onClick={() => setShowModal(true)} className="mt-btn-primary btn-press">
          <Plus size={16} /> Add New Vehicle
        </button>
      </div>

      {/* Fleet table */}
      <div className="mt-card" style={{ background: '#FFFFFF', borderRadius: 12, overflow: 'hidden' }}>
        {vehicles.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <Truck size={40} color="#94A3B8" style={{ margin: '0 auto 12px' }} />
            <p style={{ fontSize: 13, color: '#64748B' }}>No vehicles registered yet. Click "Add New Vehicle" to get started.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <div className="mt-table-wrap">
<table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  <th style={{ padding: '14px 16px', fontWeight: 600, color: '#475569' }}>Reg Number</th>
                  <th style={{ padding: '14px 16px', fontWeight: 600, color: '#475569' }}>Manufacturer & Model</th>
                  <th style={{ padding: '14px 16px', fontWeight: 600, color: '#475569' }}>Type</th>
                  <th style={{ padding: '14px 16px', fontWeight: 600, color: '#475569' }}>Capacity</th>
                  <th style={{ padding: '14px 16px', fontWeight: 600, color: '#475569' }}>Status</th>
                  <th style={{ padding: '14px 16px', fontWeight: 600, color: '#475569' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.map(v => {
                  const statusColors = getStatusBadgeColor(v.status)
                  return (
                    <tr key={v.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '14px 16px', fontWeight: 700, color: '#0F172A' }}>{v.registration_number}</td>
                      <td style={{ padding: '14px 16px', color: '#0F172A' }}>{v.make} {v.model} ({v.year || 'N/A'})</td>
                      <td style={{ padding: '14px 16px', color: '#64748B', textTransform: 'capitalize' }}>{v.vehicle_type}</td>
                      <td style={{ padding: '14px 16px', color: '#0F172A', fontWeight: 600 }}>{v.capacity} Seats</td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          background: statusColors.bg,
                          color: statusColors.text,
                          padding: '2px 8px',
                          borderRadius: 999,
                          fontSize: 10,
                          fontWeight: 700,
                          textTransform: 'uppercase'
                        }}>
                          {v.status}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <button
                          onClick={() => handleDeleteVehicle(v.id)}
                          style={{ background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer', padding: 4 }}
                          title="Delete Vehicle"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
</div>
          </div>
        )}
      </div>

      {/* Add vehicle modal overlay */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.4)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100
        }}>
          <form onSubmit={handleAddVehicle} className="mt-card modal-in" style={{ background: '#FFFFFF', padding: 32, borderRadius: 16, maxWidth: 500, width: '100%', margin: '0 16px' }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', marginBottom: 6, fontFamily: 'Outfit, sans-serif' }}>Register Fleet Vehicle</h3>
            <p style={{ fontSize: 12, color: '#64748B', marginBottom: 20 }}>Fill in the physical details of the vehicle asset</p>

            {error && (
              <div style={{ background: '#FEE2E2', color: '#DC2626', padding: 12, borderRadius: 8, fontSize: 12, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <label className="mt-label">Plate Reg Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BDG-123AA"
                  className="mt-input"
                  value={regNo}
                  onChange={e => setRegNo(e.target.value)}
                />
              </div>
              <div>
                <label className="mt-label">Manufacturer (Make) *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Toyota"
                  className="mt-input"
                  value={make}
                  onChange={e => setMake(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <label className="mt-label">Model Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. HiAce"
                  className="mt-input"
                  value={model}
                  onChange={e => setModel(e.target.value)}
                />
              </div>
              <div>
                <label className="mt-label">Year of Manufacture</label>
                <input
                  type="number"
                  placeholder="e.g. 2018"
                  className="mt-input"
                  value={year}
                  onChange={e => setYear(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
              <div>
                <label className="mt-label">Seat Capacity *</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 14"
                  className="mt-input"
                  value={capacity}
                  onChange={e => setCapacity(e.target.value)}
                />
              </div>
              <div>
                <label className="mt-label">Vehicle Type *</label>
                <select className="mt-input" value={vType} onChange={e => setVType(e.target.value)}>
                  <option value="bus">Bus / Coach</option>
                  <option value="minibus">Minibus</option>
                  <option value="taxi">Taxi / Sedan</option>
                  <option value="van">Van</option>
                  <option value="boat">Ferry / Boat</option>
                  <option value="train">Train Coach</option>
                  <option value="truck">Cargo Truck</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setShowModal(false)} className="mt-btn-outline btn-press" style={{ height: 40 }}>
                Cancel
              </button>
              <button type="submit" disabled={submitting} className="mt-btn-primary btn-press" style={{ height: 40 }}>
                {submitting ? 'Registering...' : 'Add to Fleet'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
