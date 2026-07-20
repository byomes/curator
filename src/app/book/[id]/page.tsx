'use client';
import { use, useEffect, useState } from 'react';
import { BookDetail, ReadingStatusEntry, Session, SPICE_SCALE, Shelf } from '@/lib/types';

function Spinner() {
  return (
    <div className="flex items-center justify-center py-24">
      <div className="w-8 h-8 border-2 border-gray-700 border-t-blue-500 rounded-full animate-spin" />
    </div>
  );
}

const SHELF_LABELS: Record<Shelf, string> = {
  want_to_read: 'Want to Read',
  reading: 'Reading',
  read: 'Read',
};

function seriesLine(book: BookDetail): string | null {
  if (!book.series) return null;
  if (book.series_number && book.series_total) return `${book.series} — Book ${book.series_number} of ${book.series_total}`;
  if (book.series_number) return `${book.series} — Book ${book.series_number}`;
  return book.series;
}

export default function BookDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [book, setBook] = useState<BookDetail | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<ReadingStatusEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notes, setNotes] = useState('');
  const [rating, setRating] = useState<number | ''>('');
  const [showSpiceDetail, setShowSpiceDetail] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`/api/books/${id}`).then((r) => r.json()),
      fetch('/api/auth/me').then((r) => r.json()),
    ]).then(([bookData, sessionData]) => {
      setBook(bookData);
      setSession(sessionData);
      if (sessionData?.userId) {
        fetch(`/api/reading-status?user=${sessionData.userId}`)
          .then((r) => r.json())
          .then((entries: ReadingStatusEntry[]) => {
            const found = entries.find((e) => e.book_id === Number(id));
            if (found) {
              setStatus(found);
              setNotes(found.notes ?? '');
              setRating(found.rating ?? '');
            }
          });
      }
    }).finally(() => setLoading(false));
  }, [id]);

  async function setShelf(shelf: Shelf) {
    if (!session) return;
    setSaving(true);
    const body: Record<string, unknown> = { book_id: Number(id), user_id: session.userId, shelf };
    if (shelf === 'reading' && !status?.date_started) body.date_started = new Date().toISOString().slice(0, 10);
    if (shelf === 'read' && !status?.date_finished) body.date_finished = new Date().toISOString().slice(0, 10);
    const res = await fetch('/api/reading-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setStatus(data);
    setSaving(false);
  }

  async function saveNotesAndRating() {
    if (!session || !status) return;
    setSaving(true);
    const res = await fetch('/api/reading-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        book_id: Number(id),
        user_id: session.userId,
        shelf: status.shelf,
        notes,
        rating: rating === '' ? null : rating,
      }),
    });
    const data = await res.json();
    setStatus(data);
    setSaving(false);
  }

  if (loading) return <Spinner />;
  if (!book) {
    return <div className="max-w-2xl mx-auto px-4 py-12 text-center text-gray-500">Book not found.</div>;
  }

  const spiceLabel = book.spice_rating !== null ? `${book.spice_rating} · ${SPICE_SCALE[book.spice_rating]}` : 'Unrated';
  const series = seriesLine(book);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div className="flex gap-4">
        {book.cover_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={book.cover_image_url}
            alt={book.title}
            className="w-28 h-40 object-cover rounded-lg bg-gray-900 shrink-0"
          />
        ) : (
          <div className="w-28 h-40 rounded-lg bg-gray-900 border border-gray-800 shrink-0 flex items-center justify-center text-gray-700 text-xs text-center px-2">
            no cover found
          </div>
        )}
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold text-gray-100">{book.title}</h1>
          <p className="text-gray-400">{book.author}</p>
          {series && <p className="text-sm text-gray-600 mt-1">{series}</p>}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setShowSpiceDetail((v) => !v)}
          className="text-xs px-2.5 py-1 rounded-full bg-gray-800 text-gray-300 font-medium hover:bg-gray-700 transition-colors"
        >
          {spiceLabel} {book.findings.length > 0 && (showSpiceDetail ? '▲' : '▼')}
        </button>
        {book.kindle_unlimited && (
          <span className="text-xs px-2.5 py-1 rounded-full bg-blue-900/50 text-blue-400 font-medium">Kindle Unlimited</span>
        )}
        {book.page_count && (
          <span className="text-xs px-2.5 py-1 rounded-full bg-gray-800 text-gray-400">{book.page_count} pages</span>
        )}
        <span className="text-xs px-2.5 py-1 rounded-full bg-gray-800 text-gray-500">{book.status}</span>
      </div>

      {showSpiceDetail && book.findings.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            What {book.findings.length} trusted source{book.findings.length !== 1 ? 's' : ''} said
          </h2>
          <div className="space-y-3">
            {book.findings.map((f) => (
              <div key={f.id} className="text-sm border-l-2 border-gray-700 pl-3">
                <p className="text-gray-300">
                  <span className="font-medium text-gray-200">{f.source_name}:</span> &ldquo;{f.excerpt}&rdquo;
                </p>
                {f.url && (
                  <a href={f.url} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:underline">
                    View source →
                  </a>
                )}
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-600">
            These are the sources&rsquo; own words, quoted directly — not Watson&rsquo;s summary. The spice
            rating above is Watson&rsquo;s judgment call after weighing them.
          </p>
        </div>
      )}

      {book.description && (
        <p className="text-sm text-gray-400 leading-relaxed">{book.description}</p>
      )}

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Your Shelf</h2>
        <div className="flex gap-2">
          {(Object.keys(SHELF_LABELS) as Shelf[]).map((shelf) => (
            <button
              key={shelf}
              onClick={() => setShelf(shelf)}
              disabled={saving}
              className={`flex-1 text-sm px-3 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 ${
                status?.shelf === shelf
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-gray-200'
              }`}
            >
              {SHELF_LABELS[shelf]}
            </button>
          ))}
        </div>

        {status && (
          <div className="space-y-3 pt-2">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Your rating (1–5)</label>
              <input
                type="number"
                min={1}
                max={5}
                value={rating}
                onChange={(e) => setRating(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-24 bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-gray-100 text-sm focus:outline-none focus:border-blue-600"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-gray-100 text-sm focus:outline-none focus:border-blue-600"
              />
            </div>
            <button
              onClick={saveNotesAndRating}
              disabled={saving}
              className="text-sm bg-gray-800 hover:bg-gray-700 text-gray-200 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              Save
            </button>
          </div>
        )}
      </div>

      {book.sources.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Sources</h2>
          <div className="space-y-1.5">
            {book.sources.map((s) => (
              <div key={s.id} className="text-sm">
                {s.url ? (
                  <a href={s.url} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline break-all">
                    {s.url}
                  </a>
                ) : (
                  <span className="text-gray-600">({s.type})</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
