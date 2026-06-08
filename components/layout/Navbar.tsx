// components/layout/Navbar.tsx
'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Menu, X, Moon, Sun, LogOut, LayoutDashboard, User } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

// ── Animated RoutePro logo (sand/dust effect) ────────────────────────────────────────
function RouteProLogo() {
  return (
    <Link
      href="/en"
      style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', flexShrink: 0 }}
      aria-label="RoutePro Home"
    >
      <span className="rp-sand-wrap">
        <img src="/routepro-logo-clean.png" alt="RoutePro" className="rp-logo-base" draggable={false} />
        <img src="/routepro-logo-clean.png" alt="" aria-hidden="true" className="rp-dust-1" draggable={false} />
        <img src="/routepro-logo-clean.png" alt="" aria-hidden="true" className="rp-dust-2" draggable={false} />
        <img src="/routepro-logo-clean.png" alt="" aria-hidden="true" className="rp-dust-3" draggable={false} />
      </span>
      <style>{`
        .rp-sand-wrap { position: relative; display: inline-block; height: 36px; width: auto; }
        .rp-sand-wrap img { height: 36px; width: auto; max-width: 160px; object-fit: contain; object-position: left center; display: block; position: absolute; top: 0; left: 0; user-select: none; pointer-events: none; }
        .rp-logo-base { position: relative !important; animation: rpBase 5s ease-in-out infinite; }
        @keyframes rpBase { 0%,30%{opacity:1;filter:none;}55%{opacity:0.4;filter:blur(1px);}72%{opacity:0;filter:blur(3px);}73%{opacity:0;}85%{opacity:1;filter:none;}100%{opacity:1;filter:none;} }
        .rp-dust-1 { animation: rpDust1 5s ease-in-out infinite; }
        @keyframes rpDust1 { 0%,30%{transform:translate(0,0)scale(1);opacity:0;filter:blur(0px);}42%{transform:translate(4px,-2px)scale(1.01);opacity:0.5;filter:blur(1px);}60%{transform:translate(12px,-5px)scale(1.03);opacity:0.3;filter:blur(3px);}72%{transform:translate(22px,-8px)scale(1.05);opacity:0;filter:blur(6px);}73%,100%{transform:translate(0,0)scale(1);opacity:0;filter:blur(0px);} }
        .rp-dust-2 { animation: rpDust2 5s ease-in-out 0.15s infinite; }
        @keyframes rpDust2 { 0%,35%{transform:translate(0,0)scale(1);opacity:0;filter:blur(0px);}48%{transform:translate(6px,-3px)scale(1.02);opacity:0.35;filter:blur(2px);}63%{transform:translate(18px,-7px)scale(1.04);opacity:0.2;filter:blur(5px);}72%{transform:translate(30px,-12px)scale(1.06);opacity:0;filter:blur(8px);}73%,100%{transform:translate(0,0)scale(1);opacity:0;filter:blur(0px);} }
        .rp-dust-3 { animation: rpDust3 5s ease-in-out 0.3s infinite; }
        @keyframes rpDust3 { 0%,40%{transform:translate(0,0)scale(1);opacity:0;filter:blur(0px);}54%{transform:translate(8px,-4px)scale(1.02);opacity:0.2;filter:blur(3px);}66%{transform:translate(24px,-10px)scale(1.05);opacity:0.12;filter:blur(7px);}72%{transform:translate(40px,-16px)scale(1.07);opacity:0;filter:blur(10px);}73%,100%{transform:translate(0,0)scale(1);opacity:0;filter:blur(0px);} }
      `}</style>
    </Link>
  )
}

import NotificationPanel from './NotificationPanel'
import LanguageSwitcher from './LanguageSwitcher'

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()

  const [mobileOpen, setMobileOpen] = useState(false)
  const [dark, setDark] = useState(false)
  const [sessionUser, setSessionUser] = useState<any>(null)
  const [userRole, setUserRole] = useState<string | null>(null)

  // --------------------------------------------------------------------------
  // Session & role handling
  // --------------------------------------------------------------------------
  useEffect(() => {
    // Initial session fetch
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setSessionUser(session.user)
        fetchUserRole(session.user)
      }
    })

    // Listen to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setSessionUser(session.user)
        fetchUserRole(session.user)
      } else {
        setSessionUser(null)
        setUserRole(null)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  const fetchUserRole = async (user: any) => {
    // Super admin shortcut
    if (user.email?.toLowerCase() === 'olaideheritagetemitope@gmail.com') {
      setUserRole('super_admin')
      return
    }
    try {
      const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      setUserRole(data?.role || user.user_metadata?.role || 'passenger')
    } catch {
      setUserRole(user.user_metadata?.role || 'passenger')
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/en'
  }

  const getDashboardLink = () => {
    if (userRole === 'super_admin' || userRole === 'admin') return '/en/admin/companies'
    if (['company', 'company_owner', 'company_staff'].includes(userRole ?? '')) return '/en/company/dashboard'
    return '/en/dashboard'
  }

  const getDashboardLabel = () => {
    if (userRole === 'super_admin' || userRole === 'admin') return 'Admin Portal'
    if (['company', 'company_owner', 'company_staff'].includes(userRole ?? '')) return 'Company Portal'
    return 'My Dashboard'
  }

  const navLinks = [
    { label: 'Home', href: '/en' },
    { label: 'Trips', href: '/en/search' },
    { label: 'Marketplace', href: '/en/marketplace' },
    { label: 'Companies', href: '/en/companies' },
    { label: 'About Us', href: '/en/about-us' },
    { label: 'Help', href: '/en/help-center' },
  ]

  return (
    <header className="mt-navbar">
      <RouteProLogo />
      {/* Desktop navigation */}
      <nav className="hidden lg:flex items-center gap-1 flex-1">
        {navLinks.map(link => {
          const isActive = pathname === link.href || (link.href !== '/en' && pathname?.startsWith(link.href))
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? 'text-green-700 font-semibold border-b-2 border-green-600 rounded-none'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              {link.label}
            </Link>
          )
        })}
        <Link
          href="/en/companies/join"
          className="ml-2 px-3 py-1.5 rounded-full text-xs font-semibold border border-green-200 text-green-700 bg-green-50 hover:bg-green-100 hover:border-green-300 transition-all card-hover btn-press"
        >
          Become a Partner
        </Link>
      </nav>

      {/* Right side actions */}
      <div className="ml-auto flex items-center gap-2">
        <button
          onClick={() => setDark(!dark)}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors hidden md:flex"
          aria-label="Toggle dark mode"
        >
          {dark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <div className="hidden sm:inline-block">
          <LanguageSwitcher />
        </div>

        {sessionUser ? (
          <>
            <NotificationPanel />
            <Link href={getDashboardLink()} className="hidden md:inline-flex mt-btn-primary text-sm gap-1.5 items-center">
              <LayoutDashboard size={14} /> {getDashboardLabel()}
            </Link>
            <Link href="/en/dashboard/profile" className="hidden md:inline-flex p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors">
              <User size={16} />
            </Link>
            <button
              onClick={handleLogout}
              className="hidden md:inline-flex mt-btn-outline text-sm gap-1.5 items-center border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
            >
              <LogOut size={14} /> Log Out
            </button>
          </>
        ) : (
          <>
            <Link href="/en/login" className="hidden md:inline-flex mt-btn-outline text-sm">Login</Link>
            <Link href="/en/register" className="hidden md:inline-flex mt-btn-primary text-sm" style={{ background: '#16A34A', borderRadius: 8, color: 'white' }}>
              Sign Up
            </Link>
          </>
        )}

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-600"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu — animated slide-in with backdrop */}
      {mobileOpen && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setMobileOpen(false)}
            style={{
              position: 'fixed', inset: 0, top: 'var(--mt-top-h)',
              background: 'rgba(15,23,42,0.35)', zIndex: 55,
              backdropFilter: 'blur(2px)',
            }}
          />
          {/* Drawer */}
          <div
            className="fade-in-scale"
            style={{
              position: 'absolute', top: '100%', left: 0, right: 0,
              background: '#FFFFFF',
              borderBottom: '1px solid #E2E8F0',
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
              zIndex: 60,
              borderRadius: '0 0 16px 16px',
              overflow: 'hidden',
            }}
          >
            <nav className="flex flex-col p-4 gap-1">
              {navLinks.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="px-4 py-3 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-colors"
                  style={{ minHeight: 48, display: 'flex', alignItems: 'center' }}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/en/companies/join"
                onClick={() => setMobileOpen(false)}
                className="px-4 py-3 rounded-xl text-sm font-semibold text-green-700 bg-green-50 hover:bg-green-100 transition-colors"
                style={{ minHeight: 48, display: 'flex', alignItems: 'center' }}
              >
                ✦ Become a Partner
              </Link>
              <div style={{ height: 1, background: '#F1F5F9', margin: '6px 0' }} />
              {sessionUser ? (
                <>
                  <Link
                    href={getDashboardLink()}
                    onClick={() => setMobileOpen(false)}
                    className="px-4 py-3 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    style={{ minHeight: 48, display: 'flex', alignItems: 'center', gap: 8 }}
                  >
                    <LayoutDashboard size={16} /> {getDashboardLabel()}
                  </Link>
                  <Link
                    href="/en/dashboard/profile"
                    onClick={() => setMobileOpen(false)}
                    className="px-4 py-3 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    style={{ minHeight: 48, display: 'flex', alignItems: 'center', gap: 8 }}
                  >
                    <User size={16} /> My Profile
                  </Link>
                  <button
                    onClick={() => { setMobileOpen(false); handleLogout() }}
                    className="px-4 py-3 rounded-xl text-sm font-medium text-red-600 text-left hover:bg-red-50 transition-colors"
                    style={{ border: 'none', background: 'none', width: '100%', cursor: 'pointer', minHeight: 48, display: 'flex', alignItems: 'center', gap: 8 }}
                  >
                    <LogOut size={16} /> Log Out
                  </button>
                </>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, paddingTop: 4 }}>
                  <Link
                    href="/en/login"
                    onClick={() => setMobileOpen(false)}
                    className="mt-btn-outline text-sm"
                    style={{ justifyContent: 'center' }}
                  >
                    Login
                  </Link>
                  <Link
                    href="/en/register"
                    onClick={() => setMobileOpen(false)}
                    className="mt-btn-primary text-sm"
                    style={{ justifyContent: 'center' }}
                  >
                    Sign Up
                  </Link>
                </div>
              )}
              <div style={{ height: 1, background: '#F1F5F9', margin: '8px 0' }} />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 16px' }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#64748B' }}>Language / Switch Locale</span>
                <LanguageSwitcher />
              </div>
            </nav>
          </div>
        </>
      )}
    </header>
  )
}
