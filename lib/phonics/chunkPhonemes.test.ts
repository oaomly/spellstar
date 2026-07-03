import { describe, it, expect } from 'vitest';
import { chunkPhonemes, wordIpa } from './chunkPhonemes';
import type { Word } from '../data/types';

function w(word: string, pronMw: string, chunks: [string, Word['chunks'][number]['type']][]): Word {
  return {
    id: word,
    word,
    def: '',
    sentence: '',
    tricky: false,
    chunksSource: 'auto',
    pronMw,
    chunks: chunks.map(([text, type]) => ({ text, type })),
  };
}

describe('chunkPhonemes', () => {
  it('maps blend + r-controlled chunks to their sounds (star)', () => {
    const star = w('star', 'ˈstär', [['st', 'blend'], ['ar', 'rControlled']]);
    expect(chunkPhonemes(star)).toEqual(['s·t', 'ɑ·r']);
  });

  it('maps a doubled-consonant chunk to one sound (glass)', () => {
    const glass = w('glass', 'ˈglas', [['gl', 'blend'], ['a', 'vowel'], ['ss', 'consonant']]);
    expect(chunkPhonemes(glass)).toEqual(['ɡ·l', 'æ', 's']);
  });

  it('maps multi-letter vowel teams to single sounds (cookie)', () => {
    const cookie = w('cookie', 'ˈku̇-kē', [
      ['c', 'consonant'],
      ['oo', 'vowelTeam'],
      ['k', 'consonant'],
      ['ie', 'vowelTeam'],
    ]);
    expect(chunkPhonemes(cookie)).toEqual(['k', 'ʊ', 'k', 'i']);
  });

  it('returns null when the word has no pronunciation', () => {
    const said: Word = { id: 'said', word: 'said', def: '', sentence: '', tricky: true, chunks: [] };
    expect(chunkPhonemes(said)).toBeNull();
  });

  it('wordIpa derives IPA from MW notation', () => {
    expect(wordIpa(w('star', 'ˈstär', [['st', 'blend'], ['ar', 'rControlled']]))).toBe('ˈstɑr');
  });
});
