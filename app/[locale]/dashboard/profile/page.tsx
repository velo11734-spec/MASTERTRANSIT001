'use client'

import { useState, useEffect } from 'react'
import { User, Mail, Phone, MapPin, Shield, Camera } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

export default function ProfilePage() {
  const [profile, setProfile] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [userRole, setUserRole] = useState('passenger')
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    async function loadProfile() {
      try {
        const { data: { user }, error: userErr } = await supabase.auth.getUser()
        if (userErr || !user) {
          window.location.href = '/en/login'
          return
        }

        setUserId(user.id)
        
        // Fetch from profiles table
        const { data: dbProfile, error: dbErr } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        const meta = user.user_metadata || {}
        
        setProfile({
          fullName: dbProfile?.full_name || meta.full_name || '',
          email: user.email || '',
          phone: dbProfile?.phone || meta.phone || '',
          address: meta.address || '',
        })
        setUserRole(dbProfile?.role || meta.role || 'passenger')
      } catch (err: any) {
        console.error('Error loading profile:', err)
        setError('Failed to load profile data.')
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId) return
    
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      // 1. Update Supabase Auth user metadata
      const { error: authErr } = await supabase.auth.updateUser({
        data: {
          full_name: profile.fullName,
          phone: profile.phone,
          address: profile.address
        }
      })
      if (authErr) throw authErr

      // 2. Upsert public.profiles table
      const { error: profileErr } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          full_name: profile.fullName,
          phone: profile.phone,
        })
      if (profileErr) throw profileErr

      setSuccess('Profile updated successfully!')
    } catch (err: any) {
      console.error('Error saving profile:', err)
      setError(err.message || 'Failed to update profile settings.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div style={{ background: '#F8FAFC', minHeight: '100vh', padding: '100px 20px', textAlign: 'center', color: '#64748B' }}>
        <p style={{ fontSize: 16, fontWeight: 500 }}>Loading profile data...</p>
      </div>
    )
  }

  const getInitials = (name: string) => {
    if (!name) return 'U'
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  }

  return (
    <div style={{ background: '#F8FAFC', minHeight: '100vh', padding: '24px 20px' }}>
      <div style={{ maxWidth: 780, margin: '0 auto' }}>

        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', fontFamily: 'Outfit, sans-serif' }}>My Profile</h1>
          <p style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>Manage your personal information and security settings</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 24, alignItems: 'start' }}>
          
          {/* Left Column - Avatar & Quick Info */}
          <div className="mt-card" style={{ padding: 24, textAlign: 'center' }}>
            <div style={{ position: 'relative', width: 96, height: 96, margin: '0 auto 16px' }}>
              <div style={{ width: '100%', height: '100%', background: '#16A34A', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 32, fontWeight: 700 }}>
                {getInitials(profile.fullName)}
              </div>
              <button style={{ position: 'absolute', bottom: 0, right: 0, width: 32, height: 32, background: 'white', border: '1px solid #E2E8F0', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748B', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                <Camera size={16} />
              </button>
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>{profile.fullName || 'User'}</h2>
            <p style={{ fontSize: 13, color: '#64748B', marginBottom: 16, textTransform: 'capitalize' }}>{userRole.replace('_', ' ')}</p>
            <div style={{ background: '#F1F5F9', borderRadius: 8, padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 12, color: '#475569', fontWeight: 500 }}>
              <Shield size={14} color="#16A34A" /> Account Verified
            </div>
          </div>

          {/* Right Column - Form */}
          <div className="mt-card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', marginBottom: 20, paddingBottom: 12, borderBottom: '1px solid #F1F5F9' }}>Personal Information</h3>
            
            {error && (
              <div style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#DC2626' }}>
                {error}
              </div>
            )}
            {success && (
              <div style={{ background: '#DCFCE7', border: '1px solid #86EFAC', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#15803D' }}>
                {success}
              </div>
            )}

            <form onSubmit={handleSave} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label className="mt-label">Full Name</label>
                <div style={{ position: 'relative' }}>
                  <User size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                  <input type="text" value={profile.fullName} onChange={e => setProfile({...profile, fullName: e.target.value})} required className="mt-input" style={{ paddingLeft: 36 }} />
                </div>
              </div>

              <div>
                <label className="mt-label">Email Address</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                  <input type="email" value={profile.email} disabled className="mt-input" style={{ paddingLeft: 36, background: '#F8FAFC', color: '#94A3B8' }} />
                </div>
              </div>

              <div>
                <label className="mt-label">Phone Number</label>
                <div style={{ position: 'relative' }}>
                  <Phone size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                  <input type="tel" value={profile.phone} onChange={e => setProfile({...profile, phone: e.target.value})} className="mt-input" style={{ paddingLeft: 36 }} />
                </div>
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label className="mt-label">Address</label>
                <div style={{ position: 'relative' }}>
                  <MapPin size={15} style={{ position: 'absolute', left: 12, top: '12px', color: '#94A3B8' }} />
                  <textarea value={profile.address} onChange={e => setProfile({...profile, address: e.target.value})} className="mt-input" style={{ paddingLeft: 36, minHeight: 80, paddingTop: 10 }} />
                </div>
              </div>

              <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 12, paddingTop: 20, borderTop: '1px solid #F1F5F9' }}>
                <button type="button" onClick={() => window.location.reload()} className="mt-btn-outline">Reset</button>
                <button type="submit" disabled={saving} className="mt-btn-primary">
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>

        </div>

      </div>
    </div>
  )
}

