import { notFound } from 'next/navigation';
import { GAME_IDS, getGame } from '@/lib/gameEngine/registry';
import { GameRouter } from '@/components/games/GameRouter';

// grade comes from the /all layout; gameId is enumerated here.
export function generateStaticParams() {
  return GAME_IDS.map((gameId) => ({ gameId }));
}

export default async function AllGamePage({ params }: { params: Promise<{ gameId: string }> }) {
  const { gameId } = await params;
  if (!getGame(gameId)) notFound();
  return <GameRouter gameId={gameId} />;
}
