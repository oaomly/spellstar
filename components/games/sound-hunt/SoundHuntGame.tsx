'use client';

import { useEffect, useMemo, useState } from 'react';
import type { GameResult } from '@/lib/data/types';
import { useWordList } from '@/components/providers/WordListProvider';
import { phonicsWords, allChunkTexts, shuffle } from '@/lib/gameEngine/helpers';
import { GameShell } from '../shared/GameShell';
import { ResultsScreen } from '../shared/ResultsScreen';
import { Feedback } from '@/components/common/Feedback';
import { useSpeech } from '@/lib/tts/useSpeech';

interface Round {
  answer: string;
  options: string[];
}

export function SoundHuntGame() {
  const { words } = useWordList();
  const { speak } = useSpeech();
  const [seed, setSeed] = useState(0);

  const rounds = useMemo<Round[]>(() => {
    const pool = phonicsWords(words);
    const allChunks = allChunkTexts(words);
    const picks = shuffle(pool).slice(0, 6);
    return picks.map((w) => {
      const answer = shuffle(w.chunks)[0].text;
      const distractors = shuffle(allChunks.filter((c) => c !== answer)).slice(0, 3);
      return { answer, options: shuffle([answer, ...distractors]) };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [words, seed]);

  const [q, setQ] = useState(0);
  const [score, setScore] = useState(0);
  const [results, setResults] = useState<GameResult[]>([]);
  const [locked, setLocked] = useState(false);
  const [picked, setPicked] = useState<string | null>(null);
  const [fb, setFb] = useState<{ show: boolean; correct: boolean }>({ show: false, correct: false });

  const round = rounds[q];

  useEffect(() => {
    if (round) speak(round.answer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, round?.answer]);

  if (!round || q >= rounds.length) {
    return (
      <ResultsScreen
        score={score}
        total={rounds.length}
        results={results}
        onPlayAgain={() => {
          setSeed((s) => s + 1);
          setQ(0);
          setScore(0);
          setResults([]);
          setLocked(false);
          setPicked(null);
        }}
      />
    );
  }

  const choose = (chunk: string) => {
    if (locked) return;
    setLocked(true);
    setPicked(chunk);
    const correct = chunk === round.answer;
    if (correct) setScore((s) => s + 1);
    setResults((r) => [...r, { word: round.answer, correct }]);
    setFb({ show: true, correct });
    setTimeout(() => {
      setFb({ show: false, correct });
      setQ((n) => n + 1);
      setLocked(false);
      setPicked(null);
    }, 1300);
  };

  return (
    <GameShell title="Sound Hunt" icon="👂" score={score} progress={q / rounds.length}>
      <p className="mc-prompt">Listen to the sound, then tap the matching chunk</p>
      <button className="sound-play-btn" onClick={() => speak(round.answer)} aria-label="Play the sound">
        🔊
      </button>
      <div className="sound-options">
        {round.options.map((opt) => {
          let cls = 'mc-option';
          if (locked && opt === round.answer) cls += ' correct';
          else if (locked && opt === picked) cls += ' wrong';
          return (
            <button key={opt} className={cls} disabled={locked} onClick={() => choose(opt)}>
              {opt}
            </button>
          );
        })}
      </div>
      <Feedback show={fb.show} correct={fb.correct} word={round.answer} />
    </GameShell>
  );
}
