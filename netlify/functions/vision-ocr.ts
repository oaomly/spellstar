// Serverless proxy for Google Vision handwriting OCR.
// The owner's API key lives ONLY here, as the private env var GOOGLE_VISION_KEY
// (set in the Netlify dashboard). It is never sent to the browser.
//
// Guards: rejects non-POST, oversized payloads, and applies a coarse in-memory
// rate limit per warm instance to bound abuse/billing on the owner's key.

import type { Handler } from '@netlify/functions';

const VISION_ENDPOINT = 'https://vision.googleapis.com/v1/images:annotate';
const MAX_BODY_BYTES = 2_000_000; // ~2MB base64 canvas is plenty
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 40; // requests per warm instance per minute

let hits: number[] = [];

function rateLimited(): boolean {
  const now = Date.now();
  hits = hits.filter((t) => now - t < RATE_WINDOW_MS);
  if (hits.length >= RATE_MAX) return true;
  hits.push(now);
  return false;
}

const json = (statusCode: number, obj: unknown) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(obj),
});

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method not allowed' });
  }

  const key = process.env.GOOGLE_VISION_KEY;
  if (!key) {
    return json(503, { error: 'OCR not configured' });
  }

  if (!event.body || event.body.length > MAX_BODY_BYTES) {
    return json(413, { error: 'Payload too large or empty' });
  }

  if (rateLimited()) {
    return json(429, { error: 'Too many requests, try again shortly' });
  }

  let image: string | undefined;
  try {
    image = JSON.parse(event.body).image;
  } catch {
    return json(400, { error: 'Invalid JSON' });
  }
  if (!image || typeof image !== 'string') {
    return json(400, { error: 'Missing image' });
  }

  try {
    const res = await fetch(`${VISION_ENDPOINT}?key=${encodeURIComponent(key)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: [{ image: { content: image }, features: [{ type: 'TEXT_DETECTION', maxResults: 1 }] }],
      }),
    });
    const data = await res.json();
    return json(res.ok ? 200 : 502, data);
  } catch {
    return json(502, { error: 'Vision request failed' });
  }
};
