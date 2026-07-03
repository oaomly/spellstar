import { describe, it, expect } from 'vitest';
import { parseDictionaryResponse, audioUrl, stripMarkup } from './parseEntry';

describe('audioUrl', () => {
  it('uses the first letter as the subdirectory', () => {
    expect(audioUrl('star0001')).toBe('https://media.merriam-webster.com/audio/prons/en/us/mp3/s/star0001.mp3');
  });
  it('uses special subdirectories for bix/gg/number', () => {
    expect(audioUrl('bixxx01')).toContain('/bix/');
    expect(audioUrl('3star01')).toContain('/number/');
  });
});

describe('stripMarkup', () => {
  it('removes MW inline tokens', () => {
    expect(stripMarkup('a movie {it}star{/it}')).toBe('a movie star');
  });
});

describe('parseDictionaryResponse', () => {
  const starResponse = [
    {
      meta: { id: 'star:1' },
      fl: 'noun',
      hwi: { hw: 'star', prs: [{ mw: 'ˈstär', sound: { audio: 'star0001' } }] },
      shortdef: ['any of the heavenly bodies visible at night'],
      def: [{ sseq: [[['sense', { dt: [['text', 'def'], ['vis', [{ t: 'a movie {it}star{/it}' }]]] }]]] }],
    },
  ];

  it('extracts pronunciation, ipa, audio, defs, usage', () => {
    const e = parseDictionaryResponse(starResponse, 'star')!;
    expect(e.word).toBe('star');
    expect(e.partOfSpeech).toBe('noun');
    expect(e.pronMw).toBe('ˈstär');
    expect(e.ipa).toBe('ˈstɑr');
    expect(e.audioUrl).toContain('star0001.mp3');
    expect(e.definitions[0]).toContain('heavenly bodies');
    expect(e.usage).toContain('a movie star');
  });

  it('returns null for a miss (suggestion strings)', () => {
    expect(parseDictionaryResponse(['stars', 'stare'], 'staz')).toBeNull();
  });

  it('returns null for empty input', () => {
    expect(parseDictionaryResponse([], 'x')).toBeNull();
  });
});
