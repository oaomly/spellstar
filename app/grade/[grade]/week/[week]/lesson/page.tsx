import { allGradeWeekParams } from '@/lib/data/defaultWordLists';
import { LessonScreen } from '@/components/lesson/LessonScreen';

export function generateStaticParams() {
  return allGradeWeekParams();
}

export default function LessonPage() {
  return <LessonScreen />;
}
