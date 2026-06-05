'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home,
  Search,
  CalendarDays,
  Ticket,
  Star,
  Wallet,
  HelpCircle,
  ChevronRight,
} from 'lucide-react'

const navItems = [
  { icon: Home,        label: 'Home',         href: '/en' },
  { icon: Search,      label: 'Search Trips', href: '/en/search' },
  { icon: CalendarDays,label: 'My Bookings',  href: '/en/dashboard/bookings' },
  { icon: Ticket,      label: 'E-Tickets',    href: '/en/e-tickets' },
  { icon: Star,        label: 'Reviews',      href: '/en/reviews' },
  { icon: Wallet,      label: 'Wallet',       href: '/en/dashboard/wallet' },
  { icon: HelpCircle,  label: 'Help Center',  href: '/en/help-center' },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="mt-sidebar">
      <div className="py-4">
        {navItems.map(({ icon: Icon, label, href }) => {
          const isActive = pathname === href || (href !== '/en' && pathname?.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={`mt-sidebar-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
              <span>{label}</span>
            </Link>
          )
        })}
      </div>

      {/* Company Portal Section */}
      <div className="px-4 pt-2 pb-1">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-2">
          Company
        </p>
        <Link
          href="/en/company/dashboard"
          className="mt-sidebar-item"
        >
          <ChevronRight size={16} />
          <span>Company Portal</span>
        </Link>
        <Link
          href="/en/company/onboarding/step-1"
          className="mt-sidebar-item"
        >
          <ChevronRight size={16} />
          <span>Register Company</span>
        </Link>
      </div>
    </aside>
  )
}
