import type { MetadataRoute } from 'next';
import { BASE_PATH } from '@/lib/base-path';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Curator',
    short_name: 'Curator',
    description: 'Book discovery & tracking — spice ratings, Kindle Unlimited.',
    // manifest.ts's own route is basePath-prefixed automatically by Next
    // (same file-convention category as icon.png), but the string values
    // *inside* it are plain JSON the framework doesn't rewrite — same
    // manual-prefix rule as next/image and fetch() elsewhere in this app.
    start_url: `${BASE_PATH}/`,
    display: 'standalone',
    background_color: '#0f1117',
    theme_color: '#0f1117',
    icons: [
      { src: `${BASE_PATH}/icon.png`, sizes: '512x512', type: 'image/png' },
      { src: `${BASE_PATH}/apple-icon.png`, sizes: '180x180', type: 'image/png' },
    ],
  };
}
