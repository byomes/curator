import { NextRequest, NextResponse } from 'next/server';
import { watsonFetch } from '@/lib/watson';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ user: string; year: string }> }
) {
  const { user, year } = await params;
  const res = await watsonFetch(
    `/api/curator/stats/${encodeURIComponent(user)}/${encodeURIComponent(year)}`
  );
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
