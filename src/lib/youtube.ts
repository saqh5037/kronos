/**
 * Extract YouTube video ID from various URL formats.
 * Returns null if no valid ID found.
 */
export function extractYouTubeId(url: string | null): string | null {
  if (!url) return null;

  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  return null;
}

export function getYouTubeThumbnail(videoId: string): string {
  // hqdefault.jpg always exists for valid YouTube IDs.
  // maxresdefault is only generated for videos uploaded in HD or higher.
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}
