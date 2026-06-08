'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import Link from 'next/link'
import { CheckCircle2, AlertCircle } from 'lucide-react'
import { getAppUrl } from '@/lib/utils/url'

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${getAppUrl()}/en/auth/update-password`,
      })

      if (error) {
        throw error
      }

      setMessage({ type: 'success', text: 'Password reset instructions have been sent to your email.' })
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'An error occurred during password reset.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#F8FAFC',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '48px 24px',
        fontFamily: "'Inter', sans-serif"
      }}
    >
      <div style={{ margin: '0 auto', width: '100%', maxWidth: '400px' }}>
        <h2
          style={{
            marginTop: '24px',
            textAlign: 'center',
            fontSize: '30px',
            fontWeight: 800,
            color: '#0F172A',
            fontFamily: "'Outfit', sans-serif"
          }}
        >
          Reset Password
        </h2>
        <p style={{ marginTop: '8px', textAlign: 'center', fontSize: '14px', color: '#475569' }}>
          Enter your email to receive a password reset link.
        </p>
      </div>

      <div style={{ marginTop: '32px', margin: '0 auto', width: '100%', maxWidth: '400px' }}>
        <div
          style={{
            backgroundColor: '#ffffff',
            padding: '32px 40px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            borderRadius: '8px'
          }}
        >
          <form style={{ display: 'flex', flexDirection: 'column', gap: '24px' }} onSubmit={handleReset}>
            {message && (
              <div
                style={{
                  padding: '16px',
                  borderRadius: '6px',
                  backgroundColor: message.type === 'success' ? '#F0FDF4' : '#FEF2F2',
                  display: 'flex',
                  alignItems: 'flex-start'
                }}
              >
                <div style={{ flexShrink: 0 }}>
                  {message.type === 'success' ? (
                    <CheckCircle2 size={20} color="#4ADE80" />
                  ) : (
                    <AlertCircle size={20} color="#F87171" />
                  )}
                </div>
                <div style={{ marginLeft: '12px' }}>
                  <p
                    style={{
                      fontSize: '14px',
                      fontWeight: 500,
                      color: message.type === 'success' ? '#166534' : '#991B1B',
                      margin: 0
                    }}
                  >
                    {message.text}
                  </p>
                </div>
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#334155' }}
              >
                Email address
              </label>
              <div style={{ marginTop: '4px' }}>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    appearance: 'none',
                    display: 'block',
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '6px',
                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'center',
                  padding: '8px 16px',
                  border: '1px solid transparent',
                  borderRadius: '6px',
                  boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#ffffff',
                  backgroundColor: '#16A34A',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1
                }}
              >
                {loading ? 'Sending...' : 'Send reset instructions'}
              </button>
            </div>
          </form>

          <div style={{ marginTop: '24px' }}>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, display: 'flex', alignItems: 'center' }}>
                <div style={{ width: '100%', borderTop: '1px solid #D1D5DB' }} />
              </div>
              <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', fontSize: '14px' }}>
                <span style={{ padding: '0 8px', backgroundColor: '#ffffff', color: '#6B7280' }}>
                  Or go back to
                </span>
              </div>
            </div>

            <div style={{ marginTop: '24px', textAlign: 'center' }}>
              <Link
                href="/en/login"
                style={{ fontWeight: 500, color: '#16A34A', textDecoration: 'none' }}
              >
                Log in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
