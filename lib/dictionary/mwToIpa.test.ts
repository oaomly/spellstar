import { describe, it, expect } from 'vitest';
import { mwToIpaTokens, mwToIpa } from './mwToIpa';

describe('mwToIpaTokens', () => {
  it('tokenizes simple words, dropping stress + syllable marks', () => {
    expect(mwToIpaTokens('ˈpləs')).toEqual(['p', 'l', 'ə', 's']);
    expect(mwToIpaTokens('ˈstär')).toEqual(['s', 't', 'ɑ', 'r']);
  });

  it('handles combining dot-above vowels and syllable hyphens', () => {
    // cookie: ˈku̇-kē  ->  k ʊ k i
    expect(mwToIpaTokens('ˈku̇-kē')).toEqual(['k', 'ʊ', 'k', 'i']);
  });

  it('handles consonant digraphs', () => {
    expect(mwToIpaTokens('ˈship')).toEqual(['ʃ', 'ɪ', 'p']);
    expect(mwToIpaTokens('ˈchān')).toEqual(['tʃ', 'eɪ', 'n']);
  });
});

describe('mwToIpa', () => {
  it('keeps a leading stress mark', () => {
    expect(mwToIpa('ˈstär')).toBe('ˈstɑr');
  });
});
