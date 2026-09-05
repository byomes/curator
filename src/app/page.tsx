'use client';
import { useEffect, useRef, useState } from 'react';
import { Book, IngestJobStatus, SPICE_SCALE } from '@/lib/types';
import { apiFetch } from '@/lib/api-fetch';

// Cover Photo / Link / Batch modes removed 2026-09-04 (at Bill's request,
// "for now") — Title/Author is the only add path. Their backend routes
// (/api/curator/ingest's image/link handling, /api/curator/ingest/batch)
// are untouched, just unreachable from this UI; re-add the tab selector
// and the removed form branches/state (file/link/batchText/batchResult) to
// bring them back rather than rebuilding from scratch.

// Tightened 2026-09-04 from 2500 — pure dead-time before the browser notices
// a finished search; up to 2.5s of it was eating into the <10s search budget
// for no reason. NOT tightened all the way to 1000ms: watson-tools' proxy.ts
// rate-limits at 60 req/min per IP, shared across every tool on wtsn.me —
// and household members share one IP via NAT, so 1000ms (60/min) alone would
// consume the *entire* budget for one active poll loop, leaving zero room
// for anyone else in the house using any wtsn.me tool at the same time
// (confirmed live: this exact collision happened during testing, though the
// polling loop degrades gracefully — a failed poll just retries next cycle,
// no crash). 1500ms leaves real headroom.
const POLL_MS = 1500;

function KUBadge({ status }: { status: boolean | null }) {
  if (status === true) {
    return (
      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400 font-medium">
        Kindle Unlimited
      </span>
    );
  }
  if (status === false) {
    return (
      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-500">
        Not on KU
      </span>
    );
  }
  return (
    <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-600">
      KU status unknown
    </span>
  );
}

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
    await apiFetch(`/api/books/${book.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    setBusy(false);
    setDone(true);
  }

  if (done) {
    return (
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 text-center text-sm text-gray-600 dark:text-gray-400">
        Saved.{' '}
        <button onClick={onDone} className="text-blue-600 dark:text-blue-400 underline">
          Add another
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 space-y-3">
      <div className="flex gap-4">
        {book.cover_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={book.cover_image_url}
            alt={book.title}
            className="w-20 h-28 object-cover rounded-lg bg-gray-100 dark:bg-gray-800 shrink-0"
          />
        ) : (
          <div className="w-20 h-28 rounded-lg bg-gray-100 dark:bg-gray-800 shrink-0 flex items-center justify-center text-gray-400 dark:text-gray-600 text-xs text-center px-1">
            no cover
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="font-medium text-gray-900 dark:text-gray-100">{book.title}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-500">{book.author}</p>
          {book.series && (
            <p className="text-xs text-gray-400 dark:text-gray-600 mt-0.5">
              {book.series}
              {book.series_number ? ` — Book ${book.series_number}${book.series_total ? ` of ${book.series_total}` : ''}` : ''}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
              {book.findings && book.findings.length > 0
                ? `${book.findings.length} source${book.findings.length !== 1 ? 's' : ''} found`
                : 'No sources found'}
            </span>
            <KUBadge status={book.kindle_unlimited} />
            {book.page_count && <span className="text-xs text-gray-400 dark:text-gray-600">{book.page_count}p</span>}
          </div>
        </div>
      </div>

      {book.description && <p className="text-sm text-gray-500 dark:text-gray-500">{book.description}</p>}

      {book.findings && book.findings.length > 0 && (
        <div className="space-y-2 pt-1">
          {book.findings.map((f) => (
            <p key={f.id} className="text-sm text-gray-600 dark:text-gray-400 border-l-2 border-gray-300 dark:border-gray-700 pl-3">
              <span className="font-medium text-gray-700 dark:text-gray-300">{f.source_name}:</span> &ldquo;{f.excerpt}&rdquo;
            </p>
          ))}
        </div>
      )}

      {editing ? (
        <div className="space-y-2 pt-2 border-t border-gray-200 dark:border-gray-800">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-gray-100 text-sm"
            placeholder="Title"
          />
          <input
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-gray-100 text-sm"
            placeholder="Author"
          />
          <select
            value={spiceRating}
            onChange={(e) => setSpiceRating(e.target.value === '' ? '' : Number(e.target.value))}
            className="bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-gray-100 text-sm"
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
            className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-gray-100 text-sm"
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
              className="text-sm bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-2 rounded-lg font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2 pt-2 border-t border-gray-200 dark:border-gray-800">
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
            className="flex-1 text-sm bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 px-3 py-2 rounded-lg font-medium disabled:opacity-50"
          >
            ✏️ Edit
          </button>
          <button
            disabled={busy}
            onClick={() => patch({ status: 'rejected' })}
            className="flex-1 text-sm bg-gray-100 dark:bg-gray-800 hover:bg-red-100 dark:hover:bg-red-900/50 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 px-3 py-2 rounded-lg font-medium disabled:opacity-50"
          >
            🚫 Reject
          </button>
        </div>
      )}
    </div>
  );
}

export default function AddPage() {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [series, setSeries] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [photoSubmitting, setPhotoSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [jobId, setJobId] = useState<number | null>(null);
  const [jobStatus, setJobStatus] = useState<IngestJobStatus | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const photoInputRef = useRef<HTMLInputElement | null>(null);

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
      const res = await apiFetch(`/api/ingest/status/${id}`);
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
    setJobId(null);
    setJobStatus(null);
    setError(null);
    resetPolling();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Title is required.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiFetch('/api/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          author: author.trim() || undefined,
          series: series.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Something went wrong.');
        return;
      }
      startPolling(data.job_id);
      setTitle('');
      setAuthor('');
      setSeries('');
    } catch {
      setError('Couldn’t reach Curator. Check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file for a retry
    if (!file) return;

    setError(null);
    setPhotoSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const res = await apiFetch('/api/ingest/photo-search', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Something went wrong.');
        return;
      }
      startPolling(data.job_id);
    } catch {
      setError('Couldn’t reach Curator. Check your connection and try again.');
    } finally {
      setPhotoSubmitting(false);
    }
  }

  // Stage A/B (curator-spec.md Commit 7): the job reaches 'partial' as soon as Stage A
  // finishes and the book is already visible (jobStatus.book populated) -- Stage B
  // (Kindle Unlimited refinement, romance.io finding, full spice_rating) is still
  // running in the background at that point. Polling (startPolling() above) already
  // keeps going through 'partial' and only stops at 'done'/'failed', unchanged.
  const hasBook = jobStatus?.book != null;
  const isWaitingForFirstResult = jobId !== null && !hasBook && jobStatus?.status !== 'failed';
  const isEnriching = jobStatus?.status === 'partial';

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Add a Book</h1>
        <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">Watson researches spice content and Kindle Unlimited status automatically.</p>
      </div>

      {jobId === null && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-500 uppercase tracking-wider mb-1.5">Title *</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-blue-600"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-500 uppercase tracking-wider mb-1.5">Author</label>
            <input
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-blue-600"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-500 uppercase tracking-wider mb-1.5">Series</label>
            <input
              value={series}
              onChange={(e) => setSeries(e.target.value)}
              className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-blue-600"
            />
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 text-red-700 dark:text-red-300 text-sm">{error}</div>
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

      {jobId === null && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-gray-200 dark:bg-gray-800" />
            <span className="text-xs text-gray-400 dark:text-gray-600 uppercase tracking-wider">or</span>
            <div className="h-px flex-1 bg-gray-200 dark:bg-gray-800" />
          </div>
          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handlePhotoChange}
          />
          <button
            type="button"
            disabled={photoSubmitting}
            onClick={() => photoInputRef.current?.click()}
            className="w-full bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 active:bg-gray-100 disabled:opacity-50 border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 text-center px-6 py-3.5 rounded-xl font-semibold transition-colors text-base"
          >
            {photoSubmitting ? 'Identifying…' : '📷 Search by Photo'}
          </button>
          <p className="text-xs text-gray-400 dark:text-gray-600 text-center">
            Take or upload a photo of the book — Watson will try to identify it.
          </p>
        </div>
      )}

      {jobId !== null && (
        <div className="space-y-3">
          {isWaitingForFirstResult && (
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-gray-300 dark:border-gray-700 border-t-blue-500 rounded-full animate-spin shrink-0" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Researching… ({elapsed}s)</span>
            </div>
          )}

          {jobStatus?.status === 'failed' && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-red-700 dark:text-red-300 text-sm">
              Something went wrong: {jobStatus.error_message ?? 'unknown error'}
            </div>
          )}

          {hasBook && jobStatus?.book && (
            <>
              {isEnriching && (
                <div className="flex items-center gap-2 px-1 text-xs text-gray-500 dark:text-gray-500">
                  <div className="w-3 h-3 border-2 border-gray-300 dark:border-gray-700 border-t-blue-500 rounded-full animate-spin shrink-0" />
                  <span>Kindle Unlimited + full rating still loading…</span>
                </div>
              )}
              <ResearchResultCard book={jobStatus.book} onDone={resetForm} />
            </>
          )}

          {(jobStatus?.status === 'failed' || hasBook) && (
            <button onClick={resetForm} className="text-sm text-gray-500 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 underline">
              Add another
            </button>
          )}
        </div>
      )}
    </div>
  );
}
