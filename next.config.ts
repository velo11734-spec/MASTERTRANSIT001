import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // ─── Image domains ────────────────────────────────────────────────────────
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: '**.supabase.in' },
    ],
  },

  // ─── Security & Performance Headers ──────────────────────────────────────
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Prevent clickjacking
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          // Block MIME-type sniffing
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Referrer policy
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // XSS protection (legacy browsers)
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          // Remove powered-by header
          { key: 'X-Powered-By', value: '' },
          // Permissions policy — disable unused browser features
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self), interest-cohort=()',
          },
          // DNS prefetch
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          // Strict Transport Security (HSTS) — 1 year
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          // Content Security Policy
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.paystack.co https://checkout.flutterwave.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https://images.unsplash.com https://*.supabase.co https://*.supabase.in",
              "connect-src 'self' https://*.supabase.co https://*.supabase.in wss://*.supabase.co https://api.paystack.co https://api.flutterwave.com",
              "frame-src https://js.paystack.co https://checkout.flutterwave.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "upgrade-insecure-requests",
            ].join('; '),
          },
        ],
      },
      // Cache static assets aggressively
      {
        source: '/(.*)\\.(ico|png|jpg|jpeg|svg|webp|woff|woff2|ttf|otf)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },

  // ─── Redirects ────────────────────────────────────────────────────────────
  async redirects() {
    return [
      // Redirect root to default locale
      {
        source: '/',
        destination: '/en',
        permanent: false,
      },
      // Legacy URLs
      {
        source: '/home',
        destination: '/en',
        permanent: true,
      },
      {
        source: '/register',
        destination: '/en/register',
        permanent: true,
      },
      {
        source: '/login',
        destination: '/en/login',
        permanent: true,
      },
    ]
  },

  // ─── Experimental ────────────────────────────────────────────────────────
  experimental: {
    // Enable server actions
    serverActions: {
      bodySizeLimit: '5mb',
    },
  },

  // ─── Compiler ────────────────────────────────────────────────────────────
  compiler: {
    // Remove console.log in production
    removeConsole: process.env.NODE_ENV === 'production'
      ? { exclude: ['error', 'warn'] }
      : false,
  },
}

export default nextConfig
