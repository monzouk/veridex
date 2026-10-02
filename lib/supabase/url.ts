/**
 * Site and Callback URL Utility
 *
 * Resolves the base URL dynamically based on:
 * 1. Explicit NEXT_PUBLIC_SITE_URL environment variable
 * 2. Vercel deployment URL (VERCEL_URL / NEXT_PUBLIC_VERCEL_URL)
 * 3. Incoming request headers (x-forwarded-host, host, x-forwarded-proto)
 * 4. Fallback for local development (http://localhost:3002)
 */

type HeadersLike = {
  get(name: string): string | null;
};

export function getSiteUrl(headersList?: HeadersLike | null): string {
  // 1. Explicitly configured site URL
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    const configured = process.env.NEXT_PUBLIC_SITE_URL.trim().replace(/\/+$/, '');
    if (configured) {
      return configured.startsWith('http') ? configured : `https://${configured}`;
    }
  }

  // 2. Vercel deployment URL
  const vercelUrl = process.env.NEXT_PUBLIC_VERCEL_URL || process.env.VERCEL_URL;
  if (vercelUrl) {
    const trimmed = vercelUrl.trim().replace(/\/+$/, '');
    return trimmed.startsWith('http') ? trimmed : `https://${trimmed}`;
  }

  // 3. Dynamic request headers
  if (headersList) {
    const forwardedHost = headersList.get('x-forwarded-host');
    const host = forwardedHost || headersList.get('host');
    if (host) {
      const forwardedProto = headersList.get('x-forwarded-proto');
      const isLocalhost = host.includes('localhost') || host.startsWith('127.0.0.1');
      const protocol = forwardedProto || (isLocalhost ? 'http' : 'https');
      return `${protocol}://${host}`;
    }
  }

  // 4. Fallback based on environment
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3002';
  }

  return 'http://localhost:3002';
}
