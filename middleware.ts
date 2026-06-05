import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { routing } from '@/i18n/routing'
import createMiddleware from 'next-intl/middleware'

const intlMiddleware = createMiddleware(routing)

const protectedRoutes = {
  passenger: ['/passenger'],
  company: ['/company'],
  admin: ['/admin'],
}

export async function middleware(request: NextRequest) {
  // Handle i18n routing first
  const { pathname } = request.nextUrl

  // Strip locale prefix to check route
  const localePattern = /^\/(en|fr|zh|yo|ig|ha|sw)(\/|$)/
  const pathnameWithoutLocale = pathname.replace(localePattern, '/')

  let response = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Auth redirect for protected routes
  const isPassengerRoute = protectedRoutes.passenger.some((r) =>
    pathnameWithoutLocale.startsWith(r)
  )
  const isCompanyRoute = protectedRoutes.company.some((r) =>
    pathnameWithoutLocale.startsWith(r)
  )
  const isAdminRoute = protectedRoutes.admin.some((r) =>
    pathnameWithoutLocale.startsWith(r)
  )

  if ((isPassengerRoute || isCompanyRoute || isAdminRoute) && !user) {
    const loginUrl = new URL(`/login`, request.url)
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (user) {
    // Fetch role from profiles table (fallback to user_metadata if missing)
    const { data: profileData, error: profileErr } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    const userRole = profileData?.role ?? user.user_metadata?.role;

    // Admin routes require admin or super_admin role (or specific admin email)
    if (isAdminRoute && userRole !== 'admin' && userRole !== 'super_admin' && user.email?.toLowerCase() !== 'olaideheritagetemitope@gmail.com') {
      const redirectUrl = userRole === 'company' || userRole === 'company_owner'
        ? new URL('/en/company/dashboard', request.url)
        : new URL('/en/dashboard', request.url);
      return NextResponse.redirect(redirectUrl);
    }

    // Company routes require company or company_owner or company_staff role
    if (isCompanyRoute && userRole !== 'company' && userRole !== 'company_owner' && userRole !== 'company_staff') {
      return NextResponse.redirect(new URL('/en/dashboard', request.url));
    }
  }

  // Apply intl middleware
  return intlMiddleware(request)
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
