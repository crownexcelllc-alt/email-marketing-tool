import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { AUTH_COOKIE_NAME } from '@/lib/constants/auth';
import { ROUTES } from '@/lib/constants/routes';

function isAuthRoute(pathname: string): boolean {
  return pathname === ROUTES.auth.login || pathname === ROUTES.auth.signup;
}

function isProtectedRoute(pathname: string): boolean {
  return pathname === ROUTES.dashboard.root || pathname.startsWith(`${ROUTES.dashboard.root}/`);
}

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  if (isProtectedRoute(pathname) && !token) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = ROUTES.auth.login;

    const nextValue = `${pathname}${search}`;
    redirectUrl.searchParams.set('next', nextValue);
    return NextResponse.redirect(redirectUrl);
  }

  if (isAuthRoute(pathname) && token) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = ROUTES.dashboard.root;
    redirectUrl.search = '';
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/login', '/signup', '/dashboard/:path*'],
};

