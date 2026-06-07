'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Settings, ShieldCheck, UserCheck, AlertCircle, Plus, Trash2 } from 'lucide-react'

export default function SettingsPage() {
  const [company, setCompany] = useState<any>(null)
  const [bankDetails, setBankDetails] = useState<any>(null)
  const [team, setTeam] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Edit states
  const [companyName, setCompanyName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [cac, setCac] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  // Team invite states
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('manager')
  const [inviteSubmitting, setInviteSubmitting] = useState(false)

  useEffect(() => {
    async function loadSettings() {
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
          setCompanyName(comp.name)
          setPhone(comp.phone || '')
          setAddress(comp.address || '')
          setCac(comp.cac_number || '')

          // Fetch Bank Details
          const { data: bank } = await supabase
            .from('company_bank_details')
            .select('*')
            .eq('company_id', comp.id)
            .maybeSingle()
          setBankDetails(bank)

          // Fetch Team Members
          const { data: teamData } = await supabase
            .from('company_team_members')
            .select('*')
            .eq('company_id', comp.id)
          setTeam(teamData || [])
        }
      } catch (err) {
        console.error('Failed to load company settings:', err)
      } finally {
        setLoading(false)
      }
    }

    loadSettings()
  }, [])

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!company) return

    setSuccess(false)
    setSubmitting(true)

    try {
      const { error } = await supabase
        .from('companies')
        .update({
          name: companyName,
          phone,
          address
        })
        .eq('id', company.id)

      if (error) throw error

      setSuccess(true)
    } catch (err) {
      console.error('Failed to update company settings profile:', err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!company) return

    setInviteSubmitting(true)
    try {
      // Find user matching email from profiles if exists
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', inviteEmail)
        .maybeSingle()

      if (!profile) {
        alert('No registered RoutePro user profile matches that email. Ask the teammate to register on RoutePro first.')
        setInviteSubmitting(false)
        return
      }

      const { data: newMember, error } = await supabase
        .from('company_team_members')
        .insert({
          company_id: company.id,
          user_id: profile.id,
          role: inviteRole,
          status: 'active',
          accepted_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error

      setTeam(prev => [...prev, newMember])
      setInviteEmail('')
      alert('Teammate successfully added to workspace!')
    } catch (err: any) {
      console.error('Invite member error:', err)
      alert(err.message || 'Failed to add teammate.')
    } finally {
      setInviteSubmitting(false)
    }
  }

  const handleRemoveMember = async (id: string) => {
    if (!confirm('Are you sure you want to revoke this user\'s workspace access?')) return
    try {
      const { error } = await supabase
        .from('company_team_members')
        .delete()
        .eq('id', id)

      if (error) throw error

      setTeam(prev => prev.filter(m => m.id !== id))
    } catch (err) {
      console.error('Failed to remove teammate:', err)
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div className="skeleton" style={{ height: 48, width: '40%' }} />
        <div className="skeleton" style={{ height: 320, borderRadius: 12 }} />
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }} className="fade-in">
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 900, color: '#0F172A', fontFamily: 'Outfit, sans-serif' }}>Operating Settings</h1>
        <p style={{ fontSize: 13, color: '#64748B' }}>Manage your workspace information, view CAC records, and authorize team accounts</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
        {/* Settings Forms */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Main Info */}
          <form onSubmit={handleUpdateProfile} className="mt-card" style={{ padding: 28, background: '#FFFFFF', borderRadius: 12 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', marginBottom: 20, fontFamily: 'Outfit, sans-serif' }}>Workspace Profile</h3>

            {success && (
              <div style={{ background: '#DCFCE7', color: '#15803D', padding: 12, borderRadius: 8, fontSize: 13, marginBottom: 16 }}>
                Settings profile updated successfully.
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <label className="mt-label">Workspace Display Name *</label>
                <input
                  type="text"
                  required
                  className="mt-input"
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                />
              </div>
              <div>
                <label className="mt-label">CAC Registry Number (Locked)</label>
                <input
                  type="text"
                  disabled
                  className="mt-input"
                  style={{ background: '#F8FAFC', cursor: 'not-allowed', color: '#94A3B8' }}
                  value={cac}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
              <div>
                <label className="mt-label">Operational Contact Phone *</label>
                <input
                  type="tel"
                  required
                  className="mt-input"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                />
              </div>
              <div>
                <label className="mt-label">Business Address *</label>
                <input
                  type="text"
                  required
                  className="mt-input"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                />
              </div>
            </div>

            <button type="submit" disabled={submitting} className="mt-btn-primary btn-press" style={{ height: 40 }}>
              {submitting ? 'Saving...' : 'Save Settings'}
            </button>
          </form>

          {/* Settlements Account */}
          <div className="mt-card" style={{ padding: 28, background: '#FFFFFF', borderRadius: 12 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', marginBottom: 20, fontFamily: 'Outfit, sans-serif' }}>Payout Settlement Account</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label className="mt-label">Bank Name</label>
                <input
                  type="text"
                  disabled
                  className="mt-input"
                  style={{ background: '#F8FAFC', cursor: 'not-allowed', color: '#94A3B8' }}
                  value={bankDetails?.bank_name || ' Zenith Bank PLC'}
                />
              </div>
              <div>
                <label className="mt-label">Account Number</label>
                <input
                  type="text"
                  disabled
                  className="mt-input"
                  style={{ background: '#F8FAFC', cursor: 'not-allowed', color: '#94A3B8' }}
                  value={bankDetails?.account_number || '1012345678'}
                />
              </div>
            </div>
            <div style={{ marginTop: 12 }}>
              <label className="mt-label">Account Beneficiary Name</label>
              <input
                type="text"
                disabled
                className="mt-input"
                style={{ background: '#F8FAFC', cursor: 'not-allowed', color: '#94A3B8', width: '100%' }}
                value={bankDetails?.account_name || company?.name}
              />
            </div>
          </div>
        </div>

        {/* Team Management Sidebar Column */}
        <div>
          <div className="mt-card" style={{ padding: 24, background: '#FFFFFF', borderRadius: 12 }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', marginBottom: 16, fontFamily: 'Outfit, sans-serif' }}>Teammate Workspaces</h3>

            {/* Teammates List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
              {team.length === 0 ? (
                <p style={{ fontSize: 12, color: '#94A3B8' }}>No teammates onboarded yet.</p>
              ) : (
                team.map(m => (
                  <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC', padding: 8, borderRadius: 8 }}>
                    <div>
                      <span style={{ fontSize: 11, color: '#64748B', display: 'block', textTransform: 'capitalize' }}>Role: {m.role}</span>
                    </div>
                    <button
                      onClick={() => handleRemoveMember(m.id)}
                      style={{ background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer', padding: 4 }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Invite Teammate */}
            <form onSubmit={handleInviteMember} style={{ borderTop: '1px solid #F1F5F9', paddingTop: 16 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#16A34A', display: 'block', marginBottom: 12 }}>Add Teammate</span>
              <div style={{ marginBottom: 10 }}>
                <label className="mt-label">User Email *</label>
                <input
                  type="email"
                  required
                  placeholder="teammate@routepro.ng"
                  className="mt-input"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label className="mt-label">Workspace Role *</label>
                <select className="mt-input" value={inviteRole} onChange={e => setInviteRole(e.target.value)}>
                  <option value="manager">Manager</option>
                  <option value="operations">Operations Officer</option>
                  <option value="fleet_manager">Fleet Manager</option>
                  <option value="accountant">Accountant</option>
                </select>
              </div>
              <button type="submit" disabled={inviteSubmitting} className="mt-btn-outline btn-press" style={{ width: '100%', padding: 8, fontSize: 12 }}>
                {inviteSubmitting ? 'Adding...' : 'Add Teammate'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
