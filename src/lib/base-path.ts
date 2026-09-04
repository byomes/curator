// Single source of truth for the sub-path this app is served under
// (wtsn.me/curator/* via a rewrite in the watson-tools project — see
// watson-tools' next.config.ts). next/link, redirect(), and Server Actions
// pick this up automatically once it's set as `basePath` in next.config.ts.
// next/image and plain fetch() calls do NOT get this automatically (Next's
// own docs: App Router next/image "will need to add the basePath in front
// of src") — use apiFetch() (src/lib/api-fetch.ts) for same-origin API
// calls, and prefix this manually for any Image src or other /public asset.
export const BASE_PATH = "/curator";
