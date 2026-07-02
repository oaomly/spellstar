'use client';

import Link from 'next/link';
import { useSettings } from '@/components/providers/SettingsProvider';
import { getDefaultWordList, getGradeLabel } from '@/lib/data/defaultWordLists';

export function ContinueCard() {
  const { settings, hydrated } = useSettings();
  if (!hydrated) return null;
  const { lastVisitedGrade, lastVisitedWeek } = settings;
  if (lastVisitedGrade === undefined || lastVisitedWeek === undefined) return null;
  if (!getDefaultWordList(lastVisitedGrade, lastVisitedWeek)) return null;

  return (
    <Link
      href={`/grade/${lastVisitedGrade}/week/${lastVisitedWeek}/lesson`}
      className="week-banner"
      style={{ textDecoration: 'none' }}
    >
      <div>
        <h3>Continue where you left off ▶</h3>
        <p>
          {getGradeLabel(lastVisitedGrade)} · Week {lastVisitedWeek}
        </p>
      </div>
      <div style={{ fontSize: 40 }}>📖</div>
    </Link>
  );
}
