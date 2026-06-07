'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import Link from 'next/link'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log to console in dev; swap for Sentry/LogRocket in prod
    console.error('[GlobalError]', error)
  }, [error])

  return (
    <html>
      <body style={{ background: '#F8FAFC', margin: 0, fontFamily: "'Inter', sans-serif" }}>
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 20,
              padding: '48px 40px',
              maxWidth: 480,
              width: '100%',
              textAlign: 'center',
              border: '1px solid #E2E8F0',
              boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
            }}
          >
            <div
              style={{
                width: 72,
                height: 72,
                background: '#FEE2E2',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px',
              }}
            >
              <AlertTriangle size={36} color="#DC2626" />
            </div>

            <h1
              style={{
                fontSize: 22,
                fontWeight: 800,
                color: '#0F172A',
                marginBottom: 12,
                fontFamily: "'Outfit', sans-serif",
              }}
            >
              Something went wrong
            </h1>

            <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.6, marginBottom: 8 }}>
              An unexpected error occurred. Our team has been notified.
            </p>

            {error?.digest && (
              <p style={{ fontSize: 11, color: '#94A3B8', marginBottom: 24, fontFamily: 'monospace' }}>
                Error ID: {error.digest}
              </p>
            )}

            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 28 }}>
              <button
                onClick={reset}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  background: '#16A34A',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 10,
                  padding: '11px 22px',
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: 'pointer',
                }}
              >
                <RefreshCw size={15} /> Try Again
              </button>
              <Link
                href="/en"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  background: '#F1F5F9',
                  color: '#0F172A',
                  border: 'none',
                  borderRadius: 10,
                  padding: '11px 22px',
                  fontWeight: 700,
                  fontSize: 14,
                  textDecoration: 'none',
                }}
              >
                <Home size={15} /> Go Home
              </Link>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
