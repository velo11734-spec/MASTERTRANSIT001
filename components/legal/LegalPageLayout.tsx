import Link from 'next/link'

export interface LegalSection {
  title: string
  content: React.ReactNode
}

interface LegalPageLayoutProps {
  title: string
  subtitle: string
  lastUpdated?: string
  locale: string
  children: React.ReactNode
  currentPath: string
}

const ALL_POLICIES = [
  { href: 'terms-and-conditions',  label: 'General Platform Terms' },
  { href: 'privacy-policy',        label: 'Privacy Policy' },
  { href: 'refund-policy',         label: 'Refund & Cancellation' },
  { href: 'acceptable-use-policy', label: 'Acceptable Use' },
  { href: 'company-terms',         label: 'Company / Business Terms' },
  { href: 'rental-terms',          label: 'Rental Provider Terms' },
  { href: 'dealer-terms',          label: 'Vehicle Dealer Terms' },
  { href: 'careers-terms',         label: 'Careers & Applicant Terms' },
  { href: 'wallet-terms',          label: 'Payment & Wallet Terms' },
]

export default function LegalPageLayout({ title, subtitle, lastUpdated = 'June 2026', locale, children, currentPath }: LegalPageLayoutProps) {
  return (
    <div style={{ background: '#F8FAFC', minHeight: '100vh', fontFamily: "'Inter', 'Outfit', sans-serif" }}>
      {/* Hero Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
        padding: '60px 24px 48px',
        textAlign: 'center',
      }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(22,163,74,0.12)', borderRadius: 20,
            padding: '5px 14px', marginBottom: 18,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#16A34A', display: 'inline-block' }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#22C55E', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Legal Documentation</span>
          </div>
          <h1 style={{ fontSize: 'clamp(24px, 5vw, 38px)', fontWeight: 900, color: '#F8FAFC', margin: '0 0 12px', fontFamily: "'Outfit', sans-serif", lineHeight: 1.2 }}>
            {title}
          </h1>
          <p style={{ color: '#94A3B8', fontSize: 15, margin: '0 0 16px', lineHeight: 1.6 }}>{subtitle}</p>
          <p style={{ color: '#475569', fontSize: 12 }}>Last Updated: <strong style={{ color: '#64748B' }}>{lastUpdated}</strong></p>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1160, margin: '0 auto', padding: '40px 24px 80px', display: 'grid', gridTemplateColumns: '260px 1fr', gap: 36, alignItems: 'start' }}>
        {/* Sidebar Nav */}
        <aside style={{ position: 'sticky', top: 90 }}>
          <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E2E8F0', padding: '20px 0', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '0 20px 12px', borderBottom: '1px solid #F1F5F9', margin: 0 }}>
              All Policies
            </p>
            <nav>
              {ALL_POLICIES.map(p => {
                const isActive = currentPath === p.href
                return (
                  <Link
                    key={p.href}
                    href={`/${locale}/legal/${p.href}`}
                    style={{
                      display: 'block',
                      padding: '10px 20px',
                      fontSize: 13,
                      fontWeight: isActive ? 700 : 400,
                      color: isActive ? '#16A34A' : '#475569',
                      textDecoration: 'none',
                      background: isActive ? 'rgba(22,163,74,0.06)' : 'transparent',
                      borderLeft: isActive ? '3px solid #16A34A' : '3px solid transparent',
                      transition: 'all 0.15s',
                    }}
                  >
                    {p.label}
                  </Link>
                )
              })}
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main style={{ background: '#fff', borderRadius: 20, border: '1px solid #E2E8F0', padding: '44px 48px', boxShadow: '0 2px 16px rgba(0,0,0,0.05)', minWidth: 0 }}>
          {children}

          {/* Footer Attribution */}
          <div style={{ marginTop: 48, paddingTop: 24, borderTop: '1px solid #F1F5F9', textAlign: 'center' }}>
            <p style={{ fontSize: 12, color: '#94A3B8' }}>
              © {new Date().getFullYear()} <strong style={{ color: '#64748B' }}>RoutePro</strong>. All Rights Reserved. Powered by RoutePro Mobility Technologies.
            </p>
            <p style={{ fontSize: 11, color: '#CBD5E1', marginTop: 4 }}>
              Supported by <strong>Mighty Seed Investment Ltd</strong> · Designed &amp; Developed by <strong>LoneWolf Development Team</strong>
            </p>
          </div>
        </main>
      </div>
    </div>
  )
}
