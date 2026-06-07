'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import {
  Calendar,
  Plus,
  Trash2,
  AlertCircle,
  Clock,
  MapPin,
  Check
} from 'lucide-react'

export default function TripsPage() {
  const [company, setCompany] = useState<any>(null)
  const [trips, setTrips] = useState<any[]>([])
  const [routes, setRoutes] = useState<any[]>([])
  const [vehicles, setVehicles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Form states
  const [showModal, setShowModal] = useState(false)
  const [routeId, setRouteId] = useState('')
  const [vehicleId, setVehicleId] = useState('')
  const [departureTime, setDepartureTime] = useState('')
  const [price, setPrice] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadTripsData() {
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

          // Fetch trips
          const { data: tData } = await supabase
            .from('trips')
            .select(`
              *,
              routes (origin, destination),
              vehicles (registration_number, make, model)
            `)
            .eq('company_id', comp.id)
            .order('departure_time', { ascending: true })
          setTrips(tData || [])

          // Fetch routes
          const { data: rData } = await supabase
            .from('routes')
            .select('*')
            .eq('company_id', comp.id)
          setRoutes(rData || [])

          // Fetch vehicles
          const { data: vData } = await supabase
            .from('fleet_vehicles')
            .select('*')
            .eq('company_id', comp.id)
            .eq('status', 'available')
          setVehicles(vData || [])
        }
      } catch (err) {
        console.error('Failed to load trips data:', err)
      } finally {
        setLoading(false)
      }
    }

    loadTripsData()
  }, [])

  const handleCreateTrip = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!company) return

    setError(null)
    setSubmitting(true)

    const priceNum = parseFloat(price)
    if (!routeId || !departureTime || isNaN(priceNum) || priceNum <= 0) {
      setError('Please fill in all required fields and enter a valid ticket price.')
      setSubmitting(false)
      return
    }

    try {
      const { data, error: addErr } = await supabase
        .from('trips')
        .insert({
          company_id: company.id,
          route_id: routeId,
          vehicle_id: vehicleId || null,
          departure_time: departureTime,
          price: priceNum,
          status: 'active',
          available_seats: vehicleId ? vehicles.find(v => v.id === vehicleId)?.capacity : 14
        })
        .select(`
          *,
          routes (origin, destination),
          vehicles (registration_number, make, model)
        `)
        .single()

      if (addErr) throw addErr

      // Log action
      await supabase.from('audit_logs').insert({
        actor_id: (await supabase.auth.getUser()).data.user?.id,
        actor_email: (await supabase.auth.getUser()).data.user?.email,
        action: 'company_trip_create',
        entity_type: 'trips',
        entity_id: data.id,
        new_value: { price: priceNum, departure_time: departureTime }
      })

      setTrips(prev => [...prev, data])
      setShowModal(false)
      setRouteId('')
      setVehicleId('')
      setDepartureTime('')
      setPrice('')
    } catch (err: any) {
      console.error('Create trip error:', err)
      setError(err.message || 'Failed to schedule trip.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancelTrip = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this scheduled trip? Checked-in bookings will be flagged for refund.')) return

    try {
      const { error: cancelErr } = await supabase
        .from('trips')
        .update({ status: 'cancelled' })
        .eq('id', id)

      if (cancelErr) throw cancelErr

      // Log action
      await supabase.from('audit_logs').insert({
        actor_id: (await supabase.auth.getUser()).data.user?.id,
        actor_email: (await supabase.auth.getUser()).data.user?.email,
        action: 'company_trip_cancel',
        entity_type: 'trips',
        entity_id: id
      })

      setTrips(prev => prev.map(t => t.id === id ? { ...t, status: 'cancelled' } : t))
    } catch (err) {
      console.error('Cancel trip error:', err)
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div className="skeleton" style={{ height: 48, width: '40%' }} />
        <div className="skeleton" style={{ height: 280, borderRadius: 12 }} />
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }} className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: '#0F172A', fontFamily: 'Outfit, sans-serif' }}>Trip Scheduler</h1>
          <p style={{ fontSize: 13, color: '#64748B' }}>Schedule specific trip times, link routes to fleet assets, and assign pricing models</p>
        </div>
        <button onClick={() => setShowModal(true)} className="mt-btn-primary btn-press">
          <Plus size={16} /> Schedule Trip
        </button>
      </div>

      {/* Trips list */}
      <div className="mt-card" style={{ background: '#FFFFFF', borderRadius: 12, overflow: 'hidden' }}>
        {trips.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <Calendar size={40} color="#94A3B8" style={{ margin: '0 auto 12px' }} />
            <p style={{ fontSize: 13, color: '#64748B' }}>No scheduled trips found. Click "Schedule Trip" to publish timings.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  <th style={{ padding: '14px 16px', fontWeight: 600, color: '#475569' }}>Route Line</th>
                  <th style={{ padding: '14px 16px', fontWeight: 600, color: '#475569' }}>Departure Time</th>
                  <th style={{ padding: '14px 16px', fontWeight: 600, color: '#475569' }}>Vehicle</th>
                  <th style={{ padding: '14px 16px', fontWeight: 600, color: '#475569' }}>Seats Left</th>
                  <th style={{ padding: '14px 16px', fontWeight: 600, color: '#475569' }}>Ticket Price</th>
                  <th style={{ padding: '14px 16px', fontWeight: 600, color: '#475569' }}>Status</th>
                  <th style={{ padding: '14px 16px', fontWeight: 600, color: '#475569' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {trips.map(t => (
                  <tr key={t.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '14px 16px', fontWeight: 700, color: '#0F172A' }}>
                      {t.routes?.origin} → {t.routes?.destination}
                    </td>
                    <td style={{ padding: '14px 16px', color: '#0F172A' }}>
                      {new Date(t.departure_time).toLocaleString()}
                    </td>
                    <td style={{ padding: '14px 16px', color: '#64748B' }}>
                      {t.vehicles ? `${t.vehicles.make} ${t.vehicles.model} (${t.vehicles.registration_number})` : 'Unassigned'}
                    </td>
                    <td style={{ padding: '14px 16px', color: '#0F172A', fontWeight: 600 }}>{t.available_seats} left</td>
                    <td style={{ padding: '14px 16px', color: '#16A34A', fontWeight: 700 }}>₦{t.price.toLocaleString()}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        background: t.status === 'active' ? '#DCFCE7' : '#FEE2E2',
                        color: t.status === 'active' ? '#15803D' : '#DC2626',
                        padding: '2px 8px',
                        borderRadius: 999,
                        fontSize: 10,
                        fontWeight: 700,
                        textTransform: 'uppercase'
                      }}>
                        {t.status}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      {t.status === 'active' && (
                        <button
                          onClick={() => handleCancelTrip(t.id)}
                          style={{ background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer', fontSize: 11, fontWeight: 600 }}
                        >
                          Cancel Trip
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal scheduler */}
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
          <form onSubmit={handleCreateTrip} className="mt-card modal-in" style={{ background: '#FFFFFF', padding: 32, borderRadius: 16, maxWidth: 450, width: '100%', margin: '0 16px' }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', marginBottom: 6, fontFamily: 'Outfit, sans-serif' }}>Schedule Transit Trip</h3>
            <p style={{ fontSize: 12, color: '#64748B', marginBottom: 20 }}>Publish departure windows and pricing vectors</p>

            {error && (
              <div style={{ background: '#FEE2E2', color: '#DC2626', padding: 12, borderRadius: 8, fontSize: 12, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <div style={{ marginBottom: 12 }}>
              <label className="mt-label">Route Line *</label>
              <select className="mt-input" required value={routeId} onChange={e => setRouteId(e.target.value)}>
                <option value="">Select Origin → Destination</option>
                {routes.map(r => (
                  <option key={r.id} value={r.id}>{r.origin} to {r.destination}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label className="mt-label">Assigned Vehicle</label>
              <select className="mt-input" value={vehicleId} onChange={e => setVehicleId(e.target.value)}>
                <option value="">Leave Unassigned (Auto-Assign Later)</option>
                {vehicles.map(v => (
                  <option key={v.id} value={v.id}>{v.make} {v.model} ({v.registration_number})</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label className="mt-label">Departure Date & Time *</label>
              <input
                type="datetime-local"
                required
                className="mt-input"
                value={departureTime}
                onChange={e => setDepartureTime(e.target.value)}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label className="mt-label">Ticket Price (₦) *</label>
              <input
                type="number"
                required
                placeholder="e.g. 15000"
                className="mt-input"
                value={price}
                onChange={e => setPrice(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setShowModal(false)} className="mt-btn-outline btn-press" style={{ height: 40 }}>
                Cancel
              </button>
              <button type="submit" disabled={submitting} className="mt-btn-primary btn-press" style={{ height: 40 }}>
                {submitting ? 'Scheduling...' : 'Schedule'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
