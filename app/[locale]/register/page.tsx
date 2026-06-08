'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getAppUrl } from '@/lib/utils/url'
import { Mail, Lock, Eye, EyeOff, User, Phone } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

export default function RegisterPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    setLoading(true)
    setError('')
    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName, phone, role: 'passenger' },
        },
      })
      if (authError) throw authError

      if (data.user) {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          full_name: fullName,
          phone,
          role: 'passenger'
        })
      }

      router.push('/en/dashboard')
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' }}>
      <div style={{ width: '100%', maxWidth: 440 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <Link href="/en" style={{ display: 'inline-block', textDecoration: 'none' }}>
            <span className="rp-sand-wrap" style={{ display: 'inline-block', position: 'relative', height: 44 }}>
              <img src="/routepro-logo-clean.png" alt="RoutePro" className="rp-logo-base" style={{ height: 44, width: 'auto', maxWidth: 200, objectFit: 'contain', display: 'block', position: 'relative' }} draggable={false} />
              <img src="/routepro-logo-clean.png" alt="" aria-hidden="true" className="rp-dust-1" style={{ height: 44, width: 'auto', maxWidth: 200, objectFit: 'contain', display: 'block', position: 'absolute', top: 0, left: 0 }} draggable={false} />
              <img src="/routepro-logo-clean.png" alt="" aria-hidden="true" className="rp-dust-2" style={{ height: 44, width: 'auto', maxWidth: 200, objectFit: 'contain', display: 'block', position: 'absolute', top: 0, left: 0 }} draggable={false} />
              <img src="/routepro-logo-clean.png" alt="" aria-hidden="true" className="rp-dust-3" style={{ height: 44, width: 'auto', maxWidth: 200, objectFit: 'contain', display: 'block', position: 'absolute', top: 0, left: 0 }} draggable={false} />
            </span>
          </Link>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0F172A', marginTop: 18, marginBottom: 4 }}>Create Account</h1>
          <p style={{ fontSize: 13, color: '#64748B' }}>Join thousands of travellers on RoutePro</p>
        </div>

        <div className="mt-card" style={{ padding: 24 }}>

          {error && (
            <div style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#DC2626' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label className="mt-label">Full Name</label>
              <div style={{ position: 'relative' }}>
                <User size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="John Doe" required className="mt-input" style={{ paddingLeft: 36 }} />
              </div>
            </div>

            <div>
              <label className="mt-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required className="mt-input" style={{ paddingLeft: 36 }} />
              </div>
            </div>

            <div>
              <label className="mt-label">Phone Number</label>
              <div style={{ position: 'relative' }}>
                <Phone size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+234 800 000 0000" required className="mt-input" style={{ paddingLeft: 36 }} />
              </div>
            </div>

            <div>
              <label className="mt-label">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 8 characters" required className="mt-input" style={{ paddingLeft: 36, paddingRight: 42 }} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}>
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div>
              <label className="mt-label">Confirm Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Re-enter password" required className="mt-input" style={{ paddingLeft: 36 }} />
              </div>
            </div>

            <button type="submit" disabled={loading} className="mt-btn-primary" style={{ width: '100%', padding: '12px', marginTop: 4 }}>
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <div style={{ position: 'relative', margin: '20px 0', textAlign: 'center' }}>
            <div style={{ height: 1, background: '#E2E8F0' }} />
            <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: '#fff', padding: '0 12px', fontSize: 12, color: '#94A3B8' }}>or continue with</span>
          </div>

          <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
            <button 
              type="button" 
              onClick={() => supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${getAppUrl()}/api/auth/callback` } })}
              className="mt-btn-outline" 
              style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}
            >
              <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" style={{ width: 18, height: 18 }} />
              Google
            </button>
            <button 
              type="button" 
              onClick={() => supabase.auth.signInWithOAuth({ provider: 'apple', options: { redirectTo: `${getAppUrl()}/api/auth/callback` } })}
              className="mt-btn-outline" 
              style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}
            >
              <img src="https://www.svgrepo.com/show/511330/apple-173.svg" alt="Apple" style={{ width: 18, height: 18 }} />
              Apple
            </button>
          </div>

          <p style={{ textAlign: 'center', fontSize: 13, color: '#64748B', marginTop: 16 }}>
            Already have an account?{' '}
            <Link href="/en/login" style={{ color: '#16A34A', fontWeight: 600, textDecoration: 'none' }}>Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
