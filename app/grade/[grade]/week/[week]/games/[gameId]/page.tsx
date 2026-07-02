import { notFound } from 'next/navigation';
import { allGradeWeekParams } from '@/lib/data/defaultWordLists';
import { GAME_IDS, getGame } from '@/lib/gameEngine/registry';
import { GameRouter } from '@/components/games/GameRouter';

export function generateStaticParams() {
  const base = allGradeWeekParams();
  const params: { grade: string; week: string; gameId: string }[] = [];
  for (const b of base) {
    for (const id of GAME_IDS) {
      params.push({ ...b, gameId: id });
    }
  }
  return params;
}

export default async function GamePage({
  params,
}: {
  params: Promise<{ grade: string; week: string; gameId: string }>;
}) {
  const { gameId } = await params;
  if (!getGame(gameId)) notFound();
  return <GameRouter gameId={gameId} />;
}
