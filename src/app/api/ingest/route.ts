import { NextRequest, NextResponse } from 'next/server';
import { watsonFetch } from '@/lib/watson';
import { getSession, SESSION_COOKIE } from '@/lib/auth';

// The Watson backend now responds in ~1-2s (research runs in a background thread
// on the Beelink, not on this request) — this route no longer needs to hold the
// connection open for the 15-40s research pass. A prior version set maxDuration=60
// to cover that wait, but this project is on Vercel's Hobby plan, which hard-caps
// functions at 10s regardless of maxDuration — that's what caused the timeout this
// was meant to fix. Keeping a small buffer for Tailscale Funnel network latency.
export const maxDuration = 10;

export async function POST(request: NextRequest) {
  const session = await getSession(request.cookies.get(SESSION_COOKIE)?.value);
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const contentType = request.headers.get('content-type') ?? '';

  if (contentType.includes('multipart/form-data')) {
    const incoming = await request.formData();
    const outgoing = new FormData();
    for (const [key, value] of incoming.entries()) outgoing.append(key, value);
    outgoing.set('submitted_by', String(session.userId));

    const res = await watsonFetch('/api/curator/ingest', { method: 'POST', body: outgoing });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  }

  const body = await request.json();
  const res = await watsonFetch('/api/curator/ingest', {
    method: 'POST',
    body: JSON.stringify({ ...body, submitted_by: session.userId }),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
