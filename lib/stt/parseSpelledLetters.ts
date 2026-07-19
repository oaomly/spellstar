// Turns a Google Speech-to-Text transcript of a child spelling a word OUT LOUD
// into a best-effort letter string. Kids say "see - ay - tee" (or "c a t"), and
// STT returns anything from "c a t" to "see ay tea" to "cee eh tee". We map the
// common letter-name homophones back to single letters and drop the rest.
//
// Deliberately strict: an unrecognised multi-letter token (e.g. STT collapsing
// the spelling into the whole word "cat") is ignored rather than split, so that
// simply *saying the word* doesn't pass a spelling check.

const LETTER_WORDS: Record<string, string> = {
  ay: 'a', eh: 'a',
  bee: 'b', be: 'b', bea: 'b',
  see: 'c', sea: 'c', cee: 'c',
  dee: 'd', de: 'd',
  ee: 'e', ea: 'e',
  ef: 'f', eff: 'f',
  gee: 'g', jee: 'g',
  aitch: 'h', haitch: 'h',
  eye: 'i',
  jay: 'j', jai: 'j',
  kay: 'k', kaye: 'k',
  el: 'l', ell: 'l',
  em: 'm', emm: 'm',
  en: 'n', enn: 'n',
  oh: 'o', ohh: 'o', owe: 'o',
  pee: 'p', pea: 'p',
  cue: 'q', queue: 'q', kew: 'q', kue: 'q',
  ar: 'r', are: 'r', arr: 'r',
  es: 's', ess: 's',
  tee: 't', tea: 't', te: 't',
  you: 'u', yoo: 'u', ewe: 'u',
  vee: 'v', ve: 'v',
  doubleu: 'w', 'double-u': 'w', 'double-you': 'w', dubya: 'w',
  ex: 'x', ecks: 'x', eks: 'x',
  why: 'y', wy: 'y', wye: 'y',
  zee: 'z', zed: 'z', zi: 'z',
};

/** Phrase hints fed to STT to bias it toward letters (single letters + names). */
export const LETTER_HINTS: string[] = [
  ...'abcdefghijklmnopqrstuvwxyz'.split(''),
  'ay', 'bee', 'see', 'dee', 'ee', 'ef', 'gee', 'aitch', 'eye', 'jay', 'kay',
  'el', 'em', 'en', 'oh', 'pee', 'cue', 'ar', 'ess', 'tee', 'you', 'vee',
  'double-u', 'ex', 'why', 'zee',
];

export function parseSpelledLetters(transcript: string): string {
  if (!transcript) return '';
  const tokens = transcript
    .toLowerCase()
    .replace(/[^a-z\s-]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

  let out = '';
  for (const tok of tokens) {
    if (tok.length === 1 && tok >= 'a' && tok <= 'z') {
      out += tok;
    } else if (LETTER_WORDS[tok]) {
      out += LETTER_WORDS[tok];
    }
    // else: unrecognised token — ignore (see header note).
  }
  return out;
}
