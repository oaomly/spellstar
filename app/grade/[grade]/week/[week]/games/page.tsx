import { allGradeWeekParams } from '@/lib/data/defaultWordLists';
import { GameMenu } from '@/components/games/menu/GameMenu';

export function generateStaticParams() {
  return allGradeWeekParams();
}

export default function GamesPage() {
  return <GameMenu />;
}
