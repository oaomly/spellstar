'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { GradeKey } from '@/lib/data/types';
import { isCustomized } from '@/lib/storage/wordListStorage';

export function WeekTile({
  grade,
  week,
  title,
  count,
}: {
  grade: string;
  week: number;
  title: string;
  count: number;
}) {
  const [customized, setCustomized] = useState(false);
  const gradeKey: GradeKey = grade === 'custom' ? 'custom' : Number(grade);

  useEffect(() => {
    setCustomized(isCustomized(gradeKey, week));
  }, [gradeKey, week]);

  return (
    <Link href={`/grade/${grade}/week/${week}/lesson`} className="week-tile">
      <div className="wt-num">{grade === 'custom' ? '✏️' : `Week ${week}`}</div>
      <div className="wt-count">
        {customized ? (
          <span className="tag tag-custom">Customized</span>
        ) : count > 0 ? (
          <span className="tag tag-default">Default · {count} words</span>
        ) : (
          <span className="tag tag-custom">Empty — add words</span>
        )}
      </div>
    </Link>
  );
}
