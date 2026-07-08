'use client';

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import type { GradeKey, Word, WordList } from '@/lib/data/types';
import { resolveWordList, saveCustomList, resetToDefault } from '@/lib/storage/wordListStorage';

interface WordListContextValue {
  grade: GradeKey;
  week: number;
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

export function useWordList(): WordListContextValue {
  const ctx = useContext(WordListContext);
  if (!ctx) throw new Error('useWordList must be used within WordListProvider');
  return ctx;
}
