import { ReactNode } from 'react'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import Sidebar from '@/components/layout/Sidebar'
import RightPanel from '@/components/layout/RightPanel'
import BottomNav from '@/components/layout/BottomNav'
import '@/app/globals.css'

interface LocaleLayoutProps {
  children: ReactNode
  params: Promise<{ locale: string }>
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params
  const supportedLocales = ['en', 'fr', 'zh', 'yo', 'ig', 'ha', 'sw']
  if (!supportedLocales.includes(locale)) notFound()

  const messages = await getMessages()

  return (
    <html lang={locale}>
      <head>
        <title>RoutePro — Book Verified Bus Tickets in Nigeria</title>
        <meta name="description" content="Book bus tickets from verified transport companies across Nigeria. Find the best routes, great prices and comfortable rides." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Outfit:wght@600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ background: '#F8FAFC' }}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          {/* Top Navbar — full width, fixed */}
          <Navbar />

          {/* Left Sidebar — fixed, desktop only */}
          <Sidebar />

          {/* Main content — offset for sidebar + right panel */}
          <div className="mt-main">
            {children}
          </div>

          {/* Right Panel — fixed, desktop only (1280px+) */}
          <RightPanel />

          {/* Mobile Bottom Nav */}
          <BottomNav />
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
