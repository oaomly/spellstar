// 3-tier handwriting OCR resolver for Listen & Write.
//   (1) visitor's own Vision key  -> call Google directly from the browser
//   (2) bundled default content    -> POST to the Netlify proxy (owner's key)
//   (3) neither                    -> throw 'no-ocr' so the UI self-checks
//
// The owner's key never reaches the client — it lives only in the Netlify function.

const VISION_ENDPOINT = 'https://vision.googleapis.com/v1/images:annotate';
const PROXY_ENDPOINT = '/.netlify/functions/vision-ocr';

export type OcrMode = 'own-key' | 'proxy' | 'self-check';

function extractText(json: unknown): string {
  try {
    const resp = (json as { responses?: unknown[] }).responses?.[0] as
      | { fullTextAnnotation?: { text?: string }; textAnnotations?: { description?: string }[] }
      | undefined;
    const text = resp?.fullTextAnnotation?.text ?? resp?.textAnnotations?.[0]?.description ?? '';
    return text.replace(/[^a-zA-Z]/g, '').toLowerCase();
  } catch {
    return '';
  }
}

/** base64 = the raw (no data-URL prefix) PNG bytes of the canvas drawing. */
export async function recognizeHandwriting(
  base64: string,
  opts: { ownKey?: string; allowProxy: boolean },
): Promise<{ text: string; mode: OcrMode }> {
  const body = {
    requests: [
      {
        image: { content: base64 },
        features: [{ type: 'TEXT_DETECTION', maxResults: 1 }],
      },
    ],
  };

  // Tier 1: visitor's own key, called directly.
  if (opts.ownKey && opts.ownKey.trim()) {
    const res = await fetch(`${VISION_ENDPOINT}?key=${encodeURIComponent(opts.ownKey.trim())}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`vision ${res.status}`);
    return { text: extractText(await res.json()), mode: 'own-key' };
  }

  // Tier 2: owner's proxy (only for bundled default content).
  if (opts.allowProxy) {
    const res = await fetch(PROXY_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: base64 }),
    });
    if (!res.ok) throw new Error(`proxy ${res.status}`);
    return { text: extractText(await res.json()), mode: 'proxy' };
  }

  // Tier 3: no OCR available.
  throw new Error('no-ocr');
}
