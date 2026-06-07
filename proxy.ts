import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { routing } from '@/i18n/routing'
import createMiddleware from 'next-intl/middleware'

const intlMiddleware = createMiddleware(routing)

const protectedRoutes = {
  passenger: ['/passenger', '/dashboard'],
  company: ['/company'],
  admin: ['/admin'],
}

export async function proxy(request: NextRequest) {
  // Handle i18n routing first
  const { pathname } = request.nextUrl
  const localePattern = /^\/(en|fr|zh|yo|ig|ha|sw)(\/|$)/
  const pathnameWithoutLocale = pathname.replace(localePattern, '/')

  // 1. Get the response from next-intl first
  const response = intlMiddleware(request)

  // 2. If Supabase env vars are missing, just return the intl response
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return response
  }

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            )
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()

    // Auth redirect for protected routes
    const isPassengerRoute = protectedRoutes.passenger.some((r) => pathnameWithoutLocale.startsWith(r))
    const isCompanyRoute = protectedRoutes.company.some((r) => pathnameWithoutLocale.startsWith(r))
    const isAdminRoute = protectedRoutes.admin.some((r) => pathnameWithoutLocale.startsWith(r))

    if ((isPassengerRoute || isCompanyRoute || isAdminRoute) && !user) {
      // Preserve locale prefix in redirect
      const localeMatch = pathname.match(/^\/(en|fr|zh|yo|ig|ha|sw)/)
      const locale = localeMatch ? localeMatch[1] : 'en'
      const loginUrl = new URL(`/${locale}/login`, request.url)
      loginUrl.searchParams.set('redirectTo', pathname)
      return NextResponse.redirect(loginUrl)
    }

    if (user) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
        
      const userRole = profileData?.role ?? user.user_metadata?.role

      if (isAdminRoute && userRole !== 'admin' && userRole !== 'super_admin' && user.email?.toLowerCase() !== 'olaideheritagetemitope@gmail.com') {
        const redirectUrl = userRole === 'company' || userRole === 'company_owner'
          ? new URL('/en/company/dashboard', request.url)
          : new URL('/en/dashboard', request.url)
        return NextResponse.redirect(redirectUrl)
      }

      if (isCompanyRoute && userRole !== 'company' && userRole !== 'company_owner' && userRole !== 'company_staff') {
        const localeMatch = pathname.match(/^\/(en|fr|zh|yo|ig|ha|sw)/)
        const locale = localeMatch ? localeMatch[1] : 'en'
        return NextResponse.redirect(new URL(`/${locale}/dashboard`, request.url))
      }
    }
  } catch (err) {
    // Suppress middleware crash and fallback to intl response
    console.error('Middleware Supabase error:', err)
  }

  return response
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
