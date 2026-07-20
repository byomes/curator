'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Book, IngestJobStatus, SPICE_SCALE } from '@/lib/types';

type Mode = 'text' | 'image' | 'link' | 'batch';

const TABS: { mode: Mode; label: string }[] = [
  { mode: 'text', label: 'Title / Author' },
  { mode: 'image', label: 'Cover Photo' },
  { mode: 'link', label: 'Link' },
  { mode: 'batch', label: 'Batch' },
];

const POLL_MS = 2500;

function ResearchResultCard({ book, onDone }: { book: Book; onDone: () => void }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(book.title);
  const [author, setAuthor] = useState(book.author);
  const [spiceRating, setSpiceRating] = useState<number | ''>(book.spice_rating ?? '');
  const [spiceNotes, setSpiceNotes] = useState(book.spice_notes ?? '');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function patch(body: Record<string, unknown>) {
    setBusy(true);
    await fetch(`/api/books/${book.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    setBusy(false);
    setDone(true);
  }

  if (done) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center text-sm text-gray-400">
        Saved.{' '}
        <button onClick={onDone} className="text-blue-400 underline">
          Add another
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
      <div className="flex gap-4">
        {book.cover_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={book.cover_image_url}
            alt={book.title}
            className="w-20 h-28 object-cover rounded-lg bg-gray-800 shrink-0"
          />
        ) : (
          <div className="w-20 h-28 rounded-lg bg-gray-800 shrink-0 flex items-center justify-center text-gray-600 text-xs text-center px-1">
            no cover
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="font-medium text-gray-100">{book.title}</h3>
          <p className="text-sm text-gray-500">{book.author}</p>
          {book.series && (
            <p className="text-xs text-gray-600 mt-0.5">
              {book.series}
              {book.series_number ? ` — Book ${book.series_number}${book.series_total ? ` of ${book.series_total}` : ''}` : ''}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-300">
              {book.spice_rating !== null ? `${book.spice_rating} · ${SPICE_SCALE[book.spice_rating]}` : 'Unrated'}
            </span>
            {book.kindle_unlimited && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-900/50 text-blue-400 font-medium">KU</span>
            )}
            {book.page_count && <span className="text-xs text-gray-600">{book.page_count}p</span>}
          </div>
        </div>
      </div>

      {book.spice_summary && <p className="text-sm text-gray-400">{book.spice_summary}</p>}
      {book.description && <p className="text-sm text-gray-500">{book.description}</p>}

      {editing ? (
        <div className="space-y-2 pt-2 border-t border-gray-800">
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
        <div className="flex gap-2 pt-2 border-t border-gray-800">
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
      )}
    </div>
  );
}

export default function AddPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('text');
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [series, setSeries] = useState('');
  const [link, setLink] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [batchText, setBatchText] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Path A: single-item polling state
  const [jobId, setJobId] = useState<number | null>(null);
  const [jobStatus, setJobStatus] = useState<IngestJobStatus | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Path B: batch confirmation
  const [batchResult, setBatchResult] = useState<{ count: number; message: string } | null>(null);

  function resetPolling() {
    if (pollRef.current) clearInterval(pollRef.current);
    if (elapsedRef.current) clearInterval(elapsedRef.current);
    pollRef.current = null;
    elapsedRef.current = null;
  }

  useEffect(() => resetPolling, []);

  function startPolling(id: number) {
    resetPolling();
    setJobId(id);
    setJobStatus(null);
    setElapsed(0);

    elapsedRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    pollRef.current = setInterval(async () => {
      const res = await fetch(`/api/ingest/status/${id}`);
      if (!res.ok) return;
      const data: IngestJobStatus = await res.json();
      setJobStatus(data);
      if (data.status === 'done' || data.status === 'failed') {
        resetPolling();
      }
    }, POLL_MS);
  }

  function resetForm() {
    setTitle('');
    setAuthor('');
    setSeries('');
    setLink('');
    setFile(null);
    setBatchText('');
    setJobId(null);
    setJobStatus(null);
    setBatchResult(null);
    setError(null);
    resetPolling();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (mode === 'batch') {
      const lines = batchText.split('\n').map((l) => l.trim()).filter(Boolean);
      if (lines.length === 0) {
        setError('Add at least one title, or one link.');
        return;
      }
      setSubmitting(true);
      try {
        let items: { title?: string; author?: string; link?: string }[];
        if (lines.length === 1 && /^https?:\/\//i.test(lines[0])) {
          items = [{ link: lines[0] }];
        } else {
          items = lines.map((line) => {
            const idx = line.toLowerCase().lastIndexOf(' by ');
            return idx === -1
              ? { title: line }
              : { title: line.slice(0, idx).trim(), author: line.slice(idx + 4).trim() };
          });
        }
        const res = await fetch('/api/ingest/batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? 'Something went wrong.');
          return;
        }
        setBatchResult({ count: data.count, message: data.message });
        setBatchText('');
      } catch {
        setError('Couldn’t reach Curator. Check your connection and try again.');
      } finally {
        setSubmitting(false);
      }
      return;
    }

    setSubmitting(true);
    try {
      let res: Response;
      if (mode === 'image') {
        if (!file) {
          setError('Choose a cover photo first.');
          setSubmitting(false);
          return;
        }
        const form = new FormData();
        form.append('image', file);
        if (title.trim()) form.append('title', title.trim());
        if (author.trim()) form.append('author', author.trim());
        if (series.trim()) form.append('series', series.trim());
        res = await fetch('/api/ingest', { method: 'POST', body: form });
      } else if (mode === 'link') {
        if (!link.trim()) {
          setError('Paste a link first.');
          setSubmitting(false);
          return;
        }
        res = await fetch('/api/ingest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ link: link.trim() }),
        });
      } else {
        if (!title.trim()) {
          setError('Title is required.');
          setSubmitting(false);
          return;
        }
        res = await fetch('/api/ingest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: title.trim(),
            author: author.trim() || undefined,
            series: series.trim() || undefined,
          }),
        });
      }

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Something went wrong.');
        return;
      }
      startPolling(data.job_id);
      setTitle('');
      setAuthor('');
      setSeries('');
      setLink('');
      setFile(null);
    } catch {
      setError('Couldn’t reach Curator. Check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const isPolling = jobId !== null && jobStatus?.status !== 'done' && jobStatus?.status !== 'failed';

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-gray-100">Add a Book</h1>
        <p className="text-sm text-gray-500 mt-1">Watson researches spice content and Kindle Unlimited status automatically.</p>
      </div>

      <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1">
        {TABS.map((tab) => (
          <button
            key={tab.mode}
            onClick={() => { setMode(tab.mode); resetForm(); }}
            className={`flex-1 text-sm px-3 py-2 rounded-lg font-medium transition-colors ${
              mode === tab.mode ? 'bg-gray-800 text-gray-100' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {jobId === null && !batchResult && (
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'text' && (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Title *</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-gray-100 focus:outline-none focus:border-blue-600"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Author</label>
                <input
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-gray-100 focus:outline-none focus:border-blue-600"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Series</label>
                <input
                  value={series}
                  onChange={(e) => setSeries(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-gray-100 focus:outline-none focus:border-blue-600"
                />
              </div>
            </>
          )}

          {mode === 'image' && (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Cover Photo *</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-gray-800 file:text-gray-200 file:text-sm"
                />
                <p className="text-xs text-gray-600 mt-1.5">Watson reads the cover automatically — title below is optional if the photo is clear.</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Title (if known)</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-gray-100 focus:outline-none focus:border-blue-600"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Author (if known)</label>
                <input
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-gray-100 focus:outline-none focus:border-blue-600"
                />
              </div>
            </>
          )}

          {mode === 'link' && (
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Link *</label>
              <input
                type="url"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="TikTok, Instagram, YouTube, Goodreads, Amazon…"
                className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-gray-100 focus:outline-none focus:border-blue-600"
                autoFocus
              />
            </div>
          )}

          {mode === 'batch' && (
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                Titles (one per line) — or a single link to a book-haul / wrap-up post
              </label>
              <textarea
                value={batchText}
                onChange={(e) => setBatchText(e.target.value)}
                rows={8}
                placeholder={'Fourth Wing by Rebecca Yarros\nThe Hobbit\nBeach Read by Emily Henry\n\n—or—\n\nhttps://tiktok.com/... (a single reel mentioning several books)'}
                className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-gray-100 focus:outline-none focus:border-blue-600 font-mono text-sm"
                autoFocus
              />
              <p className="text-xs text-gray-600 mt-1.5">
                If it&rsquo;s a link, paste just that one link by itself — Watson will try to pull out every book it can confidently
                identify, and email you about anything unclear rather than guess.
              </p>
            </div>
          )}

          {error && (
            <div className="bg-red-900/20 border border-red-800 rounded-xl p-3 text-red-300 text-sm">{error}</div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-50 text-white text-center px-6 py-3.5 rounded-xl font-semibold transition-colors text-base"
          >
            {submitting ? 'Submitting…' : 'Submit'}
          </button>
        </form>
      )}

      {batchResult && (
        <div className="bg-blue-900/20 border border-blue-800 rounded-xl p-4 text-blue-300 text-sm space-y-3">
          <p>{batchResult.message}</p>
          <div className="flex gap-3">
            <button onClick={resetForm} className="text-blue-400 underline text-sm">
              Submit another batch
            </button>
            <button onClick={() => router.push('/pending')} className="text-blue-400 underline text-sm">
              Go to Pending →
            </button>
          </div>
        </div>
      )}

      {jobId !== null && (
        <div className="space-y-3">
          {isPolling && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-gray-700 border-t-blue-500 rounded-full animate-spin shrink-0" />
              <span className="text-sm text-gray-400">Researching… ({elapsed}s)</span>
            </div>
          )}

          {jobStatus?.status === 'failed' && (
            <div className="bg-red-900/20 border border-red-800 rounded-xl p-4 text-red-300 text-sm">
              Something went wrong: {jobStatus.error_message ?? 'unknown error'}
            </div>
          )}

          {jobStatus?.status === 'done' && jobStatus.book && (
            <ResearchResultCard book={jobStatus.book} onDone={resetForm} />
          )}

          {(jobStatus?.status === 'failed' || jobStatus?.status === 'done') && (
            <button onClick={resetForm} className="text-sm text-gray-500 hover:text-gray-300 underline">
              Add another
            </button>
          )}
        </div>
      )}
    </div>
  );
}
