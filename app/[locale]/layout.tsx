import { ReactNode } from 'react'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import Sidebar from '@/components/layout/Sidebar'
import RightPanel from '@/components/layout/RightPanel'
import BottomNav from '@/components/layout/BottomNav'

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
  )
}
