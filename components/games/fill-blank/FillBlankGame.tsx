'use client';

import { useEffect, useMemo, useState } from 'react';
import type { GameResult, Word } from '@/lib/data/types';
import { useWordList } from '@/components/providers/WordListProvider';
import { buildQuestionSet, pickDistractors, shuffle } from '@/lib/gameEngine/helpers';
import { GameShell } from '../shared/GameShell';
import { ResultsScreen } from '../shared/ResultsScreen';
import { Feedback } from '@/components/common/Feedback';
import { useSpeech } from '@/lib/tts/useSpeech';
import { useFeedbackSound } from '@/lib/tts/useFeedbackSound';

function blankSentence(w: Word): [string, string] {
  const s = w.sentence || `The word is ____.`;
  const re = new RegExp(`\\b${w.word}\\b`, 'i');
  if (re.test(s)) {
    const [before, after] = s.split(re);
    return [before, after];
  }
  return [`${s}  (Which word fits?) `, ''];
}

export function FillBlankGame() {
  const { words } = useWordList();
  const [seed, setSeed] = useState(0);
  const pool = useMemo(() => {
    const withSentence = words.filter((w) => w.sentence);
    return withSentence.length >= 2 ? withSentence : words;
  }, [words]);
  const questions = useMemo(() => buildQuestionSet(pool, 6), [pool, seed]);
  const [q, setQ] = useState(0);
  const [score, setScore] = useState(0);
  const [results, setResults] = useState<GameResult[]>([]);
  const [locked, setLocked] = useState(false);
  const [picked, setPicked] = useState<string | null>(null);
  const [fb, setFb] = useState<{ show: boolean; correct: boolean }>({ show: false, correct: false });
  const { speak } = useSpeech();
  const { playCorrect, playWrong } = useFeedbackSound();

  const current = questions[q];
  const options = useMemo(() => {
    if (!current) return [];
    return shuffle([current, ...pickDistractors(words, current, 3)]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id]);

  // Read the question aloud (with "blank" for the missing word) on each question.
  const readQuestion = (word?: Word) => {
    const w = word ?? current;
    if (!w) return;
    const [b, a] = blankSentence(w);
    speak(`${b} blank ${a}`);
  };

  useEffect(() => {
    if (current) readQuestion(current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, current?.id]);

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

  const [before, after] = blankSentence(current);

  const choose = (w: Word) => {
    if (locked) return;
    setLocked(true);
    setPicked(w.word);
    const isCorrect = w.id === current.id;
    if (isCorrect) setScore((s) => s + 1);
    setResults((r) => [...r, { word: current.word, correct: isCorrect }]);
    setFb({ show: true, correct: isCorrect });
    if (isCorrect) playCorrect();
    else playWrong();
    setTimeout(() => {
      setFb({ show: false, correct: isCorrect });
      setQ((n) => n + 1);
      setLocked(false);
      setPicked(null);
    }, 1600);
  };

  return (
    <GameShell title="Fill the Blank" icon="✏️" score={score} progress={q / questions.length}>
      <button
        className="btn btn-secondary btn-sm"
        style={{ display: 'block', margin: '0 auto 8px' }}
        onClick={() => readQuestion()}
      >
        🔊 Hear the sentence
      </button>
      <div className="fib-sentence">
        {before}
        <span className="fib-blank">{locked ? current.word : '____'}</span>
        {after}
      </div>
      <div className="fib-options">
        {options.map((o) => {
          let cls = 'fib-chip';
          if (locked && o.id === current.id) cls += ' used';
          else if (locked && o.word === picked) cls += ' used';
          return (
            <button key={o.id} className={cls} disabled={locked} onClick={() => choose(o)}>
              {o.word}
            </button>
          );
        })}
      </div>
      <Feedback show={fb.show} correct={fb.correct} word={current.word} />
    </GameShell>
  );
}
