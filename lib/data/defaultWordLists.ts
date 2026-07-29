// Bundled default word lists + manifest. These ship in the repo; the site owner
// edits/commits JSON here to publish new weeks. generateStaticParams reads the
// manifest to pre-render every grade/week route.

import type { GradeKey, Word, WordList } from './types';
import manifestJson from '@/data/wordlists/manifest.json';
import g1w1 from '@/data/wordlists/grade1/week1.json';
import g1w2 from '@/data/wordlists/grade1/week2.json';
import g1w3 from '@/data/wordlists/grade1/week3.json';
import g1w4 from '@/data/wordlists/grade1/week4.json';
import g1w5 from '@/data/wordlists/grade1/week5.json';
import g1w6 from '@/data/wordlists/grade1/week6.json';
import g1w7 from '@/data/wordlists/grade1/week7.json';
import g1w8 from '@/data/wordlists/grade1/week8.json';
import g1w9 from '@/data/wordlists/grade1/week9.json';
import g1w10 from '@/data/wordlists/grade1/week10.json';
import g1w11 from '@/data/wordlists/grade1/week11.json';
import customW1 from '@/data/wordlists/custom/week1.json';

export interface ManifestWeek {
  week: number;
  title: string;
  count: number;
}
export interface ManifestGrade {
  grade: GradeKey;
  label: string;
  weeks: ManifestWeek[];
}
export interface Manifest {
  grades: ManifestGrade[];
}

export const manifest = manifestJson as Manifest;

/** Registry keyed by `${grade}:${week}`. */
const REGISTRY: Record<string, WordList> = {
  '1:1': g1w1 as WordList,
  '1:2': g1w2 as WordList,
  '1:3': g1w3 as WordList,
  '1:4': g1w4 as WordList,
  '1:5': g1w5 as WordList,
  '1:6': g1w6 as WordList,
  '1:7': g1w7 as WordList,
  '1:8': g1w8 as WordList,
  '1:9': g1w9 as WordList,
  '1:10': g1w10 as WordList,
  '1:11': g1w11 as WordList,
  'custom:1': customW1 as WordList,
};

export function getDefaultWordList(grade: GradeKey, week: number): WordList | null {
  return REGISTRY[`${grade}:${week}`] ?? null;
}

/** Every bundled word across all weeks of a grade (for the "All words" lesson). */
export function getAllWordsForGrade(grade: GradeKey): Word[] {
  const weeks = manifest.grades.find((g) => String(g.grade) === String(grade))?.weeks ?? [];
  const out: Word[] = [];
  for (const w of weeks) {
    const list = REGISTRY[`${grade}:${w.week}`];
    if (list) out.push(...list.words);
  }
  return out;
}

export function getGradeLabel(grade: GradeKey): string {
  return manifest.grades.find((g) => String(g.grade) === String(grade))?.label ?? `Grade ${grade}`;
}

/** All grade/week combos for generateStaticParams. */
export function allGradeWeekParams(): { grade: string; week: string }[] {
  const params: { grade: string; week: string }[] = [];
  for (const g of manifest.grades) {
    for (const w of g.weeks) {
      params.push({ grade: String(g.grade), week: String(w.week) });
    }
  }
  return params;
}
