'use client';

import { useMemo, useState } from 'react';
import type { GameResult, Word } from '@/lib/data/types';
import { useWordList } from '@/components/providers/WordListProvider';
import { buildQuestionSet, pickDistractors, shuffle } from '@/lib/gameEngine/helpers';
import { GameShell } from '../shared/GameShell';
import { ResultsScreen } from '../shared/ResultsScreen';
import { Feedback } from '@/components/common/Feedback';
import { useFeedbackSound } from '@/lib/tts/useFeedbackSound';

export function PictureMatchGame() {
  const { words } = useWordList();
  const [seed, setSeed] = useState(0);
  const questions = useMemo(() => buildQuestionSet(words), [words, seed]);
  const [q, setQ] = useState(0);
  const [score, setScore] = useState(0);
  const [results, setResults] = useState<GameResult[]>([]);
  const [locked, setLocked] = useState(false);
  const [picked, setPicked] = useState<string | null>(null);
  const [fb, setFb] = useState<{ show: boolean; correct: boolean }>({ show: false, correct: false });
  const { playCorrect, playWrong } = useFeedbackSound();

  const correct = questions[q];
  const options = useMemo(() => {
    if (!correct) return [];
    return shuffle([correct, ...pickDistractors(words, correct, 3)]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [correct?.id]);

  if (q >= questions.length) {
    return (
      <ResultsScreen
        score={score}
        total={questions.length}
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

  const choose = (w: Word) => {
    if (locked) return;
    setLocked(true);
    setPicked(w.word);
    const isCorrect = w.id === correct.id;
    if (isCorrect) setScore((s) => s + 1);
    setResults((r) => [...r, { word: correct.word, correct: isCorrect }]);
    setFb({ show: true, correct: isCorrect });
    if (isCorrect) playCorrect();
    else playWrong();
    setTimeout(() => {
      setFb({ show: false, correct: isCorrect });
      setQ((n) => n + 1);
      setLocked(false);
      setPicked(null);
    }, 1400);
  };

  return (
    <GameShell title="Picture Match" icon="🖼️" score={score} progress={q / questions.length}>
      <div className="mc-image">
        {correct.gameImg || correct.img ? (
          <img src={correct.gameImg || correct.img} alt="" />
        ) : (
          <span>{correct.emoji || '📝'}</span>
        )}
      </div>
      <div className="mc-prompt">What word does this picture show?</div>
      <div className="mc-options">
        {options.map((o) => {
          let cls = 'mc-option';
          if (locked && o.id === correct.id) cls += ' correct';
          else if (locked && o.word === picked) cls += ' wrong';
          return (
            <button key={o.id} className={cls} disabled={locked} onClick={() => choose(o)}>
              {o.word}
            </button>
          );
        })}
      </div>
      <Feedback show={fb.show} correct={fb.correct} word={correct.word} />
    </GameShell>
  );
}
