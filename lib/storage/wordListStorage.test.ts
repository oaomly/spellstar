import { describe, it, expect, beforeEach } from 'vitest';
import { resolveWordList, saveCustomList, resetToDefault, isCustomized } from './wordListStorage';
import type { WordList } from '../data/types';

// Minimal localStorage mock for the node test env.
class MemoryStorage {
  private m = new Map<string, string>();
  getItem(k: string) {
    return this.m.has(k) ? this.m.get(k)! : null;
  }
  setItem(k: string, v: string) {
    this.m.set(k, v);
  }
  removeItem(k: string) {
    this.m.delete(k);
  }
  clear() {
    this.m.clear();
  }
}

beforeEach(() => {
  // @ts-expect-error test shim
  global.window = { localStorage: new MemoryStorage() };
  // @ts-expect-error test shim
  global.localStorage = global.window.localStorage;
});

const bundled: WordList = {
  grade: 1,
  week: 7,
  words: [{ id: 'a', word: 'cat', def: '', sentence: '', tricky: false, chunks: [] }],
};

const custom: WordList = {
  grade: 1,
  week: 7,
  words: [
    { id: 'a', word: 'cat', def: '', sentence: '', tricky: false, chunks: [] },
    { id: 'b', word: 'dog', def: '', sentence: '', tricky: false, chunks: [] },
  ],
};

describe('wordListStorage', () => {
  it('returns the bundled default when nothing is stored', () => {
    const r = resolveWordList(1, 7, bundled);
    expect(r.isCustomized).toBe(false);
    expect(r.list.words).toHaveLength(1);
    expect(isCustomized(1, 7)).toBe(false);
  });

  it('forks to a custom copy after saving, and takes precedence', () => {
    saveCustomList(1, 7, custom);
    const r = resolveWordList(1, 7, bundled);
    expect(r.isCustomized).toBe(true);
    expect(r.list.words).toHaveLength(2);
    expect(r.list.updatedAt).toBeTruthy();
    expect(isCustomized(1, 7)).toBe(true);
  });

  it('reset removes the override and falls back to the default', () => {
    saveCustomList(1, 7, custom);
    resetToDefault(1, 7);
    const r = resolveWordList(1, 7, bundled);
    expect(r.isCustomized).toBe(false);
    expect(r.list.words).toHaveLength(1);
  });

  it('keeps overrides isolated per grade/week', () => {
    saveCustomList(1, 7, custom);
    const other = resolveWordList(1, 8, { ...bundled, week: 8 });
    expect(other.isCustomized).toBe(false);
  });

  it('ignores corrupt stored JSON and uses the default', () => {
    global.localStorage.setItem('spellstar:wordlist:1:7', '{not json');
    const r = resolveWordList(1, 7, bundled);
    expect(r.isCustomized).toBe(false);
    expect(r.list.words).toHaveLength(1);
  });
});
