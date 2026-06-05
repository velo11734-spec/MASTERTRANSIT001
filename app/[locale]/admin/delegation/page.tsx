'use client'

import React, { useState, useEffect } from 'react'
import { Users, Search, UserPlus, ShieldAlert, X, Check } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

type Staff = {
  id: string
  full_name: string
  role: string
  permissions: any
}

export default function AdminDelegationPage() {
  const [staff, setStaff] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)
  const [searchEmail, setSearchEmail] = useState('')
  const [searching, setSearching] = useState(false)
  const [foundUser, setFoundUser] = useState<any>(null)
  const [selectedRole, setSelectedRole] = useState('admin_staff')

  const roles = [
    { id: 'verification_officer', label: 'Verification Officer', desc: 'Can review and approve company documents' },
    { id: 'financial_auditor', label: 'Financial Auditor', desc: 'Can review payouts and transaction logs' },
    { id: 'support_manager', label: 'Support Manager', desc: 'Can handle escalated passenger disputes' },
  ]

  useEffect(() => {
    fetchStaff()
  }, [])

  const fetchStaff = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, role, permissions')
      .eq('parent_id', user.id)

    if (!error && data) {
      setStaff(data as any)
    }
    setLoading(false)
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchEmail) return

    setSearching(true)
    setFoundUser(null)

    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, role')
      .eq('email', searchEmail.toLowerCase())
      .single()

    if (data) {
      setFoundUser(data)
    } else {
      alert('User not found. They must register as a passenger first before you can delegate them.')
    }
    setSearching(false)
  }

  const handleDelegate = async () => {
    if (!foundUser) return
    const { data: { user } } = await supabase.auth.getUser()
    
    const { error } = await supabase
      .from('profiles')
      .update({
        role: 'admin', // General admin role for middleware bypass
        parent_id: user?.id,
        permissions: { specific_role: selectedRole }
      })
      .eq('id', foundUser.id)

    if (!error) {
      alert('Admin staff successfully delegated!')
      setFoundUser(null)
      setSearchEmail('')
      fetchStaff()
    } else {
      alert('Failed to delegate user.')
    }
  }

  const removeStaff = async (staffId: string) => {
    if (!confirm('Are you sure you want to revoke this admin access?')) return
    
    const { error } = await supabase
      .from('profiles')
      .update({
        role: 'passenger', // Revert to basic role
        parent_id: null,
        permissions: {}
      })
      .eq('id', staffId)

    if (!error) {
      fetchStaff()
    }
  }

  return (
    <div style={{ background: '#F8FAFC', minHeight: '100vh', padding: '24px 20px' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#0F172A', fontFamily: 'Outfit, sans-serif' }}>System Administrator Delegation</h1>
          <p style={{ fontSize: 15, color: '#64748B', marginTop: 4 }}>Assign specific administrative capabilities to trusted staff members.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
          
          {/* Delegate New Admin */}
          <div className="mt-card" style={{ padding: 24, alignSelf: 'start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
              <div style={{ width: 40, height: 40, background: '#FEF2F2', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#DC2626' }}>
                <ShieldAlert size={20} />
              </div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0F172A' }}>Elevate User</h2>
            </div>

            <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                <input 
                  type="email" 
                  value={searchEmail}
                  onChange={e => setSearchEmail(e.target.value)}
                  placeholder="Enter user email address" 
                  className="mt-input" 
                  style={{ paddingLeft: 36, width: '100%' }}
                  required
                />
              </div>
              <button type="submit" disabled={searching} className="mt-btn-primary" style={{ padding: '0 20px', background: '#0F172A' }}>
                {searching ? '...' : 'Lookup'}
              </button>
            </form>

            {foundUser && (
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div>
                    <p style={{ fontWeight: 600, color: '#0F172A' }}>{foundUser.full_name}</p>
                    <p style={{ fontSize: 13, color: '#64748B' }}>Current Role: {foundUser.role}</p>
                  </div>
                  <Check size={20} color="#16A34A" />
                </div>
                
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 8 }}>Assign Administrative Role</label>
                <select value={selectedRole} onChange={e => setSelectedRole(e.target.value)} className="mt-input" style={{ marginBottom: 16, width: '100%' }}>
                  {roles.map(r => (
                    <option key={r.id} value={r.id}>{r.label}</option>
                  ))}
                </select>

                <button onClick={handleDelegate} className="mt-btn-primary" style={{ width: '100%', padding: '12px', background: '#DC2626' }}>
                  Grant Admin Access
                </button>
              </div>
            )}
          </div>

          {/* Active Admin List */}
          <div className="mt-card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
              <div style={{ width: 40, height: 40, background: '#F1F5F9', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B' }}>
                <Users size={20} />
              </div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0F172A' }}>Active Administrators</h2>
            </div>

            {loading ? (
              <p style={{ color: '#94A3B8', fontSize: 14 }}>Loading administrators...</p>
            ) : staff.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <Users size={32} color="#CBD5E1" style={{ margin: '0 auto 12px' }} />
                <p style={{ color: '#64748B', fontSize: 14 }}>No sub-administrators delegated yet.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {staff.map(s => (
                  <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 16, border: '1px solid #F1F5F9', borderRadius: 8 }}>
                    <div>
                      <p style={{ fontWeight: 600, color: '#0F172A', marginBottom: 4 }}>{s.full_name}</p>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#DC2626', background: '#FEF2F2', padding: '4px 8px', borderRadius: 12 }}>
                        {roles.find(r => r.id === s.permissions?.specific_role)?.label || 'Admin'}
                      </span>
                    </div>
                    <button onClick={() => removeStaff(s.id)} style={{ background: '#FEF2F2', border: 'none', color: '#DC2626', width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
