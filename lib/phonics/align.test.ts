import { describe, it, expect } from 'vitest';
import { alignLettersToSounds } from './align';
import { mwToIpaTokens } from '../dictionary/mwToIpa';

const pairs = (word: string, mw: string) =>
  alignLettersToSounds(word, mwToIpaTokens(mw)).pairs.map((p) => [p.grapheme, p.ipa]);

describe('alignLettersToSounds', () => {
  it('aligns 1:1 CVC words', () => {
    expect(pairs('plus', 'ˈpləs')).toEqual([
      ['p', 'p'],
      ['l', 'l'],
      ['u', 'ə'],
      ['s', 's'],
    ]);
  });

  it('aligns r-controlled words', () => {
    expect(pairs('star', 'ˈstär')).toEqual([
      ['s', 's'],
      ['t', 't'],
      ['a', 'ɑ'],
      ['r', 'r'],
    ]);
  });

  it('groups multi-letter graphemes to a single phoneme', () => {
    // cookie: c->k, oo->ʊ, k->k, ie->i
    expect(pairs('cookie', 'ˈku̇-kē')).toEqual([
      ['c', 'k'],
      ['oo', 'ʊ'],
      ['k', 'k'],
      ['ie', 'i'],
    ]);
  });

  it('handles a digraph onset', () => {
    // ship: sh->ʃ, i->ɪ, p->p
    expect(pairs('ship', 'ˈship')).toEqual([
      ['sh', 'ʃ'],
      ['i', 'ɪ'],
      ['p', 'p'],
    ]);
  });

  it('marks a silent e by folding it onto the previous grapheme', () => {
    // make: ˈmāk  ->  m(eɪ from a), then k, with silent e folded onto k
    const res = alignLettersToSounds('make', mwToIpaTokens('ˈmāk'));
    expect(res.pairs.map((p) => p.grapheme).join('')).toBe('make');
    const kPair = res.pairs.find((p) => p.grapheme.includes('e'));
    expect(kPair?.grapheme).toBe('ke');
    expect(kPair?.ipa).toBe('k');
  });

  it('returns empty alignment when phonemes are missing', () => {
    expect(alignLettersToSounds('said', []).pairs).toEqual([{ grapheme: 'said', ipa: '' }]);
  });
});
