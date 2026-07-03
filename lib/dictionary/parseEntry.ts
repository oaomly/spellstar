// Parse a Merriam-Webster (sd2 / Elementary) API response into the fields we use.
// The API returns either an array of entry objects or, for a miss, an array of
// suggestion strings.

import { mwToIpa } from './mwToIpa';

export interface DictionaryEntry {
  word: string;
  partOfSpeech?: string;
  pronMw?: string;
  ipa?: string;
  audioUrl?: string;
  definitions: string[];
  usage: string[];
}

const AUDIO_BASE = 'https://media.merriam-webster.com/audio/prons/en/us/mp3';

/** Build the MW audio URL from a `sound.audio` filename per MW's subdirectory rules. */
export function audioUrl(filename: string): string {
  let sub: string;
  if (filename.startsWith('bix')) sub = 'bix';
  else if (filename.startsWith('gg')) sub = 'gg';
  else if (/^[^a-zA-Z]/.test(filename)) sub = 'number';
  else sub = filename[0];
  return `${AUDIO_BASE}/${sub}/${filename}.mp3`;
}

/** Strip MW inline tokens like {it}..{/it}, {b}, {wi}, cross-ref markup. */
export function stripMarkup(text: string): string {
  return text
    .replace(/\{([a-z_]+)\}/gi, '')
    .replace(/\{\/([a-z_]+)\}/gi, '')
    .replace(/\{([a-z_]+)\|[^}]*\}/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function collectUsage(def: unknown, out: string[]): void {
  if (Array.isArray(def)) {
    if (def[0] === 'vis' && Array.isArray(def[1])) {
      for (const v of def[1]) {
        if (v && typeof v === 'object' && 't' in v) out.push(stripMarkup(String((v as { t: unknown }).t)));
      }
    } else {
      for (const item of def) collectUsage(item, out);
    }
  } else if (def && typeof def === 'object') {
    for (const v of Object.values(def)) collectUsage(v, out);
  }
}

interface MwEntry {
  meta?: { id?: string };
  fl?: string | null;
  hwi?: { hw?: string; prs?: { mw?: string; sound?: { audio?: string } }[] };
  shortdef?: string[];
  def?: unknown;
}

/**
 * Parse a raw MW API response for `word`. Returns null if the word wasn't found
 * (e.g. the API returned spelling suggestions instead of entries).
 */
export function parseDictionaryResponse(raw: unknown, word: string): DictionaryEntry | null {
  if (!Array.isArray(raw) || raw.length === 0) return null;
  if (typeof raw[0] === 'string') return null; // suggestions, not a match

  const target = word.trim().toLowerCase();
  const entries = raw as MwEntry[];
  // Prefer an entry whose headword id matches the requested word.
  const match =
    entries.find((e) => (e.meta?.id ?? '').split(':')[0].replace(/\*/g, '').toLowerCase() === target) ??
    entries[0];

  const prs = match.hwi?.prs?.[0];
  const usage: string[] = [];
  collectUsage(match.def, usage);

  const pronMw = prs?.mw || undefined;

  return {
    word: target,
    partOfSpeech: match.fl ?? undefined,
    pronMw,
    ipa: pronMw ? mwToIpa(pronMw) : undefined,
    audioUrl: prs?.sound?.audio ? audioUrl(prs.sound.audio) : undefined,
    definitions: (match.shortdef ?? []).map(stripMarkup).filter(Boolean),
    usage: usage.slice(0, 3),
  };
}
