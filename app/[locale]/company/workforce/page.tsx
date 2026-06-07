'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Plus, Users, Shield, Send, Loader, Trash, Edit, Check } from 'lucide-react'

export default function WorkforceManagement() {
  const [employees, setEmployees] = useState<any[]>([])
  const [departments, setDepartments] = useState<any[]>([])
  const [roles, setRoles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // State for invite modal
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteDept, setInviteDept] = useState('')
  const [inviteRole, setInviteRole] = useState('')

  // Company tracking
  const [company, setCompany] = useState<any>(null)

  useEffect(() => {
    async function init() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user) return

        // Fetch company
        const { data: comp } = await supabase
          .from('companies')
          .select('*')
          .eq('owner_id', session.user.id)
          .maybeSingle()

        if (!comp) return
        setCompany(comp)

        // Fetch staff members
        const { data: staff } = await supabase
          .from('company_staff')
          .select('*, departments(name), company_roles(name), profiles(*)')
          .eq('company_id', comp.id)
        setEmployees(staff || [])

        // Fetch departments
        const { data: depts } = await supabase
          .from('departments')
          .select('*')
          .eq('company_id', comp.id)
        setDepartments(depts || [])

        // Fetch custom roles
        const { data: roleList } = await supabase
          .from('company_roles')
          .select('*')
          .eq('company_id', comp.id)
        setRoles(roleList || [])

      } catch (err) {
        console.error('Error loading workforce context:', err)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!company) return
    try {
      const { error } = await supabase
        .from('staff_invitations')
        .insert({
          company_id: company.id,
          email: inviteEmail,
          department_id: inviteDept || null,
          role_id: inviteRole || null,
          token: Math.random().toString(36).substring(2, 15),
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        })

      if (error) throw error
      alert(`Invitation sent to ${inviteEmail}`)
      setShowInviteModal(false)
      setInviteEmail('')
    } catch (err: any) {
      alert(err.message || 'Failed to send invitation')
    }
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Loader className="spin" size={32} color="#16A34A" style={{ margin: '0 auto 12px' }} />
        <p style={{ color: '#64748B' }}>Loading Workforce System...</p>
      </div>
    )
  }

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: '#0F172A', fontFamily: 'Outfit, sans-serif' }}>Workforce & Roles</h1>
          <p style={{ fontSize: 13, color: '#64748B' }}>Manage your internal organization, departments, and staff permissions.</p>
        </div>
        <button onClick={() => setShowInviteModal(true)} className="mt-btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Plus size={16} />
          Invite Staff Member
        </button>
      </div>

      {/* Grid of stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 28 }}>
        <div className="mt-card" style={{ padding: 20 }}>
          <span style={{ fontSize: 12, color: '#64748B', textTransform: 'uppercase', fontWeight: 600 }}>Active Staff</span>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
            <strong style={{ fontSize: 28, color: '#0F172A', fontFamily: 'Outfit, sans-serif' }}>{employees.length}</strong>
            <div style={{ padding: 8, background: '#DCFCE7', borderRadius: 8, color: '#16A34A' }}>
              <Users size={20} />
            </div>
          </div>
        </div>

        <div className="mt-card" style={{ padding: 20 }}>
          <span style={{ fontSize: 12, color: '#64748B', textTransform: 'uppercase', fontWeight: 600 }}>Departments</span>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
            <strong style={{ fontSize: 28, color: '#0F172A', fontFamily: 'Outfit, sans-serif' }}>{departments.length}</strong>
            <div style={{ padding: 8, background: '#EFF6FF', borderRadius: 8, color: '#1D4ED8' }}>
              <Shield size={20} />
            </div>
          </div>
        </div>
      </div>

      {/* Employees Table */}
      <div className="mt-card" style={{ padding: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', marginBottom: 16, fontFamily: 'Outfit, sans-serif' }}>Team Members</h3>
        {employees.length === 0 ? (
          <p style={{ color: '#64748B', fontSize: 13 }}>No active employees found. Invite your first employee to get started.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #E2E8F0', textAlign: 'left' }}>
                  <th style={{ padding: '12px 8px', color: '#475569' }}>Name / Email</th>
                  <th style={{ padding: '12px 8px', color: '#475569' }}>Department</th>
                  <th style={{ padding: '12px 8px', color: '#475569' }}>Role</th>
                  <th style={{ padding: '12px 8px', color: '#475569' }}>Status</th>
                  <th style={{ padding: '12px 8px', color: '#475569', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((member) => (
                  <tr key={member.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '12px 8px' }}>
                      <strong style={{ display: 'block', color: '#0F172A' }}>{member.profiles?.full_name || 'Awaiting Setup'}</strong>
                      <span style={{ fontSize: 11, color: '#94A3B8' }}>{member.profiles?.email || 'Awaiting activation'}</span>
                    </td>
                    <td style={{ padding: '12px 8px', color: '#475569' }}>{member.departments?.name || 'Unassigned'}</td>
                    <td style={{ padding: '12px 8px', color: '#475569' }}>{member.company_roles?.name || 'Staff Member'}</td>
                    <td style={{ padding: '12px 8px' }}>
                      <span style={{ fontSize: 10, background: '#DCFCE7', color: '#15803D', fontWeight: 700, padding: '2px 6px', borderRadius: 4 }}>
                        {member.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                      <button className="mt-btn-outline" style={{ padding: '4px 8px', fontSize: 11 }}>Suspend</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div className="mt-card" style={{ maxWidth: 440, width: '100%', padding: 28, background: '#FFFFFF' }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', marginBottom: 16, fontFamily: 'Outfit, sans-serif' }}>Invite Team Member</h3>
            <form onSubmit={handleSendInvite} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label className="mt-label">Employee Email Address</label>
                <input type="email" required placeholder="name@company.com" className="mt-input" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} />
              </div>

              <div>
                <label className="mt-label">Assign Department</label>
                <select className="mt-input" value={inviteDept} onChange={e => setInviteDept(e.target.value)}>
                  <option value="">Unassigned</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mt-label">Assign Custom Role</label>
                <select className="mt-input" value={inviteRole} onChange={e => setInviteRole(e.target.value)}>
                  <option value="">Default (Staff Member)</option>
                  {roles.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button type="submit" className="mt-btn-primary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <Send size={14} />
                  Send Invitation
                </button>
                <button type="button" onClick={() => setShowInviteModal(false)} className="mt-btn-outline" style={{ flex: 1 }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
