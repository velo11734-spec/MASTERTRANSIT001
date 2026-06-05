'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AdminSidebar from '@/components/admin/AdminSidebar'
import { supabase } from '@/lib/supabase/client'
import { Shield, LogOut, Bell, ChevronDown } from 'lucide-react'

const SUPER_ADMIN_EMAIL = 'olaideheritagetemitope@gmail.com'

interface AdminUser {
  email: string
  full_name?: string
  role?: string
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null)
  const [checking, setChecking] = useState(true)
  const [showUserMenu, setShowUserMenu] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
          router.replace('/en')
          return
        }

        // Allow super admin email bypass
        if (user.email === SUPER_ADMIN_EMAIL) {
          setAdminUser({ email: user.email, role: 'super_admin', full_name: 'Super Admin' })
          setChecking(false)
          return
        }

        // Check profiles table for admin role
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('full_name, role')
          .eq('id', user.id)
          .single()

        if (profileError || !profile) {
          router.replace('/en')
          return
        }

        if (profile.role !== 'admin' && profile.role !== 'super_admin') {
          router.replace('/en')
          return
        }

        setAdminUser({
          email: user.email || '',
          full_name: profile.full_name,
          role: profile.role,
        })
      } catch {
        router.replace('/en')
      } finally {
        setChecking(false)
      }
    }

    checkAuth()
  }, [router])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.replace('/en')
  }

  // ── Loading / Auth Check ──
  if (checking) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#0F172A',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: '20px',
          fontFamily: 'Outfit, sans-serif',
        }}
      >
        <div
          style={{
            width: '48px', height: '48px', borderRadius: '14px',
            background: '#16A34A', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Shield size={26} color="#fff" />
        </div>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#94A3B8', fontSize: '15px', margin: 0 }}>Verifying admin credentials…</p>
        </div>
        {/* Animated dots */}
        <div style={{ display: 'flex', gap: '6px' }}>
          {[0, 1, 2].map(i => (
            <div
              key={i}
              style={{
                width: '8px', height: '8px', borderRadius: '50%',
                background: '#16A34A',
                animation: `pulse 1.2s ${i * 0.2}s infinite ease-in-out`,
              }}
            />
          ))}
        </div>
        <style>{`
          @keyframes pulse {
            0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); }
            40% { opacity: 1; transform: scale(1); }
          }
        `}</style>
      </div>
    )
  }

  if (!adminUser) return null

  const initials = adminUser.full_name
    ? adminUser.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : adminUser.email.slice(0, 2).toUpperCase()

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        background: '#F8FAFC',
        fontFamily: 'Outfit, sans-serif',
      }}
    >
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main content area */}
      <div
        style={{
          marginLeft: '260px',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          minWidth: 0,
        }}
      >
        {/* ── Top Bar ── */}
        <header
          style={{
            height: '64px',
            background: '#fff',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 28px',
            position: 'sticky',
            top: 0,
            zIndex: 30,
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          {/* Left: Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '4px 12px',
                background: 'rgba(22,163,74,0.08)',
                border: '1px solid rgba(22,163,74,0.2)',
                borderRadius: '8px',
              }}
            >
              <Shield size={15} color="#16A34A" />
              <span
                style={{
                  fontSize: '13px', fontWeight: 700, color: '#16A34A',
                  letterSpacing: '0.04em', textTransform: 'uppercase',
                }}
              >
                Admin Control Center
              </span>
            </div>
          </div>

          {/* Right: Notifications + User */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Notification bell */}
            <button
              id="admin-notifications-btn"
              style={{
                width: '38px', height: '38px', borderRadius: '10px',
                background: '#F1F5F9', border: '1px solid #E2E8F0',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', position: 'relative', color: '#64748B',
              }}
            >
              <Bell size={17} />
              <span
                style={{
                  position: 'absolute', top: '7px', right: '7px',
                  width: '8px', height: '8px', borderRadius: '50%',
                  background: '#EF4444', border: '2px solid #fff',
                }}
              />
            </button>

            {/* User menu */}
            <div style={{ position: 'relative' }}>
              <button
                id="admin-user-menu-btn"
                onClick={() => setShowUserMenu(v => !v)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '6px 12px 6px 6px',
                  background: '#F8FAFC', border: '1px solid #E2E8F0',
                  borderRadius: '10px', cursor: 'pointer',
                }}
              >
                {/* Avatar */}
                <div
                  style={{
                    width: '32px', height: '32px', borderRadius: '8px',
                    background: 'linear-gradient(135deg, #16A34A, #15803D)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontWeight: 700, fontSize: '13px',
                    flexShrink: 0,
                  }}
                >
                  {initials}
                </div>
                <div style={{ textAlign: 'left' }}>
                  <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#1E293B', lineHeight: '1.2' }}>
                    {adminUser.full_name || 'Admin'}
                  </p>
                  <p style={{ margin: 0, fontSize: '11px', color: '#94A3B8', lineHeight: '1.2' }}>
                    {adminUser.email.length > 24 ? adminUser.email.slice(0, 24) + '…' : adminUser.email}
                  </p>
                </div>
                <ChevronDown size={15} color="#94A3B8" />
              </button>

              {/* Dropdown */}
              {showUserMenu && (
                <div
                  style={{
                    position: 'absolute', top: '48px', right: 0,
                    background: '#fff', border: '1px solid #E2E8F0',
                    borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
                    minWidth: '180px', overflow: 'hidden', zIndex: 50,
                  }}
                >
                  <div style={{ padding: '8px' }}>
                    <div
                      style={{
                        padding: '8px 12px', borderRadius: '8px',
                        marginBottom: '4px',
                      }}
                    >
                      <p style={{ margin: 0, fontSize: '11px', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        Signed in as
                      </p>
                      <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#334155', fontWeight: 600 }}>
                        {adminUser.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                      </p>
                    </div>
                    <div style={{ height: '1px', background: '#F1F5F9', margin: '4px 0' }} />
                    <button
                      id="admin-signout-btn"
                      onClick={handleSignOut}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center',
                        gap: '8px', padding: '9px 12px', borderRadius: '8px',
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: '#EF4444', fontSize: '13px', fontWeight: 500,
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.06)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                    >
                      <LogOut size={15} />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, overflow: 'auto' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
