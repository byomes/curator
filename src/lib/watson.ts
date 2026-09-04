// Server-only. Never import this from a 'use client' component — CURATOR_WATSON_KEY
// must not reach the browser bundle.
import dns from 'node:dns';
import https from 'node:https';

const WATSON_API_URL = process.env.WATSON_API_URL;
const CURATOR_WATSON_KEY = process.env.CURATOR_WATSON_KEY;

// Tailscale Funnel ingress IPs for watson.tail0243ff.ts.net, observed
// 2026-09-01 (watson-tools/src/lib/watson.ts, same fix, ported here
// 2026-09-04 after the identical crash reproduced live in Curator) and
// stable across 8.8.8.8/1.1.1.1/9.9.9.9. Used only if the system DNS
// resolver itself fails to resolve the hostname.
const FUNNEL_FALLBACK_IPS = ['209.177.145.192', '209.177.145.97'];

// Vercel's runtime DNS resolver intermittently throws `getaddrinfo
// ENOTFOUND` for this specific hostname, in bursts from under a minute to
// 10+ minutes, independent of what's deployed — confirmed both in
// watson-tools (2026-09-01) and, live, in Curator's own login route
// (2026-09-04): plain fetch() has no way to fall back to a known-good IP
// when the resolver itself is failing. node:https.request's own native
// `lookup` option sidesteps this — see watson-tools' watson.ts for the two
// earlier undici-based approaches that were tried and abandoned there
// before landing on this one.
function watsonLookup(
  hostname: string,
  options: dns.LookupOptions,
  callback: (err: NodeJS.ErrnoException | null, address: string | dns.LookupAddress[], family?: number) => void,
): void {
  dns.lookup(hostname, options, (err, address, family) => {
    if (!err) {
      callback(null, address, family);
      return;
    }
    if (options.all) callback(null, FUNNEL_FALLBACK_IPS.map((address) => ({ address, family: 4 })));
    else callback(null, FUNNEL_FALLBACK_IPS[0], 4);
  });
}

function headersToObject(headers: HeadersInit | undefined): Record<string, string> {
  if (!headers) return {};
  if (headers instanceof Headers) return Object.fromEntries(headers.entries());
  if (Array.isArray(headers)) return Object.fromEntries(headers);
  return { ...headers } as Record<string, string>;
}

// FormData needs real multipart/form-data bytes (boundary + per-part
// headers), not something node:https.request can produce on its own.
// Rather than hand-roll that encoding, build a throwaway platform Request
// with the FormData body — its own body/content-type serialization already
// does this correctly — and read the encoded bytes back out. No network
// call happens here, so it isn't exposed to the DNS bug this file exists
// to work around.
async function encodeBody(body: RequestInit['body']): Promise<{ body?: Buffer; contentType?: string }> {
  if (body == null) return {};
  if (typeof body === 'string') return { body: Buffer.from(body) };
  if (body instanceof FormData) {
    const req = new Request('http://placeholder.invalid', { method: 'POST', body });
    return {
      body: Buffer.from(await req.arrayBuffer()),
      contentType: req.headers.get('content-type') ?? undefined,
    };
  }
  throw new Error(`watsonFetch: unsupported body type ${typeof body}`);
}

function nodeRequest(url: string, init: RequestInit, encoded: { body?: Buffer; contentType?: string }): Promise<Response> {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const headers = headersToObject(init.headers);
    if (encoded.contentType) headers['Content-Type'] = encoded.contentType;
    const req = https.request(
      {
        hostname: u.hostname,
        port: u.port ? Number(u.port) : 443,
        path: u.pathname + u.search,
        method: init.method ?? 'GET',
        headers,
        lookup: watsonLookup,
        timeout: 15000,
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          const responseHeaders = new Headers();
          for (const [key, value] of Object.entries(res.headers)) {
            if (typeof value === 'string') responseHeaders.set(key, value);
            else if (Array.isArray(value)) responseHeaders.set(key, value.join(', '));
          }
          resolve(
            new Response(Buffer.concat(chunks), {
              status: res.statusCode ?? 502,
              statusText: res.statusMessage,
              headers: responseHeaders,
            }),
          );
        });
      },
    );
    req.on('error', reject);
    req.on('timeout', () => req.destroy(new Error('watsonFetch request timed out')));
    if (encoded.body) req.write(encoded.body);
    req.end();
  });
}

export async function watsonFetch(path: string, init: RequestInit = {}): Promise<Response> {
  if (!WATSON_API_URL || !CURATOR_WATSON_KEY) {
    throw new Error('WATSON_API_URL and CURATOR_WATSON_KEY must be set');
  }
  const encoded = await encodeBody(init.body);
  const headers: Record<string, string> = {
    'X-Watson-Key': CURATOR_WATSON_KEY,
    ...headersToObject(init.headers),
  };
  // Only set JSON Content-Type when encodeBody() didn't already set one
  // (FormData bodies carry their own multipart boundary in the type).
  if (!encoded.contentType && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }
  return nodeRequest(`${WATSON_API_URL}${path}`, { ...init, headers }, encoded);
}
