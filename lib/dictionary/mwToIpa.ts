// Convert Merriam-Webster pronunciation notation to IPA and tokenize into
// phoneme units. MW does not provide raw IPA, so this is a best-effort mapping
// of the common phonemes that appear in grade-1 words.
//
// Combining marks matter: MW writes u̇ (u + U+0307), ȯ (o + U+0307), etc.
// We normalize to NFC and attach combining marks to their base letter.

interface Sym {
  mw: string;
  ipa: string;
}

// Multi-character symbols first (longest match wins).
const MULTI: Sym[] = [
  { mw: 'au̇', ipa: 'aʊ' },
  { mw: 'ȯi', ipa: 'ɔɪ' },
  { mw: 'yü', ipa: 'ju' },
  { mw: 'yu̇', ipa: 'jʊ' },
  { mw: 'ch', ipa: 'tʃ' },
  { mw: 'sh', ipa: 'ʃ' },
  { mw: 'th', ipa: 'θ' },
  { mw: 'zh', ipa: 'ʒ' },
  { mw: 'ng', ipa: 'ŋ' },
];

const SINGLE: Record<string, string> = {
  // vowels
  'ā': 'eɪ',
  'ä': 'ɑ',
  'a': 'æ',
  'ē': 'i',
  'e': 'ɛ',
  'ī': 'aɪ',
  'i': 'ɪ',
  'ō': 'oʊ',
  'ȯ': 'ɔ',
  'o': 'ɑ',
  'ü': 'u',
  'u̇': 'ʊ',
  'u': 'ʌ',
  'ə': 'ə',
  'ŋ': 'ŋ',
  // consonants (identity for most)
  b: 'b', d: 'd', f: 'f', g: 'ɡ', h: 'h', j: 'dʒ', k: 'k', l: 'l',
  m: 'm', n: 'n', p: 'p', r: 'r', s: 's', t: 't', v: 'v', w: 'w',
  y: 'j', z: 'z',
};

const STRESS = new Set(['ˈ', 'ˌ', '‐', '-', ' ', '.', 'ˌ']);
const COMBINING = /[̀-ͯ]/;

/** Attach combining marks to their base character so we scan whole graphemes. */
function toUnits(s: string): string[] {
  const units: string[] = [];
  for (const ch of s.normalize('NFC')) {
    if (COMBINING.test(ch) && units.length) {
      units[units.length - 1] += ch;
    } else {
      units.push(ch);
    }
  }
  return units;
}

/** Tokenize MW pronunciation into an array of IPA phoneme strings. */
export function mwToIpaTokens(mw: string): string[] {
  if (!mw) return [];
  const units = toUnits(mw);
  const tokens: string[] = [];
  let i = 0;
  while (i < units.length) {
    const one = units[i];
    if (STRESS.has(one)) {
      i += 1;
      continue;
    }
    // try 2-unit multi symbols
    const two = one + (units[i + 1] ?? '');
    const multi = MULTI.find((m) => m.mw === two);
    if (multi) {
      tokens.push(multi.ipa);
      i += 2;
      continue;
    }
    const mapped = SINGLE[one];
    if (mapped) {
      tokens.push(mapped);
      i += 1;
      continue;
    }
    // Unknown symbol: keep as-is (rare for grade-1 words).
    if (one.trim()) tokens.push(one);
    i += 1;
  }
  return tokens;
}

/** Full IPA string with primary-stress mark preserved at the front if present. */
export function mwToIpa(mw: string): string {
  const stressed = mw.includes('ˈ') ? 'ˈ' : '';
  return stressed + mwToIpaTokens(mw).join('');
}
