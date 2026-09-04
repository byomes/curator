import { NextResponse } from 'next/server';
import { SESSION_COOKIE } from '@/lib/auth';
import { BASE_PATH } from '@/lib/base-path';

export async function POST() {
  const response = NextResponse.json({ ok: true });
  // path must match login's cookies.set() exactly or the browser won't clear it.
  // Also clear the old path:'/' cookie shape (pre-2026-09-04, before the cookie
  // was scoped to BASE_PATH) so anyone already logged in when this shipped
  // still gets a clean logout instead of a lingering stale wide-scoped cookie.
  response.cookies.delete({ name: SESSION_COOKIE, path: BASE_PATH });
  response.cookies.delete({ name: SESSION_COOKIE, path: '/' });
  return response;
}
