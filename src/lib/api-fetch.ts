import { BASE_PATH } from "./base-path";

// Client-side fetch wrapper for this app's own same-origin /api/* routes.
// Needed because Next's basePath auto-prefixes next/link, next/image (well,
// almost — see base-path.ts), redirect(), and router.push(), but NOT plain
// fetch() calls — those resolve against the browser's current origin root,
// missing the /curator prefix once this app is reverse-proxied under
// wtsn.me/curator. Route Handlers under src/app/api/ are matched correctly
// on the server regardless — this only fixes the outgoing browser request.
export function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  return fetch(`${BASE_PATH}${path}`, init);
}
