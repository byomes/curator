import { NextRequest, NextResponse } from 'next/server';
import { watsonFetch } from '@/lib/watson';
import { makeSessionCookieValue, SESSION_COOKIE, MAX_AGE } from '@/lib/auth';
import { BASE_PATH } from '@/lib/base-path';

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

  if (res.status === 429) {
    const body = await res.json().catch(() => null);
    return NextResponse.json(
      { error: body?.error ?? 'Too many attempts. Try again later.' },
      { status: 429 },
    );
  }
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
    // Scoped to this app's own mount point, not the whole wtsn.me domain —
    // otherwise this cookie gets sent (harmlessly, but needlessly) on every
    // request to hamprep/micah-tasks/watson-tools too, since they all share
    // the domain. Must match logout's delete() path exactly or the browser
    // won't clear it.
    path: BASE_PATH,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });
  return response;
}
