'use client';

import Link from 'next/link';
import type { GameId } from '@/lib/data/types';
import { getGame } from '@/lib/gameEngine/registry';
import { useWordList } from '@/components/providers/WordListProvider';

import { PictureMatchGame } from './picture-match/PictureMatchGame';
import { UnscrambleGame } from './unscramble/UnscrambleGame';
import { WordMatchGame } from './word-match/WordMatchGame';
import { FillBlankGame } from './fill-blank/FillBlankGame';
import { ListenWriteGame } from './listen-write/ListenWriteGame';
import { HangmanGame } from './hangman/HangmanGame';
import { SpeedSpellGame } from './speed-spell/SpeedSpellGame';
import { MemoryMatchGame } from './memory-match/MemoryMatchGame';
import { FingerMatchGame } from './finger-match/FingerMatchGame';

const MAP: Record<GameId, React.ComponentType> = {
  'picture-match': PictureMatchGame,
  unscramble: UnscrambleGame,
  'word-match': WordMatchGame,
  'fill-blank': FillBlankGame,
  'listen-write': ListenWriteGame,
  hangman: HangmanGame,
  'speed-spell': SpeedSpellGame,
  'memory-match': MemoryMatchGame,
  'finger-match': FingerMatchGame,
};

export function GameRouter({ gameId }: { gameId: string }) {
  const { words, grade, weekPath, hydrated } = useWordList();
  const meta = getGame(gameId);
  if (!meta) return null;
  const Game = MAP[meta.id];
  const isAll = weekPath === 'all';

  if (hydrated && words.length < meta.minWords) {
    return (
      <div className="empty-state">
        <div className="es-icon">🔒</div>
        <h3>Need more words</h3>
        <p>
          This game needs at least {meta.minWords} word{meta.minWords > 1 ? 's' : ''}.{' '}
          {isAll ? 'Raise the “All words” size in Settings.' : 'Add some in the Manage tab.'}
        </p>
        <Link href={isAll ? '/settings' : `/grade/${grade}/${weekPath}/manage`} className="btn btn-primary">
          {isAll ? '⚙️ Settings' : '✏️ Manage Words'}
        </Link>
      </div>
    );
  }

  if (!hydrated) return null;
  return <Game />;
}
