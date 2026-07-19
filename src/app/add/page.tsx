'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Mode = 'text' | 'image' | 'link';

const TABS: { mode: Mode; label: string }[] = [
  { mode: 'text', label: 'Title / Author' },
  { mode: 'image', label: 'Cover Photo' },
  { mode: 'link', label: 'Link' },
];

export default function AddPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('text');
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [series, setSeries] = useState('');
  const [link, setLink] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ status: string; reason?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
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
      setResult(data);
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
            onClick={() => { setMode(tab.mode); setError(null); setResult(null); }}
            className={`flex-1 text-sm px-3 py-2 rounded-lg font-medium transition-colors ${
              mode === tab.mode ? 'bg-gray-800 text-gray-100' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

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

        {error && (
          <div className="bg-red-900/20 border border-red-800 rounded-xl p-3 text-red-300 text-sm">{error}</div>
        )}

        {result && (
          <div className="bg-blue-900/20 border border-blue-800 rounded-xl p-3 text-blue-300 text-sm space-y-2">
            <p>
              {result.status === 'needs_review'
                ? 'Added to Pending — Watson couldn’t confidently rate this one, so it needs your review.'
                : 'Added to Pending — check it over and approve.'}
            </p>
            <button
              type="button"
              onClick={() => router.push('/pending')}
              className="text-blue-400 underline text-sm"
            >
              Go to Pending →
            </button>
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-50 text-white text-center px-6 py-3.5 rounded-xl font-semibold transition-colors text-base"
        >
          {submitting ? 'Researching…' : 'Submit'}
        </button>
      </form>
    </div>
  );
}
