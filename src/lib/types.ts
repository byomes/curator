export type BookStatus = "pending" | "confirmed" | "needs_review" | "rejected";
export type Shelf = "want_to_read" | "reading" | "read";
export type SourceType =
  | "screenshot"
  | "tiktok"
  | "instagram"
  | "youtube"
  | "goodreads"
  | "amazon"
  | "other";

export const SPICE_SCALE: Record<number, string> = {
  0: "Clean",
  1: "Kissing Only",
  2: "Closed Door",
  3: "Fade to Black",
  4: "Open Door",
  5: "Explicit",
};

export type SpiceSourceType =
  | "pluggedin"
  | "booktriggerwarnings"
  | "commonsensemedia"
  | "clean_romance_blog"
  | "goodreads_reader"
  | "reddit";

// A verbatim, attributed excerpt from a trusted content-rating source — never
// a Watson-authored summary. Displayed as "Source Name: excerpt", quoted.
export interface SpiceFinding {
  id: number;
  book_id: number;
  source_name: string;
  source_type: SpiceSourceType;
  rank: number;
  excerpt: string;
  url: string | null;
}

export interface Book {
  id: number;
  title: string;
  author: string;
  series: string | null;
  series_number: number | null;
  series_total: number | null;
  page_count: number | null;
  spice_rating: number | null;
  spice_notes: string | null;
  cover_image_url: string | null;
  description: string | null;
  // Three-state as of 2026-07-22: true (confirmed on KU), false (confirmed
  // not on KU), null (couldn't verify — e.g. Amazon's bot-block page).
  kindle_unlimited: boolean | null;
  kindle_unlimited_checked_at: string | null;
  status: BookStatus;
  added_by: number | null;
  created_at: string;
  batch_id: number | null;
  batch_total: number | null;
  // Present everywhere as of 2026-07-22 — list_books() (the /api/books GET
  // route) now attaches findings to every book, not just detail/ingest-status
  // responses, so cards can show real source excerpts instead of a computed
  // rating. Still optional here for defensiveness against older cached data.
  findings?: SpiceFinding[];
  // Only present when the request carries a session (list_books() attaches this
  // per the *requesting user's* reading_status row) — null if that user has no
  // row for this book at all. Not the same shape as ReadingStatusEntry (no
  // id/book_id/user_id here, just the fields the library filter/badge need).
  reading_status?: {
    shelf: Shelf;
    rating: number | null;
    date_started: string | null;
    date_finished: string | null;
    notes: string | null;
  } | null;
}

export interface BookSource {
  id: number;
  book_id: number;
  type: SourceType;
  url: string | null;
  raw_extracted_text: string | null;
  created_at: string;
}

export interface BookDetail extends Book {
  sources: BookSource[];
  findings: SpiceFinding[];
}

export interface ReadingStatusEntry {
  id: number;
  book_id: number;
  user_id: number;
  shelf: Shelf;
  rating: number | null;
  date_started: string | null;
  date_finished: string | null;
  notes: string | null;
  title?: string;
  author?: string;
  series?: string | null;
  spice_rating?: number | null;
  page_count?: number | null;
}

export interface Stats {
  year: number;
  count: number;
  total_pages: number;
  books: { title: string; author: string; rating: number | null; date_finished: string | null }[];
}

export interface Session {
  userId: number;
  name: string;
}

// "partial" (curator-spec.md Commit 7): Stage A finished and the book is fully
// visible (same gating rule as always) but Stage B (KU refinement, romance.io
// finding, full spice_rating judgment) is still running in the background.
export type JobStatus = "queued" | "running" | "partial" | "done" | "failed";

export interface IngestJobStatus {
  job_id: number;
  status: JobStatus;
  error_message: string | null;
  batch_id: number | null;
  book: Book | null;
}
