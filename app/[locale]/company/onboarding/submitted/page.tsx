'use client'

import Link from 'next/link'
import { CheckCircle2, Home } from 'lucide-react'

export default function SubmittedPage() {
  return (
    <div style={{ maxWidth: 500, margin: '80px auto', padding: '0 20px', textAlign: 'center' }}>
      
      <div style={{ width: 80, height: 80, background: '#DCFCE7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
        <CheckCircle2 size={40} color="#16A34A" />
      </div>

      <h1 style={{ fontSize: 28, fontWeight: 800, color: '#0F172A', fontFamily: 'Outfit, sans-serif', marginBottom: 12 }}>Application Submitted!</h1>
      
      <p style={{ fontSize: 15, color: '#64748B', lineHeight: 1.6, marginBottom: 32 }}>
        Thank you for registering your transport company with RoutePro. Our admin team will review your application and documents. You will receive an email once your account is verified.
      </p>

      <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: 20, marginBottom: 32 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', marginBottom: 8 }}>What happens next?</p>
        <ul style={{ textAlign: 'left', fontSize: 13, color: '#64748B', paddingLeft: 20, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <li>Admin review takes 24-48 business hours</li>
          <li>We may contact you for additional details</li>
          <li>Once approved, you'll get access to the Company Dashboard to start adding fleet and trips</li>
        </ul>
      </div>

      <Link href="/en" className="mt-btn-primary" style={{ padding: '12px 32px' }}>
        <Home size={18} /> Return to Homepage
      </Link>
    </div>
  )
}
