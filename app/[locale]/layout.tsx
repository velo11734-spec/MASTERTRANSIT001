import { ReactNode } from 'react'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import '@/app/globals.css'

interface LocaleLayoutProps {
  children: ReactNode
  params: Promise<{ locale: string }>
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale } = await params;
  // Validate standard supported locales
  const supportedLocales = ['en', 'fr', 'zh', 'yo', 'ig', 'ha', 'sw']
  if (!supportedLocales.includes(locale)) {
    notFound()
  }

  // Get messages for SSR providers
  const messages = await getMessages()

  return (
    <html lang={locale}>
      <head>
        <title>MasterTransit — Digital Transportation Marketplace & Ticketing Platform</title>
        <meta
          name="description"
          content="Centralized digital marketplace connecting passengers with verified transport operators in Nigeria & Africa. Secure online payments, escrow protection, digital tickets & verified fleets."
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@600;700;800&family=JetBrains+Mono:wght@500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased min-h-screen bg-[#080812] flex flex-col">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Navbar />
          <main className="flex-grow pt-16 sm:pt-20">
            {children}
          </main>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
