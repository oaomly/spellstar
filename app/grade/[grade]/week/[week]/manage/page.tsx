import { allGradeWeekParams } from '@/lib/data/defaultWordLists';
import { ManageScreen } from '@/components/word/ManageScreen';

export function generateStaticParams() {
  return allGradeWeekParams();
}

export default function ManagePage() {
  return <ManageScreen />;
}
