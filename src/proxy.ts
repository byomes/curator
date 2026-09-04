import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE, getSession } from '@/lib/auth';

const PUBLIC_PATHS = ['/login'];
// Next.js's App Router icon-convention routes — must stay publicly fetchable
// (no session cookie) or Safari's home-screen icon fetch gets redirected to
// the login page HTML instead of image bytes.
const PUBLIC_ASSETS = ['/icon.png', '/apple-icon.png', '/favicon.ico', '/manifest.webmanifest'];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith('/_next/') ||
    PUBLIC_ASSETS.includes(pathname) ||
    pathname.startsWith('/api/auth/') ||
    PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))
  ) {
    return NextResponse.next();
  }

  const cookieValue = request.cookies.get(SESSION_COOKIE)?.value;
  const session = await getSession(cookieValue);

  if (!session) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
    // nextUrl.clone() (not `new URL('/login', request.url)`) so the
    // redirect target keeps the /curator basePath — a plain URL join would
    // resolve "/login" against the origin root and drop it.
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

// No `config.matcher` — deliberately. Confirmed live 2026-09-04: once
// basePath ("/curator") was set, the previous regex-based matcher
// (`/((?!_next/static|...).*)`) silently stopped matching the bare basePath
// root (canonical "/curator", no trailing slash — the home page URL) while
// still correctly matching sub-paths like "/curator/add". That let the
// unauthenticated home page serve in full — a real auth bypass. Next's
// matcher+basePath interaction isn't documented clearly enough to trust a
// regex at that boundary, so Proxy now runs on every request and the
// exclusions above (static assets, icons, /api/auth/*, /login) are plain
// string checks on the already basePath-stripped `pathname` instead.
