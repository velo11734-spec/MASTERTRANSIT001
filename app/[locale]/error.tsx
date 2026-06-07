'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[LocaleError]', error)
  }, [error])

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#F8FAFC',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        fontFamily: "'Inter', sans-serif",
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
            background: 'linear-gradient(135deg, #FEE2E2, #FECACA)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
          }}
        >
          <AlertTriangle size={34} color="#DC2626" />
        </div>

        <h2
          style={{
            fontSize: 22,
            fontWeight: 800,
            color: '#0F172A',
            marginBottom: 10,
            fontFamily: "'Outfit', sans-serif",
          }}
        >
          Page Error
        </h2>

        <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.6, marginBottom: 8 }}>
          This page encountered an error. You can try refreshing or return to the home page.
        </p>

        {process.env.NODE_ENV === 'development' && error?.message && (
          <pre
            style={{
              background: '#FFF1F2',
              border: '1px solid #FECDD3',
              borderRadius: 8,
              padding: '10px 14px',
              fontSize: 11,
              color: '#9F1239',
              textAlign: 'left',
              overflowX: 'auto',
              marginBottom: 20,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {error.message}
          </pre>
        )}

        {error?.digest && (
          <p style={{ fontSize: 11, color: '#94A3B8', marginBottom: 24, fontFamily: 'monospace' }}>
            Ref: {error.digest}
          </p>
        )}

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 24 }}>
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
            <RefreshCw size={15} /> Retry
          </button>
          <Link
            href="/en"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: '#F1F5F9',
              color: '#0F172A',
              borderRadius: 10,
              padding: '11px 22px',
              fontWeight: 700,
              fontSize: 14,
              textDecoration: 'none',
            }}
          >
            <ArrowLeft size={15} /> Home
          </Link>
        </div>
      </div>
    </div>
  )
}
