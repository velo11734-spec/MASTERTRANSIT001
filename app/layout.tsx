import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'RoutePro — Book Verified Bus Tickets in Nigeria',
  description: 'Book bus tickets from verified transport companies across Nigeria. Find the best routes, great prices and comfortable rides.',
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
