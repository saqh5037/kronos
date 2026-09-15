/**
 * YouTube id extraction + thumbnail rules.
 *
 * Audit 2026-09-15 (`/atleta/movimientos`): the movement library rendered
 * white stills, English-overlay video frames, letter placeholders, fully blank
 * cards and one console 404. Root cause: any string was treated as a thumbnail
 * source, and YouTube answers 200 with a 120×90 gray placeholder for ids that
 * have no real thumbnail — so `onError` never fired.
 *
 * Rules enforced here:
 *  - an id is exactly 11 chars of [A-Za-z0-9_-];
 *  - `thumbnailUrlFor` returns null for anything that is not a valid id, so the
 *    card renders a lucide tile instead of requesting a URL that 404s;
 *  - `isPlaceholderThumbnail` classifies a loaded image by its natural width:
 *    a real `hqdefault` is 480×360, the gray "no thumbnail" filler is 120×90.
 */

const YOUTUBE_ID_RE = /^[A-Za-z0-9_-]{11}$/;

/** A real hqdefault is 480 px wide; YouTube's gray filler is 120 px. */
export const MIN_REAL_THUMBNAIL_WIDTH = 121;

export function isValidYouTubeId(id: string | null | undefined): boolean {
  if (!id) return false;
  return YOUTUBE_ID_RE.test(id);
}

/**
 * Extract a YouTube video id from watch / youtu.be / embed / shorts URLs.
 * Returns null when the URL carries no valid 11-char id.
 */
export function extractYouTubeId(url: string | null): string | null {
  if (!url) return null;

  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/,
    /youtube\.com\/watch\?.*v=([A-Za-z0-9_-]{11})/,
    /youtube\.com\/shorts\/([A-Za-z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    const id = match?.[1];
    if (isValidYouTubeId(id)) return id ?? null;
  }

  return null;
}

/**
 * hqdefault.jpg always exists for valid YouTube ids (maxresdefault only for
 * HD uploads). Callers must not build this URL by hand — an invalid id is what
 * produced the console 404.
 */
export function getYouTubeThumbnail(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

/**
 * The one entry point a card should use: a URL when we can prove the id is
 * well formed, `null` when the card must fall back to an icon tile.
 */
export function thumbnailUrlFor(url: string | null): string | null {
  const id = extractYouTubeId(url);
  if (!id) return null;
  return getYouTubeThumbnail(id);
}

/**
 * True when a loaded <img> is YouTube's gray "no thumbnail" filler (or failed
 * to decode), i.e. the card must swap to the icon tile.
 */
export function isPlaceholderThumbnail(naturalWidth: number): boolean {
  if (!Number.isFinite(naturalWidth)) return true;
  return naturalWidth < MIN_REAL_THUMBNAIL_WIDTH;
}
