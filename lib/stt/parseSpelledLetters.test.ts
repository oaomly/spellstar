import { describe, it, expect } from 'vitest';
import { parseSpelledLetters } from './parseSpelledLetters';

describe('parseSpelledLetters', () => {
  it('handles single-letter tokens', () => {
    expect(parseSpelledLetters('c a t')).toBe('cat');
    expect(parseSpelledLetters('d o g')).toBe('dog');
  });

  it('maps spoken letter-names to letters', () => {
    expect(parseSpelledLetters('see ay tee')).toBe('cat');
    expect(parseSpelledLetters('bee ee')).toBe('be');
    expect(parseSpelledLetters('double-u eye en')).toBe('win');
  });

  it('mixes single letters and names', () => {
    expect(parseSpelledLetters('ess tee ay ar')).toBe('star');
    expect(parseSpelledLetters('s t a r')).toBe('star');
  });

  it('is case-insensitive and ignores punctuation', () => {
    expect(parseSpelledLetters('C, A, T.')).toBe('cat');
    expect(parseSpelledLetters('See Ay Tee!')).toBe('cat');
  });

  it('ignores unrecognised multi-letter tokens (a spoken whole word does not pass)', () => {
    expect(parseSpelledLetters('cat')).toBe('');
    expect(parseSpelledLetters('the word is cat')).toBe('');
  });

  it('returns empty for empty input', () => {
    expect(parseSpelledLetters('')).toBe('');
  });
});
