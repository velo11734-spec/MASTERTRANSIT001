'use client'

import { useState, useEffect } from 'react'
import { Truck, Plus, ShieldCheck, AlertTriangle, ShieldAlert, Check, RefreshCw, X, Eye } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

interface Vehicle {
  id: string;
  plate_number: string;
  model: string;
  type: string;
  capacity: number;
  status: string;
  company_id: string;
  created_at: string;
  companies?: {
    name: string;
  } | null;
}

export default function AdminFleetPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'ALL' | 'ACTIVE' | 'SUSPENDED' | 'PENDING'>('ALL')
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
  const [flagReason, setFlagReason] = useState('')
  const [flagSeverity, setFlagSeverity] = useState<'low' | 'medium' | 'high' | 'critical'>('medium')
  const [showFlagModal, setShowFlagModal] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    fetchVehicles()
  }, [])

  const fetchVehicles = async () => {
    setLoading(true)
    setError(null)
    try {
      // Fetch vehicles and join with companies
      const { data, error: fetchErr } = await supabase
        .from('vehicles')
        .select(`
          id, plate_number, model, type, capacity, status, company_id, created_at,
          companies ( name )
        `)
        .order('created_at', { ascending: false })

      if (fetchErr) throw fetchErr
      setVehicles((data as any) || [])
    } catch (err: any) {
      console.error('Error fetching fleet:', err)
      setError(err.message || 'Failed to retrieve vehicle data.')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    setActionLoading(true)
    setError(null)
    setSuccess(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Unauthorized admin user.')

      const { error: updateErr } = await supabase
        .from('vehicles')
        .update({ status: newStatus })
        .eq('id', id)

      if (updateErr) throw updateErr

      // Log action to audit_logs
      await supabase.from('audit_logs').insert({
        actor_id: user.id,
        actor_email: user.email,
        action: `update_vehicle_status_${newStatus.toLowerCase()}`,
        entity_type: 'vehicles',
        entity_id: id,
        new_value: { status: newStatus }
      })

      setVehicles(prev => prev.map(v => v.id === id ? { ...v, status: newStatus } : v))
      setSuccess(`Vehicle status successfully updated to ${newStatus}.`)
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: any) {
      console.error('Error updating vehicle status:', err)
      setError(err.message || 'Failed to update vehicle status.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleFlagVehicle = async () => {
    if (!selectedVehicle || !flagReason.trim()) return
    setActionLoading(true)
    setError(null)
    setSuccess(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Unauthorized admin user.')

      // Insert flag into fraud_flags
      const { error: flagErr } = await supabase
        .from('fraud_flags')
        .insert({
          entity_type: 'vehicle',
          entity_id: selectedVehicle.id,
          reason: flagReason,
          severity: flagSeverity,
          status: 'open',
          flagged_by: user.id
        })

      if (flagErr) throw flagErr

      // Also suspend vehicle
      const { error: suspendErr } = await supabase
        .from('vehicles')
        .update({ status: 'SUSPENDED' })
        .eq('id', selectedVehicle.id)

      if (suspendErr) throw suspendErr

      // Log actions to audit_logs
      await supabase.from('audit_logs').insert({
        actor_id: user.id,
        actor_email: user.email,
        action: 'flag_and_suspend_vehicle',
        entity_type: 'vehicles',
        entity_id: selectedVehicle.id,
        new_value: { status: 'SUSPENDED', flag_reason: flagReason, severity: flagSeverity }
      })

      setVehicles(prev => prev.map(v => v.id === selectedVehicle.id ? { ...v, status: 'SUSPENDED' } : v))
      setSuccess(`Vehicle ${selectedVehicle.plate_number} has been flagged and suspended.`)
      setShowFlagModal(false)
      setFlagReason('')
      setSelectedVehicle(null)
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: any) {
      console.error('Error flagging vehicle:', err)
      setError(err.message || 'Failed to flag vehicle.')
    } finally {
      setActionLoading(false)
    }
  }

  const filteredVehicles = vehicles.filter(v => {
    if (activeTab === 'ALL') return true
    return v.status.toUpperCase() === activeTab
  })

  return (
    <div style={{ fontFamily: "'Outfit','Inter',sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800&display=swap');`}</style>

      {/* Page Header */}
      <div style={{ marginBottom: 28 }}>
        <p style={{ fontSize: 13, color: '#94A3B8', marginBottom: 4 }}>Admin &gt; Operations</p>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>Fleet Management</h1>
        <p style={{ fontSize: 14, color: '#64748B', marginTop: 4 }}>Monitor and manage vehicles onboarding, safety verification, status, and fraud flagging across all transport operators.</p>
      </div>

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 14, borderRadius: 10, background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#B91C1C', fontSize: 13, marginBottom: 20 }}>
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 14, borderRadius: 10, background: '#F0FDF4', border: '1px solid #86EFAC', color: '#166534', fontSize: 13, marginBottom: 20 }}>
          <Check size={16} />
          <span>{success}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, borderBottom: '1px solid #E2E8F0', paddingBottom: 10 }}>
        {(['ALL', 'ACTIVE', 'PENDING', 'SUSPENDED'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '8px 16px',
              border: 'none',
              background: activeTab === tab ? '#16A34A' : 'transparent',
              color: activeTab === tab ? '#FFFFFF' : '#64748B',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Vehicle Grid / Table */}
      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#64748B' }}>
          <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px' }} />
          <p>Retrieving fleet records...</p>
        </div>
      ) : filteredVehicles.length === 0 ? (
        <div style={{ background: '#FFFFFF', padding: 48, borderRadius: 16, border: '1px solid #E2E8F0', textAlign: 'center', color: '#64748B' }}>
          <Truck size={48} style={{ color: '#CBD5E1', margin: '0 auto 16px' }} />
          <p style={{ fontWeight: 600 }}>No vehicles found</p>
          <p style={{ fontSize: 13, color: '#94A3B8', marginTop: 4 }}>There are no registered vehicles matching the selected status.</p>
        </div>
      ) : (
        <div style={{ background: '#FFFFFF', borderRadius: 16, border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
          <div className="mt-table-wrap">
<table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                <th style={{ padding: '14px 20px', color: '#475569', fontWeight: 700 }}>Plate Number</th>
                <th style={{ padding: '14px 20px', color: '#475569', fontWeight: 700 }}>Model / Make</th>
                <th style={{ padding: '14px 20px', color: '#475569', fontWeight: 700 }}>Type</th>
                <th style={{ padding: '14px 20px', color: '#475569', fontWeight: 700 }}>Capacity</th>
                <th style={{ padding: '14px 20px', color: '#475569', fontWeight: 700 }}>Operator Company</th>
                <th style={{ padding: '14px 20px', color: '#475569', fontWeight: 700 }}>Status</th>
                <th style={{ padding: '14px 20px', color: '#475569', fontWeight: 700, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredVehicles.map(v => (
                <tr key={v.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '14px 20px', fontWeight: 700, color: '#0F172A' }}>{v.plate_number}</td>
                  <td style={{ padding: '14px 20px', color: '#334155' }}>{v.model}</td>
                  <td style={{ padding: '14px 20px', color: '#475569', textTransform: 'capitalize' }}>{v.type}</td>
                  <td style={{ padding: '14px 20px', color: '#334155' }}>{v.capacity} seats</td>
                  <td style={{ padding: '14px 20px', color: '#334155', fontWeight: 600 }}>{v.companies?.name || 'Unknown Partner'}</td>
                  <td style={{ padding: '14px 20px' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '3px 8px',
                      borderRadius: 999,
                      fontSize: 11,
                      fontWeight: 700,
                      background: v.status.toUpperCase() === 'ACTIVE' ? '#DCFCE7' : v.status.toUpperCase() === 'PENDING' ? '#FEF9C3' : '#FEE2E2',
                      color: v.status.toUpperCase() === 'ACTIVE' ? '#15803D' : v.status.toUpperCase() === 'PENDING' ? '#854D0E' : '#991B1B'
                    }}>
                      {v.status.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      {v.status.toUpperCase() === 'PENDING' && (
                        <button
                          onClick={() => handleUpdateStatus(v.id, 'ACTIVE')}
                          disabled={actionLoading}
                          style={{
                            padding: '4px 8px',
                            background: '#16A34A',
                            color: '#FFFFFF',
                            border: 'none',
                            borderRadius: 6,
                            cursor: 'pointer',
                            fontSize: 11,
                            fontWeight: 600
                          }}
                        >
                          Approve
                        </button>
                      )}
                      {v.status.toUpperCase() !== 'SUSPENDED' ? (
                        <button
                          onClick={() => {
                            setSelectedVehicle(v)
                            setShowFlagModal(true)
                          }}
                          disabled={actionLoading}
                          style={{
                            padding: '4px 8px',
                            background: '#DC2626',
                            color: '#FFFFFF',
                            border: 'none',
                            borderRadius: 6,
                            cursor: 'pointer',
                            fontSize: 11,
                            fontWeight: 600
                          }}
                        >
                          Flag/Suspend
                        </button>
                      ) : (
                        <button
                          onClick={() => handleUpdateStatus(v.id, 'ACTIVE')}
                          disabled={actionLoading}
                          style={{
                            padding: '4px 8px',
                            background: '#2563EB',
                            color: '#FFFFFF',
                            border: 'none',
                            borderRadius: 6,
                            cursor: 'pointer',
                            fontSize: 11,
                            fontWeight: 600
                          }}
                        >
                          Reactivate
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
</div>
        </div>
      )}

      {/* Flag / Suspend Modal */}
      {showFlagModal && selectedVehicle && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{ background: '#FFFFFF', borderRadius: 16, width: '100%', maxWidth: 450, padding: 24, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 8 }}>
                <ShieldAlert style={{ color: '#DC2626' }} />
                Flag & Suspend Vehicle
              </h3>
              <button onClick={() => setShowFlagModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: 13, color: '#64748B', marginBottom: 16 }}>
              You are flagging the vehicle with plate number <strong style={{ color: '#0F172A' }}>{selectedVehicle.plate_number}</strong>. This will automatically suspend the vehicle and block it from being assigned to any new trips.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6 }}>Flag Severity</label>
                <select
                  value={flagSeverity}
                  onChange={e => setFlagSeverity(e.target.value as any)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
                >
                  <option value="low">Low - Minor Non-compliance</option>
                  <option value="medium">Medium - Safety/Paperwork issues</option>
                  <option value="high">High - Suspected Fraud/Breach</option>
                  <option value="critical">Critical - Danger to passengers/Illegal</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6 }}>Reason for Flagging</label>
                <textarea
                  value={flagReason}
                  onChange={e => setFlagReason(e.target.value)}
                  placeholder="Enter details on safety violation, expired paperwork, or driver conduct..."
                  rows={4}
                  style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, resize: 'vertical' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifySelf: 'flex-end', gap: 10 }}>
              <button
                onClick={() => setShowFlagModal(false)}
                style={{ padding: '8px 16px', background: '#F1F5F9', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#475569', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleFlagVehicle}
                disabled={actionLoading || !flagReason.trim()}
                style={{ padding: '8px 16px', background: '#DC2626', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#FFFFFF', cursor: 'pointer', opacity: actionLoading || !flagReason.trim() ? 0.7 : 1 }}
              >
                {actionLoading ? 'Flagging...' : 'Confirm Flag & Suspend'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
