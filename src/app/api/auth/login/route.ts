import { NextRequest, NextResponse } from 'next/server';
import { watsonFetch } from '@/lib/watson';
import { makeSessionCookieValue, SESSION_COOKIE, MAX_AGE } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const data = await req.json().catch(() => null);
  if (!data) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });

  const name = (data.name ?? '').trim();
  const password = data.password ?? '';
  if (!name || !password) {
    return NextResponse.json({ error: 'Name and password are required.' }, { status: 400 });
  }

  const res = await watsonFetch('/api/curator/auth/login', {
    method: 'POST',
    body: JSON.stringify({ name, password }),
  });

  if (!res.ok) {
    return NextResponse.json({ error: 'Invalid name or password.' }, { status: 401 });
  }

  const user = await res.json().catch(() => null);
  if (!user) return NextResponse.json({ error: 'Invalid name or password.' }, { status: 401 });

  const cookieValue = await makeSessionCookieValue({ userId: user.userId, name: user.name });

  const response = NextResponse.json({ ok: true, userId: user.userId, name: user.name });
  response.cookies.set(SESSION_COOKIE, cookieValue, {
    httpOnly: true,
    maxAge: MAX_AGE,
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });
  return response;
}
