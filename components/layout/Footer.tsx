'use client'

import Link from 'next/link'
import '@/app/globals.css'

interface FooterProps {
  settings?: Record<string, string>
  locale?: string
}

const DEFAULT = {
  company_attribution_name: 'RoutePro Mobility Technologies',
  dev_team_name: 'LoneWolf Development Team',
  dev_team_url: 'https://future-development-website.com',
  partner_name: 'Mighty Seed Investment Ltd',
  partner_url: 'https://future-investment-website.com',
  enable_partner_attribution: 'true',
  enable_dev_attribution: 'true',
}

function get(settings: Record<string, string>, key: keyof typeof DEFAULT): string {
  return settings[key] ?? DEFAULT[key]
}

export default function Footer({ settings = {}, locale = 'en' }: FooterProps) {
  const year = new Date().getFullYear()
  const companyName = get(settings, 'company_attribution_name')
  const devName = get(settings, 'dev_team_name')
  const devUrl = get(settings, 'dev_team_url')
  const partnerName = get(settings, 'partner_name')
  const partnerUrl = get(settings, 'partner_url')
  const showPartner = get(settings, 'enable_partner_attribution') !== 'false'
  const showDev = get(settings, 'enable_dev_attribution') !== 'false'

  const legalLinks = [
    { href: `/${locale}/legal/terms-and-conditions`, label: 'Terms & Conditions' },
    { href: `/${locale}/legal/privacy-policy`, label: 'Privacy Policy' },
    { href: `/${locale}/legal/refund-policy`, label: 'Refund & Cancellation' },
    { href: `/${locale}/legal/acceptable-use-policy`, label: 'Acceptable Use' },
    { href: `/${locale}/legal/company-terms`, label: 'Company Terms' },
    { href: `/${locale}/legal/rental-terms`, label: 'Rental Terms' },
    { href: `/${locale}/legal/dealer-terms`, label: 'Dealer Terms' },
    { href: `/${locale}/legal/careers-terms`, label: 'Careers Terms' },
    { href: `/${locale}/legal/wallet-terms`, label: 'Wallet Terms' },
  ]

  const businessLinks = [
    { href: `/${locale}/companies/join`, label: 'Register a Company' },
    { href: `/${locale}/partner`, label: 'Partner With RoutePro' },
    { href: `/${locale}/careers`, label: 'Careers' },
    { href: `/${locale}/help-center`, label: 'Help Center' },
  ]

  const linkStyle: React.CSSProperties = {
    color: '#475569',
    fontSize: 12,
    textDecoration: 'none',
    transition: 'color 0.2s',
  }
  const greenLinkStyle: React.CSSProperties = {
    color: '#16A34A',
    fontSize: 12,
    fontWeight: 600,
    textDecoration: 'none',
    transition: 'color 0.2s',
  }

  return (
    <footer style={{
      background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
      borderTop: '1px solid rgba(255,255,255,0.06)',
      padding: '40px 24px 24px',
      fontFamily: "'Outfit', 'Inter', sans-serif",
      color: '#94A3B8',
    }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        {/* Top Row — Brand + Columns */}
        <div className="footer-grid">

          {/* Brand */}
          <div style={{ minWidth: 180 }}>
            <Link href={`/${locale}`} style={{ textDecoration: 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <div style={{
                  width: 32, height: 32,
                  background: 'linear-gradient(135deg, #16A34A, #22C55E)',
                  borderRadius: 8,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16, fontWeight: 900, color: '#fff',
                }}>R</div>
                <span style={{ fontSize: 18, fontWeight: 800, color: '#F8FAFC', letterSpacing: '-0.3px' }}>RoutePro</span>
              </div>
            </Link>
            <p style={{ fontSize: 12, color: '#64748B', lineHeight: 1.6, maxWidth: 200, margin: 0 }}>
              Nigeria&apos;s trusted platform for verified transport, fleet management, and smart mobility.
            </p>
          </div>

          {/* For Businesses */}
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#16A34A', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>
              For Businesses
            </p>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {businessLinks.map(l => (
                <Link key={l.href} href={l.href} style={greenLinkStyle}
                  onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#22C55E' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#16A34A' }}>
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Legal */}
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>
              Legal & Policies
            </p>
            <nav className="footer-legal-nav">
              {legalLinks.map(l => (
                <Link key={l.href} href={l.href} style={linkStyle}
                  onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#CBD5E1' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#475569' }}>
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', marginBottom: 20 }} />

        {/* Bottom Row — Copyright + Attribution */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}>
          {/* Copyright */}
          <div style={{ fontSize: 12, color: '#475569' }}>
            © {year} <span style={{ color: '#64748B', fontWeight: 600 }}>RoutePro</span>. All Rights Reserved.{' '}
            Powered by <span style={{ color: '#94A3B8', fontWeight: 600 }}>{companyName}</span>.
          </div>

          {/* Attribution Credits */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16, fontSize: 12, color: '#334155' }}>
            {showPartner && partnerName && (
              <span>
                Supported by{' '}
                <a
                  href={partnerUrl || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#64748B', fontWeight: 600, textDecoration: 'none' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#94A3B8' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#64748B' }}
                >
                  {partnerName}
                </a>
              </span>
            )}
            {showDev && devName && (
              <span>
                Designed &amp; Developed by{' '}
                <a
                  href={devUrl || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#16A34A', fontWeight: 700, textDecoration: 'none' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#22C55E' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#16A34A' }}
                >
                  {devName}
                </a>
              </span>
            )}
          </div>
        </div>
      </div>
    </footer>
  )
}
