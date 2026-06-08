import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL('https://routepro-starts.vercel.app'),
  title: {
    default: 'RoutePro — Moving People. Powering Mobility.',
    template: '%s | RoutePro'
  },
  description: 'Book transportation tickets, rent vehicles, hire convoys, purchase vehicles, discover mobility services, explore careers, and manage transportation operations through one connected platform.',
  applicationName: 'RoutePro',
  authors: [{ name: 'RoutePro Team' }],
  generator: 'Next.js',
  keywords: ['mobility', 'transportation', 'bus tickets', 'vehicle rentals', 'convoy services', 'nigeria transit', 'logistics', 'travel'],
  creator: 'RoutePro',
  publisher: 'RoutePro Mobility',
  openGraph: {
    title: 'RoutePro — Moving People. Powering Mobility.',
    description: 'Book transportation tickets, rent vehicles, hire convoys, purchase vehicles, discover mobility services, explore careers, and manage transportation operations through one connected platform.',
    url: 'https://routepro-starts.vercel.app',
    siteName: 'RoutePro',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'RoutePro — Premium Mobility Platform',
      },
    ],
    locale: 'en_NG',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RoutePro — Moving People. Powering Mobility.',
    description: 'Book transportation tickets, rent vehicles, hire convoys, purchase vehicles, discover mobility services, explore careers, and manage transportation operations through one connected platform.',
    images: ['/og-image.png'],
    creator: '@RoutePro',
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png' }
    ],
  },
  manifest: '/site.webmanifest',
  alternates: {
    canonical: '/',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Outfit:wght@600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ background: '#F8FAFC', minHeight: '100vh' }}>
        {children}
      </body>
    </html>
  )
}
