'use client';

import { useEffect } from 'react';
import type { GradeKey } from '@/lib/data/types';
import { useSettings } from './SettingsProvider';

/** Records the current grade/week so Home can offer "continue where you left off". */
export function LastVisitedTracker({ grade, week }: { grade: GradeKey; week: number }) {
  const { update, hydrated } = useSettings();
  useEffect(() => {
    if (!hydrated) return;
    update({ lastVisitedGrade: grade, lastVisitedWeek: week });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grade, week, hydrated]);
  return null;
}
