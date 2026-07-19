// Server-only. Never import this from a 'use client' component — CURATOR_WATSON_KEY
// must not reach the browser bundle.
const WATSON_API_URL = process.env.WATSON_API_URL;
const CURATOR_WATSON_KEY = process.env.CURATOR_WATSON_KEY;

export async function watsonFetch(path: string, init: RequestInit = {}): Promise<Response> {
  if (!WATSON_API_URL || !CURATOR_WATSON_KEY) {
    throw new Error('WATSON_API_URL and CURATOR_WATSON_KEY must be set');
  }
  const headers: Record<string, string> = {
    'X-Watson-Key': CURATOR_WATSON_KEY,
    ...(init.headers as Record<string, string> | undefined ?? {}),
  };
  // Let fetch set its own multipart boundary — never set Content-Type for FormData bodies.
  if (!(init.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  return fetch(`${WATSON_API_URL}${path}`, {
    ...init,
    headers,
    cache: 'no-store',
  });
}
