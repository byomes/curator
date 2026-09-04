import { NextResponse } from 'next/server';
import { SESSION_COOKIE } from '@/lib/auth';
import { BASE_PATH } from '@/lib/base-path';

export async function POST() {
  const response = NextResponse.json({ ok: true });
  // response.cookies.delete() called twice for the SAME cookie name only
  // emits the LAST call as an actual Set-Cookie header — confirmed live
  // 2026-09-04: calling it once for BASE_PATH then once for '/' silently
  // dropped the BASE_PATH clear entirely, leaving the real session cookie
  // (set at path=/curator) never actually cleared on logout. Building the
  // headers directly with headers.append() (which — unlike most headers —
  // Fetch's Headers API lets you send multiple Set-Cookie values for, same
  // as raw HTTP allows) is the only way to emit both. Both paths need
  // clearing: BASE_PATH is what login sets now, '/' is what it set before
  // 2026-09-04, so anyone already logged in when this shipped still gets a
  // clean logout instead of a lingering stale wide-scoped cookie.
  const expired = 'Thu, 01 Jan 1970 00:00:00 GMT';
  const common = `${SESSION_COOKIE}=; Expires=${expired}; HttpOnly; SameSite=Lax${
    process.env.NODE_ENV === 'production' ? '; Secure' : ''
  }`;
  response.headers.append('Set-Cookie', `${common}; Path=${BASE_PATH}`);
  response.headers.append('Set-Cookie', `${common}; Path=/`);
  return response;
}
