'use client';
import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Book } from '@/lib/types';

function Spinner() {
  return (
    <div className="flex items-center justify-center py-24">
      <div className="w-8 h-8 border-2 border-gray-700 border-t-blue-500 rounded-full animate-spin" />
    </div>
  );
}

function SourcesBadge({ count }: { count: number }) {
  return (
    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-400">
      {count > 0 ? `${count} source${count !== 1 ? 's' : ''} found` : 'No sources found'}
    </span>
  );
}

function KUBadge({ status }: { status: boolean | null }) {
  if (status === true) {
    return (
      <span className="shrink-0 text-xs px-2 py-0.5 rounded-full bg-blue-900/50 text-blue-400 font-medium">
        Kindle Unlimited
      </span>
    );
  }
  if (status === false) {
    return (
      <span className="shrink-0 text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-500">
        Not on KU
      </span>
    );
  }
  return (
    <span className="shrink-0 text-xs px-2 py-0.5 rounded-full bg-yellow-900/30 text-yellow-600">
      KU status unknown
    </span>
  );
}

function BookCard({ book, onDelete }: { book: Book; onDelete: (book: Book) => void }) {
  return (
    <Link
      href={`/book/${book.id}`}
      className="relative block bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-colors"
    >
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onDelete(book);
        }}
        aria-label={`Delete ${book.title}`}
        className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full text-gray-600 hover:text-red-400 hover:bg-red-900/30 transition-colors leading-none"
      >
        ×
      </button>
      <div className="flex items-start justify-between gap-3 pr-6">
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
        <KUBadge status={book.kindle_unlimited} />
      </div>
      <div className="mt-3 flex items-center gap-2">
        <SourcesBadge count={book.findings?.length ?? 0} />
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
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (search.trim()) params.set('search', search.trim());
    if (kuOnly) params.set('kindle_unlimited', '1');
    params.set('show_all', '1');

    fetch(`/api/books?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => setBooks(Array.isArray(data) ? data : []))
      .catch(() => setError('Failed to load books. Check your connection and try again.'))
      .finally(() => setLoading(false));
  }, [search, kuOnly]);

  useEffect(() => {
    const timeout = setTimeout(load, 250);
    return () => clearTimeout(timeout);
  }, [load]);

  const handleDelete = useCallback((book: Book) => {
    if (!window.confirm(`Delete ${book.title}? This can't be undone.`)) return;
    setDeleteError(null);
    fetch(`/api/books/${book.id}`, { method: 'DELETE' })
      .then((res) => {
        if (!res.ok) throw new Error('delete failed');
        setBooks((prev) => prev.filter((b) => b.id !== book.id));
      })
      .catch(() => setDeleteError(`Failed to delete "${book.title}". Try again.`));
  }, []);

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
        </div>
      </div>

      {deleteError && (
        <div className="bg-red-900/20 border border-red-800 rounded-xl p-3 text-red-300 text-sm flex items-center justify-between gap-3">
          <span>{deleteError}</span>
          <button
            type="button"
            onClick={() => setDeleteError(null)}
            className="shrink-0 text-red-400 hover:text-red-300"
          >
            Dismiss
          </button>
        </div>
      )}

      {loading ? (
        <Spinner />
      ) : error ? (
        <div className="bg-red-900/20 border border-red-800 rounded-xl p-4 text-red-300 text-sm">{error}</div>
      ) : books.length === 0 ? (
        <div className="text-center py-20">
          <Image src="/icon.png" alt="Curator" width={64} height={64} className="rounded-xl mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-200 mb-2">No books yet</h2>
          <p className="text-gray-500 mb-6">Add one, or send Watson a screenshot or link.</p>
          <Link href="/" className="inline-block bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl font-medium transition-colors text-base">
            + Add a Book
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {books.map((book) => (
            <BookCard key={book.id} book={book} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
