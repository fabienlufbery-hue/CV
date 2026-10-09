import { Buffer } from 'node:buffer';

export type ChatHistoryItem = { role: 'user' | 'assistant'; content: string };

export function parseChatBody(body: unknown): { message: string; history: ChatHistoryItem[] } | null {
  if (!body || typeof body !== 'object') return null;
  const input = body as Record<string, unknown>;
  if (typeof input.message !== 'string' || !input.message.trim() || input.message.length > 2000) return null;
  const history = input.history === undefined ? [] : input.history;
  if (!Array.isArray(history) || history.length > 8) return null;
  const entries: ChatHistoryItem[] = [];
  for (const entry of history) {
    if (!entry || typeof entry !== 'object') return null;
    const item = entry as Record<string, unknown>;
    if (
      (item.role !== 'user' && item.role !== 'assistant') ||
      typeof item.content !== 'string' ||
      item.content.length > 2000
    ) return null;
    entries.push({ role: item.role, content: item.content });
  }
  return { message: input.message.trim(), history: entries };
}

export function parseTtsBody(body: unknown): { text: string } | null {
  if (!body || typeof body !== 'object') return null;
  const text = (body as Record<string, unknown>).text;
  if (typeof text !== 'string' || !text.trim() || text.length > 1000) return null;
  return { text: text.trim() };
}

export function isAllowedOrigin(origin: string | undefined, host: string | undefined, origins: readonly string[]): boolean {
  // Native clients may omit Origin. Browser-originated cross-site requests may not.
  if (!origin) return true;
  try {
    const url = new URL(origin);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return false;
    if (url.username || url.password || url.pathname !== '/' || url.search || url.hash) return false;
    const canonical = url.origin;
    return origins.includes(canonical) || (Boolean(host) && url.host === host);
  } catch {
    return false;
  }
}

export function createWindowLimiter(limit: number, windowMs: number, now: () => number = Date.now) {
  const buckets = new Map<string, { count: number; expires: number }>();
  return (key: string): boolean => {
    const time = now();
    const record = buckets.get(key);
    if (record && record.expires > time) {
      if (record.count >= limit) return false;
      record.count++;
      return true;
    }
    // Reclaim expired keys; bounded memory even for large public IP sets.
    if (buckets.size > 5000) {
      for (const [k, value] of buckets) if (value.expires <= time) buckets.delete(k);
      if (buckets.size > 5000) buckets.clear();
    }
    buckets.set(key, { count: 1, expires: time + windowMs });
    return true;
  };
}

export function pcmToWav(pcm: Buffer, sampleRate = 24000): Buffer {
  if (pcm.length % 2 !== 0) throw new Error('Invalid PCM length');
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(1, 22); // mono
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
}
