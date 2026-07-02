import { describe, it, expect } from 'vitest';
import { splitChunks } from './splitChunks';
import { suggestTricky } from './suggestTricky';

const texts = (w: string) => splitChunks(w).chunks.map((c) => c.text);

describe('splitChunks — CVC words', () => {
  it('splits simple CVC into single sounds', () => {
    expect(texts('cat')).toEqual(['c', 'a', 't']);
    expect(texts('sun')).toEqual(['s', 'u', 'n']);
    expect(texts('pig')).toEqual(['p', 'i', 'g']);
  });
});

describe('splitChunks — digraphs', () => {
  it('keeps digraphs together', () => {
    expect(texts('shop')).toEqual(['sh', 'o', 'p']);
    expect(texts('chin')).toEqual(['ch', 'i', 'n']);
    expect(texts('this')).toEqual(['th', 'i', 's']);
    expect(texts('duck')).toEqual(['d', 'u', 'ck']);
    expect(texts('ring')).toEqual(['r', 'i', 'ng']);
  });
});

describe('splitChunks — blends', () => {
  it('keeps initial blends together', () => {
    expect(texts('plus')).toEqual(['pl', 'u', 's']);
    expect(texts('glass')).toEqual(['gl', 'a', 'ss']);
    expect(texts('frog')).toEqual(['fr', 'o', 'g']);
    expect(texts('stop')).toEqual(['st', 'o', 'p']);
  });
  it('keeps final blends together', () => {
    expect(texts('hand')).toEqual(['h', 'a', 'nd']);
    expect(texts('jump')).toEqual(['j', 'u', 'mp']);
  });
});

describe('splitChunks — vowel teams & r-controlled', () => {
  it('handles r-controlled vowels', () => {
    expect(texts('star')).toEqual(['st', 'ar']);
    expect(texts('bird')).toEqual(['b', 'ir', 'd']);
    expect(texts('corn')).toEqual(['c', 'or', 'n']);
  });
  it('handles vowel teams', () => {
    expect(texts('rain')).toEqual(['r', 'ai', 'n']);
    expect(texts('boat')).toEqual(['b', 'oa', 't']);
    expect(texts('feet')).toEqual(['f', 'ee', 't']);
  });
});

describe('splitChunks — magic e', () => {
  it('treats final consonant+e as a silent-e chunk', () => {
    expect(texts('make')).toEqual(['m', 'a', 'ke']);
    expect(texts('bike')).toEqual(['b', 'i', 'ke']);
    expect(texts('nose')).toEqual(['n', 'o', 'se']);
  });
});

describe('splitChunks — multi-syllable fallback', () => {
  it('produces a reasonable split for cookie', () => {
    const parts = texts('cookie');
    expect(parts.length).toBeGreaterThanOrEqual(2);
    expect(parts.join('')).toBe('cookie');
  });
});

describe('suggestTricky', () => {
  it('flags known sight words', () => {
    expect(suggestTricky('said').tricky).toBe(true);
    expect(suggestTricky('was').tricky).toBe(true);
    expect(suggestTricky('come').tricky).toBe(true);
    expect(suggestTricky('the').tricky).toBe(true);
  });
  it('does not flag clean phonetic words', () => {
    expect(suggestTricky('shop').tricky).toBe(false);
    expect(suggestTricky('star').tricky).toBe(false);
    expect(suggestTricky('plus').tricky).toBe(false);
  });
});
