import { NextRequest, NextResponse } from 'next/server';
import { watsonFetch } from '@/lib/watson';
import { getSession, SESSION_COOKIE } from '@/lib/auth';

// Mirrors /api/ingest/route.ts's multipart branch — see its comment for why
// maxDuration=10 is fine even though identification (Gemini) + research both
// run in the background worker thread on the Beelink, not on this request.
export const maxDuration = 10;

export async function POST(request: NextRequest) {
  const session = await getSession(request.cookies.get(SESSION_COOKIE)?.value);
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const incoming = await request.formData();
  const outgoing = new FormData();
  for (const [key, value] of incoming.entries()) outgoing.append(key, value);
  outgoing.set('submitted_by', String(session.userId));

  const res = await watsonFetch('/api/curator/ingest/photo-search', { method: 'POST', body: outgoing });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
