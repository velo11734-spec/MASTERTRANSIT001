'use client'

import React, { useState, useEffect } from 'react'
import { Users, Search, UserPlus, Shield, X, Check } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

type Staff = {
  id: string
  full_name: string
  role: string
  permissions: any
}

export default function CompanyDelegationPage() {
  const [staff, setStaff] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)
  const [searchEmail, setSearchEmail] = useState('')
  const [searching, setSearching] = useState(false)
  const [foundUser, setFoundUser] = useState<any>(null)
  const [selectedRole, setSelectedRole] = useState('company_staff')

  const roles = [
    { id: 'terminal_manager', label: 'Terminal Manager', desc: 'Can schedule trips and manage fleet' },
    { id: 'ticket_validator', label: 'Ticket Validator', desc: 'Can scan and validate passenger tickets' },
    { id: 'support_staff', label: 'Support Agent', desc: 'Can respond to passenger queries' },
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

    // Note: In production, fetching user by email securely requires a dedicated edge function or backend route to prevent scraping.
    // For this demo, assuming RLS allows checking if an email exists or we use a custom RPC.
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
        role: 'company_staff',
        parent_id: user?.id,
        permissions: { specific_role: selectedRole }
      })
      .eq('id', foundUser.id)

    if (!error) {
      alert('Staff successfully delegated!')
      setFoundUser(null)
      setSearchEmail('')
      fetchStaff()
    } else {
      alert('Failed to delegate user.')
    }
  }

  const removeStaff = async (staffId: string) => {
    if (!confirm('Are you sure you want to remove this staff member?')) return
    
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
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#0F172A', fontFamily: 'Outfit, sans-serif' }}>Staff Delegation</h1>
          <p style={{ fontSize: 15, color: '#64748B', marginTop: 4 }}>Assign specific roles and permissions to your employees.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
          
          {/* Delegate New Staff */}
          <div className="mt-card" style={{ padding: 24, alignSelf: 'start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
              <div style={{ width: 40, height: 40, background: '#EFF6FF', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3B82F6' }}>
                <UserPlus size={20} />
              </div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0F172A' }}>Add New Staff</h2>
            </div>

            <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                <input 
                  type="email" 
                  value={searchEmail}
                  onChange={e => setSearchEmail(e.target.value)}
                  placeholder="Enter staff email address" 
                  className="mt-input" 
                  style={{ paddingLeft: 36, width: '100%' }}
                  required
                />
              </div>
              <button type="submit" disabled={searching} className="mt-btn-primary" style={{ padding: '0 20px' }}>
                {searching ? '...' : 'Search'}
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
                
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 8 }}>Assign Role</label>
                <select value={selectedRole} onChange={e => setSelectedRole(e.target.value)} className="mt-input" style={{ marginBottom: 16, width: '100%' }}>
                  {roles.map(r => (
                    <option key={r.id} value={r.id}>{r.label}</option>
                  ))}
                </select>

                <button onClick={handleDelegate} className="mt-btn-primary" style={{ width: '100%', padding: '12px', background: '#3B82F6' }}>
                  Confirm Delegation
                </button>
              </div>
            )}
          </div>

          {/* Active Staff List */}
          <div className="mt-card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
              <div style={{ width: 40, height: 40, background: '#F1F5F9', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B' }}>
                <Users size={20} />
              </div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0F172A' }}>Active Staff</h2>
            </div>

            {loading ? (
              <p style={{ color: '#94A3B8', fontSize: 14 }}>Loading staff...</p>
            ) : staff.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <Shield size={32} color="#CBD5E1" style={{ margin: '0 auto 12px' }} />
                <p style={{ color: '#64748B', fontSize: 14 }}>No staff members delegated yet.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {staff.map(s => (
                  <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 16, border: '1px solid #F1F5F9', borderRadius: 8 }}>
                    <div>
                      <p style={{ fontWeight: 600, color: '#0F172A', marginBottom: 4 }}>{s.full_name}</p>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#3B82F6', background: '#EFF6FF', padding: '4px 8px', borderRadius: 12 }}>
                        {roles.find(r => r.id === s.permissions?.specific_role)?.label || 'Staff'}
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
