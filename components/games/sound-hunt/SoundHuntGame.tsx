'use client';

import { useEffect, useMemo, useState } from 'react';
import type { GameResult, PhonicsChunk } from '@/lib/data/types';
import { useWordList } from '@/components/providers/WordListProvider';
import { phonicsWords, shuffle } from '@/lib/gameEngine/helpers';
import { chunkPhonemes } from '@/lib/phonics/chunkPhonemes';
import { GameShell } from '../shared/GameShell';
import { ResultsScreen } from '../shared/ResultsScreen';
import { Feedback } from '@/components/common/Feedback';
import { usePhonicsAudio } from '@/lib/tts/usePhonicsAudio';

interface Round {
  chunk: PhonicsChunk;
  ipa: string | null;
  options: string[];
}

export function SoundHuntGame() {
  const { words } = useWordList();
  const { playChunkSound } = usePhonicsAudio();
  const [seed, setSeed] = useState(0);

  const rounds = useMemo<Round[]>(() => {
    const pool = phonicsWords(words);
    // Collect (chunk, aligned IPA) pairs plus all distinct chunk spellings.
    const pairs: { chunk: PhonicsChunk; ipa: string | null }[] = [];
    const allTexts = new Set<string>();
    pool.forEach((w) => {
      const ipas = chunkPhonemes(w);
      w.chunks.forEach((c, i) => {
        allTexts.add(c.text);
        pairs.push({ chunk: c, ipa: ipas ? ipas[i] : null });
      });
    });
    const texts = [...allTexts];
    return shuffle(pairs)
      .slice(0, 6)
      .map((p) => {
        const distractors = shuffle(texts.filter((t) => t !== p.chunk.text)).slice(0, 3);
        return { chunk: p.chunk, ipa: p.ipa, options: shuffle([p.chunk.text, ...distractors]) };
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
    if (round) playChunkSound(round.chunk, round.ipa);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, round?.chunk.text]);

  if (rounds.length === 0) {
    return (
      <div className="empty-state">
        <div className="es-icon">👂</div>
        <h3>No sounds to hunt yet</h3>
        <p>Sound Hunt needs at least one phonics (non-tricky) word with sound chunks.</p>
      </div>
    );
  }

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

  const answer = round.chunk.text;

  const choose = (chunk: string) => {
    if (locked) return;
    setLocked(true);
    setPicked(chunk);
    const correct = chunk === answer;
    if (correct) setScore((s) => s + 1);
    setResults((r) => [...r, { word: answer, correct }]);
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
      <p className="mc-prompt">Listen to the sound, then tap the letters that make it</p>
      <button
        className="sound-play-btn"
        onClick={() => playChunkSound(round.chunk, round.ipa)}
        aria-label="Play the sound"
      >
        🔊
      </button>
      <div className="sound-options">
        {round.options.map((opt) => {
          let cls = 'mc-option';
          if (locked && opt === answer) cls += ' correct';
          else if (locked && opt === picked) cls += ' wrong';
          return (
            <button key={opt} className={cls} disabled={locked} onClick={() => choose(opt)}>
              {opt}
            </button>
          );
        })}
      </div>
      <Feedback show={fb.show} correct={fb.correct} word={answer} />
    </GameShell>
  );
}
