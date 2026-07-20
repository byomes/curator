import { NextRequest, NextResponse } from 'next/server';
import { watsonFetch } from '@/lib/watson';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;
  const res = await watsonFetch(`/api/curator/ingest/status/${encodeURIComponent(jobId)}`);
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
