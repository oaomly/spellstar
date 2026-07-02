// Per-browser word-list overrides. A bundled default ships in the repo; if a
// visitor customizes a given grade/week, the whole list for that combo is saved
// to their localStorage and takes precedence. Absence = use the bundled default.

import type { GradeKey, WordList } from '../data/types';

function key(grade: GradeKey, week: number): string {
  return `spellstar:wordlist:${grade}:${week}`;
}

export interface ResolvedList {
  list: WordList;
  isCustomized: boolean;
}

export function resolveWordList(
  grade: GradeKey,
  week: number,
  bundledDefault: WordList,
): ResolvedList {
  if (typeof window === 'undefined') return { list: bundledDefault, isCustomized: false };
  try {
    const raw = window.localStorage.getItem(key(grade, week));
    if (!raw) return { list: bundledDefault, isCustomized: false };
    const parsed = JSON.parse(raw) as WordList;
    if (!parsed || !Array.isArray(parsed.words)) {
      return { list: bundledDefault, isCustomized: false };
    }
    return { list: parsed, isCustomized: true };
  } catch {
    return { list: bundledDefault, isCustomized: false };
  }
}

export function saveCustomList(grade: GradeKey, week: number, list: WordList): void {
  if (typeof window === 'undefined') return;
  try {
    const payload: WordList = {
      ...list,
      grade,
      week,
      updatedAt: new Date().toISOString(),
    };
    window.localStorage.setItem(key(grade, week), JSON.stringify(payload));
  } catch {
    /* ignore */
  }
}

export function resetToDefault(grade: GradeKey, week: number): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(key(grade, week));
}

export function isCustomized(grade: GradeKey, week: number): boolean {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(key(grade, week)) !== null;
}
