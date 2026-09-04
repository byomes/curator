// Minimal HTTP-level smoke tests against a real `next start` instance.
// No test framework dependency — node:test is built into Node 18+.
//
// Exists specifically because the 2026-09-04 wtsn.me/curator move introduced
// a real auth-bypass bug (a regex middleware matcher silently stopped
// protecting the bare basePath root once basePath was set) that code review
// missed and only live HTTP testing caught. These checks are the minimum
// that would have caught it automatically.
//
// Run with: npm run build && npm test
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const PORT = 3978;
const BASE = `http://localhost:${PORT}`;
const ROOT = fileURLToPath(new URL('..', import.meta.url));
let server;

before(async () => {
  // Spawn next's own bin directly, not via `npx` — npx wraps it in an extra
  // process that doesn't reliably die when the wrapper is killed, leaving a
  // real server (and a hung test run) behind.
  server = spawn(process.execPath, [path.join(ROOT, 'node_modules/.bin/next'), 'start', '-p', String(PORT)], {
    cwd: ROOT,
    env: { ...process.env },
    stdio: 'pipe',
  });
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('server did not start in time')), 20000);
    server.stdout.on('data', (chunk) => {
      if (chunk.toString().includes('Ready')) {
        clearTimeout(timeout);
        resolve();
      }
    });
    server.on('error', reject);
  });
});

after(() => {
  server?.kill();
});

async function get(path, opts) {
  return fetch(`${BASE}${path}`, { redirect: 'manual', ...opts });
}

test('bare root (outside basePath) does not serve the app', async () => {
  const res = await get('/');
  assert.notEqual(res.status, 200);
});

test('unauthenticated /curator (home page, no trailing slash) redirects to login', async () => {
  // This exact case — the canonical bare basePath root — is the one the
  // 2026-09-04 regex matcher silently let through unauthenticated.
  const res = await get('/curator');
  assert.equal(res.status, 307);
  assert.match(res.headers.get('location'), /^\/curator\/login/);
});

test('unauthenticated /curator/add redirects to login with basePath preserved', async () => {
  const res = await get('/curator/add');
  assert.equal(res.status, 307);
  assert.equal(res.headers.get('location'), '/curator/login?next=%2Fadd');
});

test('unauthenticated /curator/api/* returns 401 JSON, not a redirect', async () => {
  const res = await get('/curator/api/auth/me');
  assert.equal(res.status, 401);
  const body = await res.json();
  assert.equal(body.error, 'unauthorized');
});

test('/curator/login itself is reachable without a session', async () => {
  const res = await get('/curator/login');
  assert.equal(res.status, 200);
});

test('public assets (icon, apple-icon) are reachable without a session', async () => {
  for (const path of ['/curator/icon.png', '/curator/apple-icon.png']) {
    const res = await get(path);
    assert.equal(res.status, 200, `${path} should be 200`);
  }
});

test('manifest is reachable without a session', async () => {
  const res = await get('/curator/manifest.webmanifest');
  assert.equal(res.status, 200);
});
