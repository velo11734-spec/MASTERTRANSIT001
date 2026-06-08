'use client'

import Link from 'next/link'
import { usePathname, useParams } from 'next/navigation'
import { Home, Search, CalendarDays, Wallet, User } from 'lucide-react'

export default function BottomNav() {
  const pathname = usePathname()
  const params = useParams()
  const locale = (params?.locale as string) || 'en'

  const items = [
    { icon: Home,         label: 'Home',     href: `/${locale}` },
    { icon: Search,       label: 'Trips',    href: `/${locale}/search` },
    { icon: CalendarDays, label: 'Bookings', href: `/${locale}/dashboard/bookings` },
    { icon: Wallet,       label: 'Wallet',   href: `/${locale}/dashboard/wallet` },
    { icon: User,         label: 'Profile',  href: `/${locale}/dashboard/profile` },
  ]

  return (
    <nav className="mt-bottom-nav" role="navigation" aria-label="Mobile navigation">
      {items.map(({ icon: Icon, label, href }) => {
        const isActive = pathname === href || (href !== `/${locale}` && pathname?.startsWith(href))
        return (
          <Link
            key={href}
            href={href}
            className="flex flex-col items-center justify-center gap-0.5 flex-1 py-2 transition-all duration-200 relative"
            style={{ color: isActive ? '#16A34A' : '#94A3B8' }}
            aria-label={label}
            aria-current={isActive ? 'page' : undefined}
          >
            {/* Active indicator dot */}
            {isActive && (
              <span
                style={{
                  position: 'absolute',
                  top: 4,
                  width: 4,
                  height: 4,
                  borderRadius: '50%',
                  background: '#16A34A',
                }}
              />
            )}
            <Icon
              size={22}
              strokeWidth={isActive ? 2.5 : 1.8}
              style={{ transition: 'transform 0.2s ease', transform: isActive ? 'scale(1.1)' : 'scale(1)' }}
            />
            <span style={{ fontSize: 10, fontWeight: isActive ? 600 : 400, lineHeight: 1.2 }}>
              {label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
