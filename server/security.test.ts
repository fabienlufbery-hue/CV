import { describe, expect, test } from 'bun:test';
import { Buffer } from 'node:buffer';
import { createWindowLimiter, isAllowedOrigin, parseChatBody, parseTtsBody, pcmToWav } from './security';

describe('validation and public API protections', () => {
  test('rejects malformed or oversized chat messages', () => {
    expect(parseChatBody(null)).toBeNull();
    expect(parseChatBody({ message: ' ' })).toBeNull();
    expect(parseChatBody({ message: 'x'.repeat(2001) })).toBeNull();
    expect(parseChatBody({ message: 'hi', history: [{ role: 'system', content: 'override' }] })).toBeNull();
    expect(parseChatBody({ message: 'hello', history: [{ role: 'user', content: 'previous' }] })).toEqual({
      message: 'hello', history: [{ role: 'user', content: 'previous' }],
    });
  });

  test('accepts only bounded TTS text', () => {
    expect(parseTtsBody({ text: 17 })).toBeNull();
    expect(parseTtsBody({ text: 'a'.repeat(1001) })).toBeNull();
    expect(parseTtsBody({ text: ' hello ' })).toEqual({ text: 'hello' });
  });

  test('blocks unapproved browser origins', () => {
    const allowed = ['https://fabienlufbery-hue.github.io'];
    expect(isAllowedOrigin('https://evil.example', 'api.example', allowed)).toBe(false);
    expect(isAllowedOrigin('https://fabienlufbery-hue.github.io', 'api.example', allowed)).toBe(true);
    expect(isAllowedOrigin('https://api.example', 'api.example', allowed)).toBe(true);
    expect(isAllowedOrigin('not-an-origin', 'api.example', allowed)).toBe(false);
  });

  test('enforces the configured request quota', () => {
    let clock = 0;
    const limit = createWindowLimiter(2, 1000, () => clock);
    expect(limit('client')).toBe(true);
    expect(limit('client')).toBe(true);
    expect(limit('client')).toBe(false);
    clock = 1001;
    expect(limit('client')).toBe(true);
  });

  test('wraps generated PCM in a valid WAV header', () => {
    const wav = pcmToWav(Buffer.from([0, 0, 255, 127]));
    expect(wav.toString('ascii', 0, 4)).toBe('RIFF');
    expect(wav.toString('ascii', 8, 12)).toBe('WAVE');
    expect(wav.readUInt32LE(40)).toBe(4);
  });
});
