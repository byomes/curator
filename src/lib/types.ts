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
  kindle_unlimited: boolean;
  kindle_unlimited_checked_at: string | null;
  status: BookStatus;
  added_by: number | null;
  created_at: string;
  batch_id: number | null;
  batch_total: number | null;
  // Present on book-detail and ingest-status responses; absent from the plain
  // library list (which only needs the spice_rating badge, not full findings).
  findings?: SpiceFinding[];
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

export type JobStatus = "queued" | "running" | "done" | "failed";

export interface IngestJobStatus {
  job_id: number;
  status: JobStatus;
  error_message: string | null;
  batch_id: number | null;
  book: Book | null;
}
