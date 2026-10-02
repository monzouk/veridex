/**
 * Redirect Path Sanitization
 *
 * Ensures redirect URLs are strictly relative to avoid open-redirect vulnerabilities.
 * Prevents protocol-relative URLs (e.g., //evil.com) and backslash bypasses (/\evil.com).
 */
export function getSafeRedirectUrl(url: string | null | undefined, fallback: string = '/app'): string {
  if (!url) return fallback;

  // Trim whitespace
  const trimmed = url.trim();

  // Must begin with a single slash, not double slash, and not contain protocol
  if (
    trimmed.startsWith('/') &&
    !trimmed.startsWith('//') &&
    !trimmed.includes('\\') &&
    !trimmed.includes('://')
  ) {
    return trimmed;
  }

  return fallback;
}
