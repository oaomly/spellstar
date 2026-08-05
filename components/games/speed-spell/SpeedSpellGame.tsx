'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { GameResult } from '@/lib/data/types';
import { useWordList } from '@/components/providers/WordListProvider';
import { useSettings } from '@/components/providers/SettingsProvider';
import { buildQuestionSet } from '@/lib/gameEngine/helpers';
import { GameShell } from '../shared/GameShell';
import { ResultsScreen } from '../shared/ResultsScreen';
import { Feedback } from '@/components/common/Feedback';
import { usePhonicsAudio } from '@/lib/tts/usePhonicsAudio';
import { useFeedbackSound } from '@/lib/tts/useFeedbackSound';
import { startRecording, sttSupported, type Recording } from '@/lib/stt/recorder';
import { recognizeSpeech } from '@/lib/stt/recognizeSpeech';
import { parseSpelledLetters } from '@/lib/stt/parseSpelledLetters';

const TIME_PER_WORD = 20;
type SttError = 'mic' | 'stt' | 'unsupported' | null;

export function SpeedSpellGame() {
  const { words, isCustomized } = useWordList();
  const { settings } = useSettings();
  const { playWord } = usePhonicsAudio();
  const { playCorrect, playWrong } = useFeedbackSound();
  const [seed, setSeed] = useState(0);
  const questions = useMemo(() => buildQuestionSet(words), [words, seed]);
  const [q, setQ] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [results, setResults] = useState<GameResult[]>([]);
  const [time, setTime] = useState(TIME_PER_WORD);
  const [fb, setFb] = useState<{ show: boolean; correct: boolean }>({ show: false, correct: false });
  const [resolved, setResolved] = useState(false);

  const [recording, setRecording] = useState(false);
  const [checking, setChecking] = useState(false);
  const [heard, setHeard] = useState<string | null>(null);
  const [sttErr, setSttErr] = useState<SttError>(null);
  const recRef = useRef<Recording | null>(null);

  const current = questions[q];

  useEffect(() => {
    setTime(TIME_PER_WORD);
    setResolved(false);
    setRecording(false);
    setChecking(false);
    setHeard(null);
    setSttErr(null);
    if (current) playWord(current.word, current.audioUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, current?.id]);

  // Countdown — paused while the child is recording or we're checking, so mic
  // and network latency never eat their time.
  useEffect(() => {
    if (resolved || recording || checking || q >= questions.length) return;
    if (time <= 0) {
      resolve(false);
      return;
    }
    const t = setTimeout(() => setTime((s) => s - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [time, resolved, recording, checking, q]);

  // Release the mic if the component unmounts mid-recording.
  useEffect(() => () => recRef.current?.cancel(), []);

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
          setStreak(0);
          setResults([]);
        }}
      />
    );
  }

  function resolve(correct: boolean) {
    if (resolved) return;
    setResolved(true);
    if (correct) {
      setScore((s) => s + 1);
      setStreak((s) => s + 1);
    } else {
      setStreak(0);
    }
    setResults((r) => [...r, { word: current.word, correct }]);
    setFb({ show: true, correct });
    if (correct) playCorrect();
    else playWrong();
    setTimeout(() => {
      setFb({ show: false, correct });
      setQ((n) => n + 1);
    }, 1400);
  }

  const startRec = async () => {
    if (recording || checking || resolved) return;
    setHeard(null);
    setSttErr(null);
    if (!sttSupported()) {
      setSttErr('unsupported');
      return;
    }
    try {
      recRef.current = await startRecording();
      setRecording(true);
    } catch {
      setSttErr('mic');
    }
  };

  const stopAndCheck = async () => {
    if (!recording || !recRef.current) return;
    setRecording(false);
    setChecking(true);
    try {
      const audio = await recRef.current.stop();
      recRef.current = null;
      const { transcript } = await recognizeSpeech(audio, {
        languageCode: settings.accent,
        ownKey: settings.visionApiKey,
        allowProxy: !isCustomized,
      });
      const letters = parseSpelledLetters(transcript);
      setHeard(letters || transcript || '');
      setChecking(false);
      resolve(letters === current.word.toLowerCase());
    } catch {
      recRef.current = null;
      setChecking(false);
      setSttErr('stt');
    }
  };

  return (
    <GameShell title="Speed Spell" icon="⚡" score={score} progress={q / questions.length}>
      <p className="mc-prompt">Listen, then spell it out loud — say each letter (like “c – a – t”)</p>
      <button
        className="btn btn-secondary btn-sm"
        style={{ display: 'block', margin: '0 auto 12px' }}
        onClick={() => playWord(current.word, current.audioUrl)}
      >
        🔊 Hear it again
      </button>
      <div className={`speed-timer${time <= 5 ? ' low' : ''}`}>⏱️ {time}s</div>

      <div style={{ textAlign: 'center', marginTop: 16 }}>
        <button
          className={`btn ${recording ? 'btn-danger' : 'btn-primary'}`}
          onClick={recording ? stopAndCheck : startRec}
          disabled={resolved || checking}
        >
          {checking ? 'Checking…' : recording ? '● Stop & check' : '🎤 Spell it out loud'}
        </button>
      </div>

      {heard !== null && (
        <div className="recognize-result" style={{ marginTop: 12 }}>
          I heard: “{heard || '—'}”
        </div>
      )}

      {sttErr === 'mic' && (
        <p className="phonics-hint">🎤 I couldn’t use the microphone. Allow mic access and try again.</p>
      )}
      {sttErr === 'unsupported' && (
        <p className="phonics-hint">This device can’t record audio in the browser.</p>
      )}
      {sttErr === 'stt' && (
        <p className="phonics-hint">
          Voice spelling needs the Speech key — set <code>GOOGLE_VISION_KEY</code> in Netlify, or paste
          your own key in Settings. Tap the mic to try again.
        </p>
      )}

      {streak >= 2 && <div className="streak-badge">🔥 {streak} in a row!</div>}
      <Feedback show={fb.show} correct={fb.correct} word={current.word} />
    </GameShell>
  );
}
