'use client';
import { useEffect, useState } from 'react';
import { Book, SPICE_SCALE } from '@/lib/types';

function Spinner() {
  return (
    <div className="flex items-center justify-center py-24">
      <div className="w-8 h-8 border-2 border-gray-700 border-t-blue-500 rounded-full animate-spin" />
    </div>
  );
}

function PendingCard({ book, onChange }: { book: Book; onChange: () => void }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(book.title);
  const [author, setAuthor] = useState(book.author);
  const [spiceRating, setSpiceRating] = useState<number | ''>(book.spice_rating ?? '');
  const [spiceNotes, setSpiceNotes] = useState(book.spice_notes ?? '');
  const [busy, setBusy] = useState(false);

  async function patch(body: Record<string, unknown>) {
    setBusy(true);
    await fetch(`/api/books/${book.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    setBusy(false);
    onChange();
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
      {editing ? (
        <div className="space-y-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-gray-100 text-sm"
            placeholder="Title"
          />
          <input
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-gray-100 text-sm"
            placeholder="Author"
          />
          <div className="flex gap-2">
            <select
              value={spiceRating}
              onChange={(e) => setSpiceRating(e.target.value === '' ? '' : Number(e.target.value))}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-gray-100 text-sm"
            >
              <option value="">Unrated</option>
              {Object.entries(SPICE_SCALE).map(([val, label]) => (
                <option key={val} value={val}>{val} · {label}</option>
              ))}
            </select>
          </div>
          <textarea
            value={spiceNotes}
            onChange={(e) => setSpiceNotes(e.target.value)}
            rows={2}
            placeholder="Spice notes"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-gray-100 text-sm"
          />
          <div className="flex gap-2">
            <button
              disabled={busy}
              onClick={() =>
                patch({
                  title, author, spice_notes: spiceNotes,
                  spice_rating: spiceRating === '' ? null : spiceRating,
                  status: 'confirmed',
                })
              }
              className="flex-1 text-sm bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 rounded-lg font-medium disabled:opacity-50"
            >
              Save & Confirm
            </button>
            <button
              onClick={() => setEditing(false)}
              className="text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-2 rounded-lg font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <div>
            <h3 className="font-medium text-gray-100">{book.title}</h3>
            <p className="text-sm text-gray-500">{book.author}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-300">
              {book.spice_rating !== null ? `${book.spice_rating} · ${SPICE_SCALE[book.spice_rating]}` : 'Unrated'}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              book.status === 'needs_review' ? 'bg-yellow-900/50 text-yellow-400' : 'bg-gray-800 text-gray-400'
            }`}>
              {book.status === 'needs_review' ? 'Needs Review' : 'Pending'}
            </span>
          </div>
          {book.spice_notes && <p className="text-sm text-gray-400">{book.spice_notes}</p>}
          <div className="flex gap-2 pt-1">
            <button
              disabled={busy}
              onClick={() => patch({ status: 'confirmed' })}
              className="flex-1 text-sm bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 rounded-lg font-medium disabled:opacity-50"
            >
              ✅ Approve
            </button>
            <button
              disabled={busy}
              onClick={() => setEditing(true)}
              className="flex-1 text-sm bg-gray-800 hover:bg-gray-700 text-gray-200 px-3 py-2 rounded-lg font-medium disabled:opacity-50"
            >
              ✏️ Edit
            </button>
            <button
              disabled={busy}
              onClick={() => patch({ status: 'rejected' })}
              className="flex-1 text-sm bg-gray-800 hover:bg-red-900/50 text-gray-400 hover:text-red-400 px-3 py-2 rounded-lg font-medium disabled:opacity-50"
            >
              🚫 Reject
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default function PendingPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    Promise.all([
      fetch('/api/books?status=pending&show_all=1').then((r) => r.json()),
      fetch('/api/books?status=needs_review&show_all=1').then((r) => r.json()),
    ])
      .then(([pending, needsReview]) => {
        setBooks([...(needsReview ?? []), ...(pending ?? [])]);
      })
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-gray-100">Pending</h1>
        <p className="text-sm text-gray-500 mt-1">Books Watson found, waiting on approval.</p>
      </div>

      {loading ? (
        <Spinner />
      ) : books.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <div className="text-5xl mb-4">✨</div>
          Nothing waiting on you right now.
        </div>
      ) : (
        <div className="space-y-3">
          {books.map((book) => (
            <PendingCard key={book.id} book={book} onChange={load} />
          ))}
        </div>
      )}
    </div>
  );
}
