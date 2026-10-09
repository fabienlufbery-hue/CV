/**
 * The static CV can be hosted on GitHub Pages, but its Gemini API runs on
 * a separate Node.js server. Never put a Gemini API key in VITE_* variables.
 */
const configuredBase = (import.meta.env.VITE_API_BASE_URL ?? '').trim().replace(/\/+$/, '');
const githubPages = typeof window !== 'undefined' && window.location.hostname.endsWith('.github.io');

export const backendConfigured = Boolean(configuredBase) || !githubPages;

export function apiUrl(path: string): string {
  return `${configuredBase}${path}`;
}

export function liveUrl(): string {
  const origin = configuredBase || window.location.origin;
  const url = new URL('/live', origin);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  return url.toString();
}
