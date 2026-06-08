import { ReactNode } from 'react'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import Sidebar from '@/components/layout/Sidebar'
import RightPanel from '@/components/layout/RightPanel'
import BottomNav from '@/components/layout/BottomNav'
import Footer from '@/components/layout/Footer'
import { createClient } from '@/lib/supabase/server'

interface LocaleLayoutProps {
  children: ReactNode
  params: Promise<{ locale: string }>
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params
  const supportedLocales = ['en', 'fr', 'zh', 'yo', 'ig', 'ha', 'sw']
  if (!supportedLocales.includes(locale)) notFound()

  const messages = await getMessages()

  // Fetch footer branding settings server-side for instant render (no client flash)
  let footerSettings: Record<string, string> = {}
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('platform_settings')
      .select('key, value')
      .eq('category', 'branding')
    if (data) {
      footerSettings = Object.fromEntries(data.map((r) => [r.key, r.value ?? '']))
    }
  } catch (_) {
    // Graceful fallback to defaults in Footer component
  }

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

      {/* Footer — full width, public-facing */}
      <Footer settings={footerSettings} locale={locale} />
    </NextIntlClientProvider>
  )
}

