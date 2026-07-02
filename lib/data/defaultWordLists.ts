// Bundled default word lists + manifest. These ship in the repo; the site owner
// edits/commits JSON here to publish new weeks. generateStaticParams reads the
// manifest to pre-render every grade/week route.

import type { GradeKey, WordList } from './types';
import manifestJson from '@/data/wordlists/manifest.json';
import g1w7 from '@/data/wordlists/grade1/week7.json';
import g1w8 from '@/data/wordlists/grade1/week8.json';
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
  '1:7': g1w7 as WordList,
  '1:8': g1w8 as WordList,
  'custom:1': customW1 as WordList,
};

export function getDefaultWordList(grade: GradeKey, week: number): WordList | null {
  return REGISTRY[`${grade}:${week}`] ?? null;
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
