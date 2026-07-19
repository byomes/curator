import { NextRequest, NextResponse } from 'next/server';
import { watsonFetch } from '@/lib/watson';
import { getSession, SESSION_COOKIE } from '@/lib/auth';

// Research pass (Serper + Ollama synthesis) can take 15-40s — extend past the
// platform's default function timeout.
export const maxDuration = 60;

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
