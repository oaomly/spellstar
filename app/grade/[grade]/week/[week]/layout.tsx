import { notFound } from 'next/navigation';
import type { GradeKey, WordList } from '@/lib/data/types';
import { getDefaultWordList, allGradeWeekParams } from '@/lib/data/defaultWordLists';
import { WordListProvider } from '@/components/providers/WordListProvider';
import { WeekSubNav } from '@/components/nav/WeekSubNav';
import { LastVisitedTracker } from '@/components/providers/LastVisitedTracker';

export function generateStaticParams() {
  return allGradeWeekParams();
}

export default async function WeekLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ grade: string; week: string }>;
}) {
  const { grade, week } = await params;
  const gradeKey: GradeKey = grade === 'custom' ? 'custom' : Number(grade);
  const weekNum = Number(week);

  const bundled = getDefaultWordList(gradeKey, weekNum);
  if (!bundled) notFound();

  const bundledDefault: WordList = bundled as WordList;

  return (
    <WordListProvider grade={gradeKey} week={weekNum} bundledDefault={bundledDefault}>
      <LastVisitedTracker grade={gradeKey} week={weekNum} />
      <WeekSubNav grade={grade} week={weekNum} />
      {children}
    </WordListProvider>
  );
}
