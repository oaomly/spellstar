import { redirect } from 'next/navigation';
import { allGradeWeekParams } from '@/lib/data/defaultWordLists';

export function generateStaticParams() {
  return allGradeWeekParams();
}

export default async function WeekIndex({
  params,
}: {
  params: Promise<{ grade: string; week: string }>;
}) {
  const { grade, week } = await params;
  redirect(`/grade/${grade}/week/${week}/lesson`);
}
