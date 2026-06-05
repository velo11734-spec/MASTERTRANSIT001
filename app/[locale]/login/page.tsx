'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })
      if (authError) throw authError

      if (data.user) {
        let { data: profile, error: profileErr } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single()

        // If profile row is missing, automatically create it
        if (profileErr || !profile) {
          const metaRole = data.user.user_metadata?.role || 'passenger'
          const finalRole = email.toLowerCase() === 'olaideheritagetemitope@gmail.com' ? 'super_admin' : metaRole
          
          const { data: newProfile, error: upsertErr } = await supabase
            .from('profiles')
            .upsert({
              id: data.user.id,
              full_name: data.user.user_metadata?.full_name || 'Passenger',
              phone: data.user.user_metadata?.phone || '',
              role: finalRole
            })
            .select('role')
            .single()
            
          if (!upsertErr && newProfile) {
            profile = newProfile
            profileErr = null
          }
        }

        const role = profile?.role || data.user.user_metadata?.role || 'passenger'
        
        if (email.toLowerCase() === 'olaideheritagetemitope@gmail.com' || role === 'super_admin' || role === 'admin') {
          router.push('/en/admin')
        } else if (role === 'company_owner' || role === 'company_staff' || role === 'company') {
          router.push('/en/company/dashboard')
        } else {
          router.push('/en/dashboard')
        }
      } else {
        router.push('/en/dashboard')
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' }}>
      <div style={{ width: '100%', maxWidth: 420 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Link href="/en" style={{ display: 'inline-block', textDecoration: 'none' }}>
            <span className="rp-sand-wrap" style={{ display: 'inline-block', position: 'relative', height: 44 }}>
              <img src="/routepro-logo-clean.png" alt="RoutePro" className="rp-logo-base" style={{ height: 44, width: 'auto', maxWidth: 200, objectFit: 'contain', display: 'block', position: 'relative' }} draggable={false} />
              <img src="/routepro-logo-clean.png" alt="" aria-hidden="true" className="rp-dust-1" style={{ height: 44, width: 'auto', maxWidth: 200, objectFit: 'contain', display: 'block', position: 'absolute', top: 0, left: 0 }} draggable={false} />
              <img src="/routepro-logo-clean.png" alt="" aria-hidden="true" className="rp-dust-2" style={{ height: 44, width: 'auto', maxWidth: 200, objectFit: 'contain', display: 'block', position: 'absolute', top: 0, left: 0 }} draggable={false} />
              <img src="/routepro-logo-clean.png" alt="" aria-hidden="true" className="rp-dust-3" style={{ height: 44, width: 'auto', maxWidth: 200, objectFit: 'contain', display: 'block', position: 'absolute', top: 0, left: 0 }} draggable={false} />
            </span>
          </Link>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0F172A', marginTop: 20, marginBottom: 6 }}>Welcome back</h1>
          <p style={{ fontSize: 14, color: '#64748B' }}>Sign in to your RoutePro account</p>
        </div>

        {/* Card */}
        <div className="mt-card" style={{ padding: 28 }}>
          {error && (
            <div style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#DC2626' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label className="mt-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="mt-input"
                  style={{ paddingLeft: 38 }}
                />
              </div>
            </div>

            <div>
              <label className="mt-label">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="mt-input"
                  style={{ paddingLeft: 38, paddingRight: 42 }}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <div style={{ textAlign: 'right', marginTop: 4 }}>
                <Link href="/en/forgot-password" style={{ fontSize: 12, color: '#16A34A', textDecoration: 'none', fontWeight: 500 }}>
                  Forgot Password?
                </Link>
              </div>
            </div>

            <button type="submit" disabled={loading} className="mt-btn-primary" style={{ width: '100%', padding: '12px', marginTop: 4 }}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div style={{ position: 'relative', margin: '20px 0', textAlign: 'center' }}>
            <div style={{ height: 1, background: '#E2E8F0' }} />
            <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: '#fff', padding: '0 12px', fontSize: 12, color: '#94A3B8' }}>or</span>
          </div>

          <p style={{ textAlign: 'center', fontSize: 13, color: '#64748B' }}>
            Don't have an account?{' '}
            <Link href="/en/register" style={{ color: '#16A34A', fontWeight: 600, textDecoration: 'none' }}>
              Register
            </Link>
          </p>

          <div style={{ marginTop: 12, borderTop: '1px solid #F1F5F9', paddingTop: 12 }}>
            <p style={{ textAlign: 'center', fontSize: 12, color: '#94A3B8' }}>
              Registering a transport company?{' '}
              <Link href="/en/company/onboarding/step-1" style={{ color: '#16A34A', fontWeight: 600, textDecoration: 'none' }}>
                Register as Company
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
