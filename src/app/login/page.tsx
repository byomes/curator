'use client';
import { useEffect, useState, Suspense } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { BASE_PATH } from '@/lib/base-path';
import { apiFetch } from '@/lib/api-fetch';

// PIN-only login (2026-09-04) — no name field. Mirrors the deacon app's
// numeric pin-pad (watson-tools/src/app/cat/deaconapp/login/pin-pad.tsx):
// 4 dot indicators, auto-submits at 4 digits, no separate "Sign In" button.
// Unlike the deacon app's single shared PIN, this one still resolves to a
// specific account server-side (Adults vs Kids) — see jobs/curator/api.py's
// login(), and [[project_curator]] for why Bill and Mel share one PIN.
const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'back'];

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (pin.length !== 4 || loading) return;
    let cancelled = false;
    (async () => {
      setError(null);
      setLoading(true);
      try {
        const res = await apiFetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pin }),
        });
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setError(data.error ?? 'Wrong PIN.');
          setPin('');
          return;
        }
        const next = searchParams.get('next') ?? '/';
        router.push(next);
        router.refresh();
      } catch {
        if (!cancelled) {
          setError('Couldn’t reach Curator. Check your connection and try again.');
          setPin('');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin]);

  function press(key: string) {
    if (loading) return;
    if (key === 'back') {
      setPin((p) => p.slice(0, -1));
    } else if (key && pin.length < 4) {
      setPin((p) => p + key);
    }
  }

  return (
    <div className="max-w-sm mx-auto px-4 py-16">
      <div className="text-center mb-8">
        <Image src={`${BASE_PATH}/icon.png`} alt="Curator" width={56} height={56} className="rounded-xl mx-auto mb-3" />
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Curator</h1>
        <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">Enter your PIN</p>
      </div>

      <div className="flex justify-center gap-3 mb-6">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-4 w-4 rounded-full border-2 ${
              i < pin.length ? 'bg-blue-500 border-blue-500' : 'border-gray-300 dark:border-gray-700'
            }`}
          />
        ))}
      </div>

      {error && (
        <p className="text-center text-sm text-red-600 dark:text-red-300 mb-4">{error}</p>
      )}

      <div className="grid grid-cols-3 gap-3">
        {KEYS.map((key, i) =>
          key === '' ? (
            <div key={i} />
          ) : (
            <button
              key={i}
              type="button"
              onClick={() => press(key)}
              disabled={loading}
              className="h-16 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-gray-100 text-xl font-medium active:scale-95 transition disabled:opacity-50 flex items-center justify-center"
            >
              {key === 'back' ? '⌫' : key}
            </button>
          ),
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
