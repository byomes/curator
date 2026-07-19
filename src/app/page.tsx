'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Book, SPICE_SCALE } from '@/lib/types';

function Spinner() {
  return (
    <div className="flex items-center justify-center py-24">
      <div className="w-8 h-8 border-2 border-gray-700 border-t-blue-500 rounded-full animate-spin" />
    </div>
  );
}

function SpiceBadge({ rating }: { rating: number | null }) {
  if (rating === null) {
    return (
      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-500">unrated</span>
    );
  }
  const colors = [
    'bg-green-900/50 text-green-400',
    'bg-green-900/50 text-green-400',
    'bg-yellow-900/50 text-yellow-400',
    'bg-orange-900/50 text-orange-400',
    'bg-red-900/50 text-red-400',
    'bg-red-900/50 text-red-400',
  ];
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors[rating]}`}>
      {rating} · {SPICE_SCALE[rating]}
    </span>
  );
}

function BookCard({ book }: { book: Book }) {
  return (
    <Link
      href={`/book/${book.id}`}
      className="block bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-medium text-gray-100 truncate">{book.title}</h3>
          <p className="text-sm text-gray-500 truncate">{book.author}</p>
          {book.series && (
            <p className="text-xs text-gray-600 mt-0.5">
              {book.series}
              {book.series_number ? ` #${book.series_number}` : ''}
            </p>
          )}
        </div>
        {book.kindle_unlimited && (
          <span className="shrink-0 text-xs px-2 py-0.5 rounded-full bg-blue-900/50 text-blue-400 font-medium">
            KU
          </span>
        )}
      </div>
      <div className="mt-3 flex items-center gap-2">
        <SpiceBadge rating={book.spice_rating} />
        {book.page_count && <span className="text-xs text-gray-600">{book.page_count}p</span>}
      </div>
    </Link>
  );
}

export default function LibraryPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [kuOnly, setKuOnly] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (search.trim()) params.set('search', search.trim());
    if (kuOnly) params.set('kindle_unlimited', '1');
    if (showAll) params.set('show_all', '1');

    fetch(`/api/books?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => setBooks(Array.isArray(data) ? data : []))
      .catch(() => setError('Failed to load books. Check your connection and try again.'))
      .finally(() => setLoading(false));
  }, [search, kuOnly, showAll]);

  useEffect(() => {
    const timeout = setTimeout(load, 250);
    return () => clearTimeout(timeout);
  }, [load]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      <div className="space-y-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search title, author, series…"
          className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-gray-100 text-sm focus:outline-none focus:border-blue-600"
        />
        <div className="flex items-center gap-4 text-sm">
          <label className="flex items-center gap-2 text-gray-400">
            <input
              type="checkbox"
              checked={kuOnly}
              onChange={(e) => setKuOnly(e.target.checked)}
              className="accent-blue-600"
            />
            Kindle Unlimited only
          </label>
          <label className="flex items-center gap-2 text-gray-400">
            <input
              type="checkbox"
              checked={showAll}
              onChange={(e) => setShowAll(e.target.checked)}
              className="accent-blue-600"
            />
            Show all spice levels
          </label>
        </div>
        {!showAll && (
          <p className="text-xs text-gray-600">Showing spice 0–3 by default. Check &quot;show all&quot; to include 4–5.</p>
        )}
      </div>

      {loading ? (
        <Spinner />
      ) : error ? (
        <div className="bg-red-900/20 border border-red-800 rounded-xl p-4 text-red-300 text-sm">{error}</div>
      ) : books.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">📚</div>
          <h2 className="text-xl font-semibold text-gray-200 mb-2">No books yet</h2>
          <p className="text-gray-500 mb-6">Add one, or send Watson a screenshot or link.</p>
          <Link href="/add" className="inline-block bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl font-medium transition-colors text-base">
            + Add a Book
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {books.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      )}
    </div>
  );
}
