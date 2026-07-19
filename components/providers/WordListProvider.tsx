'use client';

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import type { GradeKey, Word, WordList } from '@/lib/data/types';
import { resolveWordList, saveCustomList, resetToDefault } from '@/lib/storage/wordListStorage';
import { shuffle } from '@/lib/gameEngine/helpers';
import { useSettings } from '@/components/providers/SettingsProvider';

interface WordListContextValue {
  grade: GradeKey;
  week: number;
  /** Path segment for hrefs: `week/${week}` normally, or `all` in All-words mode. */
  weekPath: string;
  list: WordList;
  words: Word[];
  isCustomized: boolean;
  hydrated: boolean;
  /** Replace the full word array (forks to a custom local copy). */
  setWords: (words: Word[]) => void;
  /** Patch list-level fields (title, publishAs) without touching the words. */
  updateListMeta: (patch: Partial<Pick<WordList, 'title' | 'publishAs'>>) => void;
  reset: () => void;
}

const WordListContext = createContext<WordListContextValue | null>(null);

export function WordListProvider({
  grade,
  week,
  bundledDefault,
  children,
}: {
  grade: GradeKey;
  week: number;
  bundledDefault: WordList;
  children: ReactNode;
}) {
  const [list, setList] = useState<WordList>(bundledDefault);
  const [isCustomized, setIsCustomized] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const resolved = resolveWordList(grade, week, bundledDefault);
    setList(resolved.list);
    setIsCustomized(resolved.isCustomized);
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grade, week]);

  const setWords = useCallback(
    (words: Word[]) => {
      const next: WordList = { ...list, grade, week, words };
      saveCustomList(grade, week, next);
      setList({ ...next, updatedAt: new Date().toISOString() });
      setIsCustomized(true);
    },
    [list, grade, week],
  );

  const updateListMeta = useCallback(
    (patch: Partial<Pick<WordList, 'title' | 'publishAs'>>) => {
      const next: WordList = { ...list, ...patch, grade, week };
      saveCustomList(grade, week, next);
      setList({ ...next, updatedAt: new Date().toISOString() });
      setIsCustomized(true);
    },
    [list, grade, week],
  );

  const reset = useCallback(() => {
    resetToDefault(grade, week);
    setList(bundledDefault);
    setIsCustomized(false);
  }, [grade, week, bundledDefault]);

  return (
    <WordListContext.Provider
      value={{
        grade,
        week,
        weekPath: `week/${week}`,
        list,
        words: list.words,
        isCustomized,
        hydrated,
        setWords,
        updateListMeta,
        reset,
      }}
    >
      {children}
    </WordListContext.Provider>
  );
}

/**
 * Provider for the "All words" mode: samples `settings.lessonAllCount` random
 * words from every week of the grade, once, and exposes them through the same
 * useWordList() context so the lesson and games work unchanged. Sampling happens
 * client-side (after mount) to avoid a static-export hydration mismatch.
 */
export function AllWordsProvider({
  grade,
  allWords,
  children,
}: {
  grade: GradeKey;
  allWords: Word[];
  children: ReactNode;
}) {
  const { settings } = useSettings();
  const n = Math.max(1, Math.min(settings.lessonAllCount ?? 5, allWords.length || 1));
  const [seed, setSeed] = useState(0);
  const [words, setWords] = useState<Word[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setWords(shuffle(allWords).slice(0, n));
    setHydrated(true);
  }, [allWords, n, seed]);

  const noop = useCallback(() => {}, []);
  const reset = useCallback(() => setSeed((s) => s + 1), []);

  return (
    <WordListContext.Provider
      value={{
        grade,
        week: 0,
        weekPath: 'all',
        list: { grade, week: 0, words },
        words,
        isCustomized: false,
        hydrated,
        setWords: noop,
        updateListMeta: noop,
        reset,
      }}
    >
      {children}
    </WordListContext.Provider>
  );
}

export function useWordList(): WordListContextValue {
  const ctx = useContext(WordListContext);
  if (!ctx) throw new Error('useWordList must be used within WordListProvider');
  return ctx;
}
