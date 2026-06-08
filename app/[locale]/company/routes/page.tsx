'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import {
  Route,
  Plus,
  Trash2,
  AlertCircle,
  MapPin
} from 'lucide-react'

export default function RoutesPage() {
  const [company, setCompany] = useState<any>(null)
  const [routes, setRoutes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Modal forms
  const [showModal, setShowModal] = useState(false)
  const [origin, setOrigin] = useState('')
  const [destination, setDestination] = useState('')
  const [distance, setDistance] = useState('')
  const [duration, setDuration] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadRoutes() {
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
          const { data: rData } = await supabase
            .from('routes')
            .select('*')
            .eq('company_id', comp.id)
            .order('created_at', { ascending: false })
          setRoutes(rData || [])
        }
      } catch (err) {
        console.error('Failed to load routes:', err)
      } finally {
        setLoading(false)
      }
    }

    loadRoutes()
  }, [])

  const handleCreateRoute = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!company) return

    setError(null)
    setSubmitting(true)

    const distNum = parseFloat(distance)
    const durNum = parseFloat(duration)

    if (!origin || !destination) {
      setError('Origin and Destination are required.')
      setSubmitting(false)
      return
    }

    try {
      const { data, error: addErr } = await supabase
        .from('routes')
        .insert({
          company_id: company.id,
          origin,
          destination,
          distance_km: isNaN(distNum) ? null : distNum,
          estimated_hours: isNaN(durNum) ? null : durNum
        })
        .select()
        .single()

      if (addErr) throw addErr

      // Log action
      await supabase.from('audit_logs').insert({
        actor_id: (await supabase.auth.getUser()).data.user?.id,
        actor_email: (await supabase.auth.getUser()).data.user?.email,
        action: 'company_route_add',
        entity_type: 'routes',
        entity_id: data.id,
        new_value: { origin, destination }
      })

      setRoutes(prev => [data, ...prev])
      setShowModal(false)
      setOrigin('')
      setDestination('')
      setDistance('')
      setDuration('')
    } catch (err: any) {
      console.error('Create route error:', err)
      setError(err.message || 'Failed to create route.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteRoute = async (id: string) => {
    if (!confirm('Are you sure you want to retire this route line? All linked scheduling is archived.')) return

    try {
      const { error: delErr } = await supabase
        .from('routes')
        .delete()
        .eq('id', id)

      if (delErr) throw delErr

      // Log action
      await supabase.from('audit_logs').insert({
        actor_id: (await supabase.auth.getUser()).data.user?.id,
        actor_email: (await supabase.auth.getUser()).data.user?.email,
        action: 'company_route_delete',
        entity_type: 'routes',
        entity_id: id
      })

      setRoutes(prev => prev.filter(r => r.id !== id))
    } catch (err) {
      console.error('Delete route error:', err)
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div className="skeleton" style={{ height: 48, width: '40%' }} />
        <div className="skeleton" style={{ height: 250, borderRadius: 12 }} />
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }} className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: '#0F172A', fontFamily: 'Outfit, sans-serif' }}>Route Management</h1>
          <p style={{ fontSize: 13, color: '#64748B' }}>Establish route vectors, distances, and travel corridors for your transit offerings</p>
        </div>
        <button onClick={() => setShowModal(true)} className="mt-btn-primary btn-press">
          <Plus size={16} /> Create Route
        </button>
      </div>

      {/* Routes table */}
      <div className="mt-card" style={{ background: '#FFFFFF', borderRadius: 12, overflow: 'hidden' }}>
        {routes.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <Route size={40} color="#94A3B8" style={{ margin: '0 auto 12px' }} />
            <p style={{ fontSize: 13, color: '#64748B' }}>No routes registered yet. Click "Create Route" to define transit lines.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <div className="mt-table-wrap">
<table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  <th style={{ padding: '14px 16px', fontWeight: 600, color: '#475569' }}>Origin</th>
                  <th style={{ padding: '14px 16px', fontWeight: 600, color: '#475569' }}>Destination</th>
                  <th style={{ padding: '14px 16px', fontWeight: 600, color: '#475569' }}>Distance</th>
                  <th style={{ padding: '14px 16px', fontWeight: 600, color: '#475569' }}>Est. Duration</th>
                  <th style={{ padding: '14px 16px', fontWeight: 600, color: '#475569' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {routes.map(r => (
                  <tr key={r.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '14px 16px', fontWeight: 700, color: '#0F172A' }}>{r.origin}</td>
                    <td style={{ padding: '14px 16px', fontWeight: 700, color: '#0F172A' }}>{r.destination}</td>
                    <td style={{ padding: '14px 16px', color: '#64748B' }}>{r.distance_km ? `${r.distance_km} KM` : 'N/A'}</td>
                    <td style={{ padding: '14px 16px', color: '#64748B' }}>{r.estimated_hours ? `${r.estimated_hours} Hours` : 'N/A'}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <button
                        onClick={() => handleDeleteRoute(r.id)}
                        style={{ background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer', padding: 4 }}
                        title="Delete Route"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
</div>
          </div>
        )}
      </div>

      {/* Create route modal */}
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
          <form onSubmit={handleCreateRoute} className="mt-card modal-in" style={{ background: '#FFFFFF', padding: 32, borderRadius: 16, maxWidth: 450, width: '100%', margin: '0 16px' }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', marginBottom: 6, fontFamily: 'Outfit, sans-serif' }}>Create Route Line</h3>
            <p style={{ fontSize: 12, color: '#64748B', marginBottom: 20 }}>Define origin and destination terminologies</p>

            {error && (
              <div style={{ background: '#FEE2E2', color: '#DC2626', padding: 12, borderRadius: 8, fontSize: 12, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <div style={{ marginBottom: 12 }}>
              <label className="mt-label">Origin City / Terminal *</label>
              <input
                type="text"
                required
                placeholder="e.g. Lagos (Jibowu)"
                className="mt-input"
                value={origin}
                onChange={e => setOrigin(e.target.value)}
              />
            </div>

            <div style={{ marginBottom: 12 }}>
              <label className="mt-label">Destination City / Terminal *</label>
              <input
                type="text"
                required
                placeholder="e.g. Abuja (Utako)"
                className="mt-input"
                value={destination}
                onChange={e => setDestination(e.target.value)}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
              <div>
                <label className="mt-label">Distance (KM)</label>
                <input
                  type="number"
                  placeholder="e.g. 750"
                  className="mt-input"
                  value={distance}
                  onChange={e => setDistance(e.target.value)}
                />
              </div>
              <div>
                <label className="mt-label">Est. Duration (Hours)</label>
                <input
                  type="number"
                  step="any"
                  placeholder="e.g. 9.5"
                  className="mt-input"
                  value={duration}
                  onChange={e => setDuration(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setShowModal(false)} className="mt-btn-outline btn-press" style={{ height: 40 }}>
                Cancel
              </button>
              <button type="submit" disabled={submitting} className="mt-btn-primary btn-press" style={{ height: 40 }}>
                {submitting ? 'Creating...' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
