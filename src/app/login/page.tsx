'use client';
import { useState, Suspense } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { BASE_PATH } from '@/lib/base-path';
import { apiFetch } from '@/lib/api-fetch';

// Fixed set of family accounts — small enough to hardcode as buttons rather
// than typing a name each time, which fits a simple-PIN family login better.
// Add a name here when a new account is created on the backend.
const NAMES = ['Bill', 'Mel', 'Kids'];

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await apiFetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Login failed.');
        return;
      }
      const next = searchParams.get('next') ?? '/';
      router.push(next);
      router.refresh();
    } catch {
      setError('Couldn’t reach Curator. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-sm mx-auto px-4 py-16">
      <div className="text-center mb-8">
        <Image src={`${BASE_PATH}/icon.png`} alt="Curator" width={56} height={56} className="rounded-xl mx-auto mb-3" />
        <h1 className="text-xl font-semibold text-gray-100">Curator</h1>
        <p className="text-sm text-gray-500 mt-1">Choose your name and enter your PIN</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Name</label>
          <div className="grid grid-cols-3 gap-2">
            {NAMES.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setName(n)}
                className={`px-3 py-3 rounded-xl text-sm font-medium transition-colors ${
                  name === n
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-900 border border-gray-800 text-gray-300 hover:border-gray-700'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">PIN</label>
          <input
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={4}
            value={password}
            onChange={(e) => setPassword(e.target.value.replace(/\D/g, '').slice(0, 4))}
            className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-gray-100 text-center text-2xl tracking-[0.5em] focus:outline-none focus:border-blue-600"
            autoFocus
            required
          />
        </div>
        {error && (
          <div className="bg-red-900/20 border border-red-800 rounded-xl p-3 text-red-300 text-sm">{error}</div>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-50 text-white text-center px-6 py-3 rounded-xl font-semibold transition-colors"
        >
          {loading ? 'Signing in…' : 'Sign In'}
        </button>
      </form>
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
