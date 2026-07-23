import { NextRequest, NextResponse } from 'next/server';
import { watsonFetch } from '@/lib/watson';
import { getSession, SESSION_COOKIE } from '@/lib/auth';

export async function GET(request: NextRequest) {
  // Injects the session's userId as `user` server-side, same pattern as ingest/route.ts's
  // submitted_by -- the client never needs to know its own user id. Watson only uses `user`
  // to attach each book's reading_status and, if `read` is also passed, filter by it; it's
  // a no-op for every existing caller/query shape when there's no session.
  const session = await getSession(request.cookies.get(SESSION_COOKIE)?.value);
  const params = new URLSearchParams(request.nextUrl.searchParams);
  if (session) {
    params.set('user', String(session.userId));
  }
  const qs = params.toString();
  const res = await watsonFetch(`/api/curator/books${qs ? `?${qs}` : ''}`);
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const res = await watsonFetch('/api/curator/books', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
