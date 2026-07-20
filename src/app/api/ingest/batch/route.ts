import { NextRequest, NextResponse } from 'next/server';
import { watsonFetch } from '@/lib/watson';
import { getSession, SESSION_COOKIE } from '@/lib/auth';

export const maxDuration = 10;

export async function POST(request: NextRequest) {
  const session = await getSession(request.cookies.get(SESSION_COOKIE)?.value);
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = await request.json();
  const res = await watsonFetch('/api/curator/ingest/batch', {
    method: 'POST',
    body: JSON.stringify({ ...body, submitted_by: session.userId }),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
