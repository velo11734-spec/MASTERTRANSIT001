'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Users, Building2, ShieldCheck, Truck, MapPin, Route,
  Bus, Ticket, CreditCard, Wallet, Scale, Star, HelpCircle, FileText,
  Bell, AlertTriangle, Lock, BarChart3, Settings, ClipboardList, Activity,
  Zap, X, ChevronRight, TrendingUp, Megaphone
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

// ─── Types ───────────────────────────────────────────────────────────────────
interface NavItem {
  label: string
  icon: React.ElementType
  href: string
}

interface NavSection {
  title: string
  items: NavItem[]
}

interface EmergencyToggle {
  key: string
  label: string
  description: string
  value: boolean
  loading: boolean
}

// ─── Navigation Config ────────────────────────────────────────────────────────
const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Overview',
    items: [
      { label: 'Overview', icon: LayoutDashboard, href: '/en/admin' },
      { label: 'Finance Dashboard', icon: TrendingUp, href: '/en/admin/finance' },
    ],
  },
  {
    title: 'People',
    items: [
      { label: 'Users', icon: Users, href: '/en/admin/users' },
      { label: 'Companies', icon: Building2, href: '/en/admin/companies' },
      { label: 'Verification', icon: ShieldCheck, href: '/en/admin/verification' },
    ],
  },
  {
    title: 'Operations',
    items: [
      { label: 'Fleet', icon: Truck, href: '/en/admin/fleet' },
      { label: 'Terminals', icon: MapPin, href: '/en/admin/terminals' },
      { label: 'Routes', icon: Route, href: '/en/admin/routes' },
      { label: 'Trips', icon: Bus, href: '/en/admin/trips' },
    ],
  },
  {
    title: 'Commerce',
    items: [
      { label: 'Bookings', icon: Ticket, href: '/en/admin/bookings' },
      { label: 'Payments', icon: CreditCard, href: '/en/admin/payments' },
      { label: 'Withdrawals', icon: Wallet, href: '/en/admin/finance/withdrawals' },
      { label: 'Payouts', icon: Wallet, href: '/en/admin/payouts' },
      { label: 'Subscriptions', icon: CreditCard, href: '/en/admin/subscriptions' },
      { label: 'Disputes', icon: Scale, href: '/en/admin/disputes' },
    ],
  },
  {
    title: 'Content',
    items: [
      { label: 'Reviews', icon: Star, href: '/en/admin/reviews' },
      { label: 'Help Center', icon: HelpCircle, href: '/en/admin/help-content' },
      { label: 'Content', icon: FileText, href: '/en/admin/content' },
      { label: 'Advertising', icon: Megaphone, href: '/en/admin/advertising' },
      { label: 'Notifications', icon: Bell, href: '/en/admin/notifications' },
    ],
  },
  {
    title: 'Monitoring',
    items: [
      { label: 'Fraud', icon: AlertTriangle, href: '/en/admin/fraud' },
      { label: 'Security', icon: Lock, href: '/en/admin/security' },
      { label: 'Analytics', icon: BarChart3, href: '/en/admin/analytics' },
    ],
  },
  {
    title: 'System',
    items: [
      { label: 'Settings', icon: Settings, href: '/en/admin/settings' },
      { label: 'Audit Logs', icon: ClipboardList, href: '/en/admin/audit-logs' },
      { label: 'System Health', icon: Activity, href: '/en/admin/system' },
    ],
  },
]

const EMERGENCY_SETTINGS = [
  { key: 'maintenance_mode', label: 'Maintenance Mode', description: 'Take the platform offline for all users' },
  { key: 'booking_freeze', label: 'Booking Freeze', description: 'Prevent all new bookings from being made' },
  { key: 'payment_freeze', label: 'Payment Freeze', description: 'Halt all payment processing' },
  { key: 'payout_freeze', label: 'Payout Freeze', description: 'Stop all partner payout disbursements' },
]

// ─── Toggle Component ─────────────────────────────────────────────────────────
function Toggle({ enabled, loading, onChange }: { enabled: boolean; loading: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      disabled={loading}
      style={{
        position: 'relative',
        display: 'inline-flex',
        width: '44px',
        height: '24px',
        borderRadius: '12px',
        background: enabled ? '#DC2626' : '#374151',
        border: 'none',
        cursor: loading ? 'not-allowed' : 'pointer',
        transition: 'background 0.2s',
        opacity: loading ? 0.6 : 1,
        flexShrink: 0,
      }}
      aria-label="Toggle emergency setting"
    >
      <span
        style={{
          position: 'absolute',
          top: '3px',
          left: enabled ? '23px' : '3px',
          width: '18px',
          height: '18px',
          borderRadius: '50%',
          background: '#fff',
          transition: 'left 0.2s',
          boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
        }}
      />
    </button>
  )
}

// ─── Main Sidebar Component ───────────────────────────────────────────────────
export default function AdminSidebar() {
  const pathname = usePathname()
  const [showEmergencyModal, setShowEmergencyModal] = useState(false)
  const [emergencyToggles, setEmergencyToggles] = useState<EmergencyToggle[]>(
    EMERGENCY_SETTINGS.map(s => ({ ...s, value: false, loading: false }))
  )
  const [adminEmail, setAdminEmail] = useState<string>('')

  // Load emergency settings from Supabase
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const { data } = await supabase
          .from('platform_settings')
          .select('key, value')
          .in('key', EMERGENCY_SETTINGS.map(s => s.key))

        if (data) {
          setEmergencyToggles(prev =>
            prev.map(toggle => {
              const row = data.find(d => d.key === toggle.key)
              return { ...toggle, value: row?.value === 'true' }
            })
          )
        }
      } catch {
        // Table may not exist yet; silently ignore
      }
    }

    const loadUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.email) setAdminEmail(user.email)
    }

    loadSettings()
    loadUser()
  }, [])

  const handleEmergencyToggle = async (index: number) => {
    const toggle = emergencyToggles[index]
    const newValue = !toggle.value

    setEmergencyToggles(prev =>
      prev.map((t, i) => i === index ? { ...t, loading: true } : t)
    )

    try {
      // Upsert the setting value
      await supabase.from('platform_settings').upsert({
        key: toggle.key,
        value: newValue ? 'true' : 'false',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'key' })

      // Write audit log
      await supabase.from('audit_logs').insert({
        action: `EMERGENCY_${toggle.key.toUpperCase()}_${newValue ? 'ENABLED' : 'DISABLED'}`,
        actor_email: adminEmail,
        details: `Emergency setting '${toggle.label}' set to ${newValue}`,
        created_at: new Date().toISOString(),
      })

      setEmergencyToggles(prev =>
        prev.map((t, i) => i === index ? { ...t, value: newValue, loading: false } : t)
      )
    } catch {
      setEmergencyToggles(prev =>
        prev.map((t, i) => i === index ? { ...t, loading: false } : t)
      )
    }
  }

  const isActive = (href: string) => {
    if (href === '/en/admin') return pathname === '/en/admin' || pathname === '/en/admin/'
    return pathname.startsWith(href)
  }

  return (
    <>
      {/* ── Sidebar ── */}
      <aside
        style={{
          width: '260px',
          minWidth: '260px',
          height: '100vh',
          background: '#0F172A',
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 40,
          borderRight: '1px solid rgba(255,255,255,0.06)',
          overflowY: 'auto',
          scrollbarWidth: 'thin',
          scrollbarColor: '#1E293B transparent',
        }}
      >
        {/* Logo */}
        <div style={{ padding: '24px 20px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px', height: '36px', background: '#16A34A',
                borderRadius: '10px', display: 'flex', alignItems: 'center',
                justifyContent: 'center', flexShrink: 0,
              }}
            >
              <Route size={20} color="#fff" />
            </div>
            <span
              style={{
                fontSize: '22px', fontWeight: 800, color: '#16A34A',
                letterSpacing: '-0.5px', fontFamily: 'Outfit, sans-serif',
              }}
            >
              RoutePro
            </span>
          </div>
          <div
            style={{
              marginTop: '10px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(220,38,38,0.15)',
              border: '1px solid rgba(220,38,38,0.3)',
              borderRadius: '6px',
              padding: '3px 10px',
            }}
          >
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#EF4444', display: 'block' }} />
            <span style={{ fontSize: '11px', color: '#FCA5A5', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Super Admin
            </span>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '0 0 8px' }} />

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '8px 12px' }}>
          {NAV_SECTIONS.map(section => (
            <div key={section.title} style={{ marginBottom: '8px' }}>
              <p
                style={{
                  fontSize: '10px', fontWeight: 700, color: '#475569',
                  textTransform: 'uppercase', letterSpacing: '0.1em',
                  padding: '8px 8px 4px',
                }}
              >
                {section.title}
              </p>
              {section.items.map(item => {
                const active = isActive(item.href)
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      marginBottom: '1px',
                      color: active ? '#86EFAC' : '#94A3B8',
                      background: active ? 'rgba(22,163,74,0.12)' : 'transparent',
                      borderLeft: active ? '3px solid #16A34A' : '3px solid transparent',
                      textDecoration: 'none',
                      fontSize: '13.5px',
                      fontWeight: active ? 600 : 400,
                      transition: 'all 0.15s ease',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={e => {
                      if (!active) {
                        (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.05)'
                        ;(e.currentTarget as HTMLAnchorElement).style.color = '#CBD5E1'
                      }
                    }}
                    onMouseLeave={e => {
                      if (!active) {
                        (e.currentTarget as HTMLAnchorElement).style.background = 'transparent'
                        ;(e.currentTarget as HTMLAnchorElement).style.color = '#94A3B8'
                      }
                    }}
                  >
                    <Icon size={18} style={{ flexShrink: 0 }} />
                    <span style={{ flex: 1 }}>{item.label}</span>
                    {active && <ChevronRight size={14} style={{ opacity: 0.5 }} />}
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>

        {/* Emergency Powers Button */}
        <div style={{ padding: '12px 12px 20px' }}>
          <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', marginBottom: '12px' }} />
          <button
            id="emergency-powers-btn"
            onClick={() => setShowEmergencyModal(true)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '11px 16px',
              background: 'linear-gradient(135deg, #DC2626, #991B1B)',
              border: '1px solid rgba(220,38,38,0.4)',
              borderRadius: '10px',
              color: '#fff',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              letterSpacing: '0.03em',
              boxShadow: '0 4px 14px rgba(220,38,38,0.3)',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)'
              ;(e.currentTarget as HTMLButtonElement).style.boxShadow = '0 6px 20px rgba(220,38,38,0.5)'
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'
              ;(e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 14px rgba(220,38,38,0.3)'
            }}
          >
            <Zap size={16} />
            EMERGENCY POWERS
          </button>
        </div>
      </aside>

      {/* ── Emergency Modal ── */}
      {showEmergencyModal && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 999,
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '20px',
          }}
          onClick={e => { if (e.target === e.currentTarget) setShowEmergencyModal(false) }}
        >
          <div
            style={{
              background: '#0F172A',
              border: '1px solid rgba(220,38,38,0.3)',
              borderRadius: '16px',
              padding: '28px',
              width: '100%',
              maxWidth: '480px',
              boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                  <div
                    style={{
                      width: '36px', height: '36px', borderRadius: '10px',
                      background: 'rgba(220,38,38,0.2)', display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <Zap size={18} color="#EF4444" />
                  </div>
                  <h2 style={{ color: '#F1F5F9', fontSize: '18px', fontWeight: 700, margin: 0 }}>
                    Emergency Powers
                  </h2>
                </div>
                <p style={{ color: '#94A3B8', fontSize: '13px', margin: 0 }}>
                  These controls have immediate platform-wide effect. All actions are logged.
                </p>
              </div>
              <button
                onClick={() => setShowEmergencyModal(false)}
                style={{
                  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px', color: '#94A3B8', cursor: 'pointer',
                  width: '32px', height: '32px', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Warning Banner */}
            <div
              style={{
                background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.25)',
                borderRadius: '10px', padding: '12px 14px', marginBottom: '20px',
                display: 'flex', gap: '10px', alignItems: 'flex-start',
              }}
            >
              <AlertTriangle size={16} color="#EF4444" style={{ flexShrink: 0, marginTop: '2px' }} />
              <p style={{ color: '#FCA5A5', fontSize: '12.5px', margin: 0, lineHeight: '1.5' }}>
                Enabling any of these controls will immediately affect all users on the platform. These actions are audited and irreversible until manually disabled.
              </p>
            </div>

            {/* Toggles */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {emergencyToggles.map((toggle, index) => (
                <div
                  key={toggle.key}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: toggle.value ? 'rgba(220,38,38,0.08)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${toggle.value ? 'rgba(220,38,38,0.3)' : 'rgba(255,255,255,0.08)'}`,
                    borderRadius: '10px', padding: '14px 16px',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ flex: 1, marginRight: '16px' }}>
                    <p style={{ color: toggle.value ? '#FCA5A5' : '#E2E8F0', fontWeight: 600, fontSize: '14px', margin: '0 0 3px' }}>
                      {toggle.label}
                    </p>
                    <p style={{ color: '#64748B', fontSize: '12px', margin: 0 }}>
                      {toggle.description}
                    </p>
                  </div>
                  <Toggle
                    enabled={toggle.value}
                    loading={toggle.loading}
                    onChange={() => handleEmergencyToggle(index)}
                  />
                </div>
              ))}
            </div>

            {/* Footer */}
            <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <p style={{ color: '#475569', fontSize: '11.5px', textAlign: 'center', margin: 0 }}>
                Logged as: <span style={{ color: '#64748B', fontWeight: 600 }}>{adminEmail || 'Unknown'}</span>
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
