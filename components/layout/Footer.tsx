'use client'

import Link from 'next/link'
import '@/app/globals.css'

export default function Footer() {
  const businessLinks = [
    { href: '/en/companies/join', label: 'Company Registration' },
    { href: '/en/companies/join', label: 'Business Onboarding' },
    { href: '/en/partner', label: 'Partner With RoutePro' },
  ]

  const links = [
    { href: '/en/legal/terms-of-service', label: 'Terms of Service' },
    { href: '/en/legal/privacy-policy', label: 'Privacy Policy' },
    { href: '/en/legal/refund-cancellation', label: 'Refund & Cancellation' },
    { href: '/en/legal/company-verification', label: 'Company Verification' },
    { href: '/en/legal/safety-trust', label: 'Safety & Trust' },
    { href: '/en/legal/cookie-policy', label: 'Cookie Policy' },
    { href: '/en/legal/acceptable-use', label: 'Acceptable Use' },
    { href: '/en/legal/transport-partner-agreement', label: 'Transport Partner Agreement' },
    { href: '/en/legal/driver-fleet-compliance', label: 'Driver & Fleet Compliance' },
    { href: '/en/legal/dispute-resolution', label: 'Dispute Resolution' },
  ]
  return (
    <footer className="mt-footer" style={{
      background: '#F1F5F9',
      padding: '32px 20px',
      textAlign: 'center',
      color: '#64748B',
      fontFamily: 'Outfit, sans-serif'
    }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <div style={{ marginBottom: 16 }}>
          <span style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#16A34A', display: 'block', marginBottom: 8 }}>For Businesses</span>
          <nav style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '16px' }}>
            {businessLinks.map(l => (
              <Link key={l.href} href={l.href} className="mt-footer-link" style={{
                color: '#16A34A',
                fontWeight: 600,
                fontSize: 13,
                textDecoration: 'none',
                borderBottom: '1px solid transparent',
                transition: 'border-color 0.2s'
              }} onMouseEnter={e => e.currentTarget.style.borderBottom = '1px solid #16A34A'} onMouseLeave={e => e.currentTarget.style.borderBottom = 'none'}>{l.label}</Link>
            ))}
          </nav>
        </div>
        <div style={{ height: 1, background: '#E2E8F0', margin: '16px 0' }} />
        <nav style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '12px', marginBottom: 12 }}>
          {links.map(l => (
            <Link key={l.href} href={l.href} className="mt-footer-link" style={{
              color: '#0F172A',
              fontSize: 13,
              textDecoration: 'none',
              borderBottom: '1px solid transparent',
              transition: 'border-color 0.2s'
            }} onMouseEnter={e => e.currentTarget.style.borderBottom = '1px solid #0F172A'} onMouseLeave={e => e.currentTarget.style.borderBottom = 'none'}>{l.label}</Link>
          ))}
        </nav>
        <div style={{ fontSize: 12 }}>
          © {new Date().getFullYear()} Lonewolfdevteam & Mighty Seeds Investment Ltd. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
