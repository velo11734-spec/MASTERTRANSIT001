'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Search, CalendarDays, Wallet, User } from 'lucide-react'

const items = [
  { icon: Home,         label: 'Home',     href: '/en' },
  { icon: Search,       label: 'Trips',    href: '/en/search' },
  { icon: CalendarDays, label: 'Bookings', href: '/en/dashboard/bookings' },
  { icon: Wallet,       label: 'Wallet',   href: '/en/dashboard/wallet' },
  { icon: User,         label: 'Profile',  href: '/en/dashboard/profile' },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="mt-bottom-nav">
      {items.map(({ icon: Icon, label, href }) => {
        const isActive = pathname === href || (href !== '/en' && pathname?.startsWith(href))
        return (
          <Link
            key={href}
            href={href}
            className="flex flex-col items-center justify-center gap-0.5 flex-1 py-2 transition-colors"
            style={{ color: isActive ? '#16A34A' : '#94A3B8' }}
          >
            <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
            <span style={{ fontSize: 10, fontWeight: isActive ? 600 : 400 }}>{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
