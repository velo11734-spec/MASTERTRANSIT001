'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Wallet,
  Truck,
  Route,
  Bus,
  Users,
  BarChart3,
  Settings,
  ShieldCheck,
  MessageSquare,
  Sparkles,
  MapPin,
  Calendar,
  Ticket,
  FileText,
  UserCheck,
  LogOut,
  Building,
  Briefcase
} from 'lucide-react'

export default function CompanySidebar({ company }: { company: any }) {
  const pathname = usePathname()
  const roles = company?.business_roles || []

  // Helpers to check roles
  const isTransport = roles.includes('Transport Operator')
  const isDealer = roles.includes('Vehicle Dealer')
  const isRental = roles.includes('Rental Provider')
  const isFleet = roles.includes('Fleet Provider')
  const isCorporate = roles.includes('Corporate Mobility')

  const baseLinks = [
    { label: 'Overview', href: '/en/company/dashboard', icon: LayoutDashboard },
    { label: 'Wallet', href: '/en/company/wallet', icon: Wallet },
  ]

  const transportLinks = [
    { label: 'Fleet Management', href: '/en/company/fleet', icon: Truck },
    { label: 'Routes', href: '/en/company/routes', icon: Route },
    { label: 'Trip Scheduler', href: '/en/company/trips', icon: Bus },
  ]

  const dealerLinks = [
    { label: 'Dealership Inventory', href: '/en/company/inventory', icon: Sparkles },
    { label: 'Sales Leads', href: '/en/company/leads', icon: Users },
  ]

  const rentalLinks = [
    { label: 'Rental Fleet', href: '/en/company/rentals', icon: Calendar },
  ]

  const bottomLinks = [
    { label: 'Workforce', href: '/en/company/workforce', icon: Users },
    { label: 'Recruitment', href: '/en/company/recruitment', icon: Briefcase },
    { label: 'Customers', href: '/en/company/customers', icon: ShieldCheck },
    { label: 'Analytics', href: '/en/company/analytics', icon: BarChart3 },
    { label: 'Settings', href: '/en/company/settings', icon: Settings },
  ]

  const renderLink = (link: { label: string; href: string; icon: any }) => {
    const isActive = pathname === link.href || (link.href !== '/en/company/dashboard' && pathname?.startsWith(link.href))
    return (
      <Link
        key={link.href}
        href={link.href}
        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors display flex items-center gap-3 decoration-none ${
          isActive
            ? 'text-green-700 bg-green-50 font-semibold border-l-4 border-green-600 rounded-l-none'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
        }`}
      >
        <link.icon size={18} className={isActive ? 'text-green-600' : 'text-gray-400'} />
        <span>{link.label}</span>
      </Link>
    )
  }

  return (
    <aside style={{
      width: 260,
      background: '#FFFFFF',
      borderRight: '1px solid #E2E8F0',
      height: '100vh',
      position: 'fixed',
      top: 0,
      left: 0,
      display: 'flex',
      flexDirection: 'column',
      zIndex: 40
    }}>
      {/* Brand Header */}
      <div style={{ height: 64, display: 'flex', alignItems: 'center', paddingLeft: 20, paddingRight: 20, borderBottom: '1px solid #E2E8F0' }}>
        <Link href="/en" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Building size={22} color="#16A34A" />
          <span style={{ fontSize: 18, fontWeight: 950, color: '#0F172A', fontFamily: 'Outfit, sans-serif' }}>
            RoutePro <span style={{ color: '#16A34A', fontSize: 11, fontWeight: 700 }}>OS</span>
          </span>
        </Link>
      </div>

      {/* Navigation Sections */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Main Group */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {baseLinks.map(renderLink)}
        </div>

        {/* Transport Modules */}
        {isTransport && (
          <div>
            <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94A3B8', paddingLeft: 12, display: 'block', marginBottom: 6 }}>Transport Operator</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {transportLinks.map(renderLink)}
            </div>
          </div>
        )}

        {/* Dealer Modules */}
        {isDealer && (
          <div>
            <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94A3B8', paddingLeft: 12, display: 'block', marginBottom: 6 }}>Vehicle Dealer</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {dealerLinks.map(renderLink)}
            </div>
          </div>
        )}

        {/* Rental Modules */}
        {isRental && (
          <div>
            <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94A3B8', paddingLeft: 12, display: 'block', marginBottom: 6 }}>Rental Provider</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {rentalLinks.map(renderLink)}
            </div>
          </div>
        )}

        {/* Bottom / Admin Group */}
        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {bottomLinks.map(renderLink)}
          <hr style={{ margin: '8px 0', borderColor: '#F1F5F9' }} />
          <Link
            href="/en"
            className="px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 display flex items-center gap-3 decoration-none"
          >
            <LogOut size={18} className="text-red-400" />
            <span>Leave Hub</span>
          </Link>
        </div>
      </div>
    </aside>
  )
}
