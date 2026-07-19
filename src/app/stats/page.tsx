'use client';
import { useEffect, useState } from 'react';
import { Session, Stats } from '@/lib/types';

function Spinner() {
  return (
    <div className="flex items-center justify-center py-24">
      <div className="w-8 h-8 border-2 border-gray-700 border-t-blue-500 rounded-full animate-spin" />
    </div>
  );
}

export default function StatsPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [year, setYear] = useState(new Date().getFullYear());
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me').then((r) => r.json()).then(setSession);
  }, []);

  useEffect(() => {
    if (!session?.userId) return;
    setLoading(true);
    fetch(`/api/stats/${session.userId}/${year}`)
      .then((r) => r.json())
      .then(setStats)
      .finally(() => setLoading(false));
  }, [session, year]);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-100">Reading Stats</h1>
        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-1.5 text-gray-100 text-sm"
        >
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {loading || !stats ? (
        <Spinner />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
              <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Books Read</div>
              <div className="text-2xl font-bold text-gray-100">{stats.count}</div>
            </div>
            <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
              <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Pages Read</div>
              <div className="text-2xl font-bold text-gray-100">{stats.total_pages.toLocaleString()}</div>
            </div>
          </div>

          {stats.books.length === 0 ? (
            <div className="text-center py-16 text-gray-500">No books finished in {year} yet.</div>
          ) : (
            <div className="space-y-2">
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Finished in {year}</h2>
              {stats.books.map((b, i) => (
                <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-3 flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-200 truncate">{b.title}</p>
                    <p className="text-xs text-gray-500 truncate">{b.author}</p>
                  </div>
                  {b.rating && (
                    <span className="text-xs text-gray-400 shrink-0 ml-3">{'★'.repeat(b.rating)}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
