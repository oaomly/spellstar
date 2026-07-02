'use client';

import { useCallback } from 'react';
import type { PhonicsChunk } from '../data/types';
import { useSettings } from '@/components/providers/SettingsProvider';

/**
 * Accent-aware text-to-speech built on the Web Speech API.
 * Note: TTS cannot truly isolate a phoneme — "speaking a chunk" synthesizes
 * just that substring, an approximation good enough for blending practice.
 */
export function useSpeech() {
  const { settings } = useSettings();

  const pickVoice = useCallback((): SpeechSynthesisVoice | undefined => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return undefined;
    const voices = window.speechSynthesis.getVoices();
    const exact = voices.find((v) => v.lang === settings.accent);
    const prefix = voices.find((v) => v.lang.startsWith(settings.accent.slice(0, 2)));
    const anyEn = voices.find((v) => v.lang.startsWith('en'));
    return exact || prefix || anyEn;
  }, [settings.accent]);

  const speak = useCallback(
    (text: string, onEnd?: () => void) => {
      if (typeof window === 'undefined' || !window.speechSynthesis) {
        onEnd?.();
        return;
      }
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = settings.accent;
      utter.rate = settings.rate;
      const voice = pickVoice();
      if (voice) utter.voice = voice;
      if (onEnd) utter.onend = onEnd;
      window.speechSynthesis.speak(utter);
    },
    [settings.accent, settings.rate, pickVoice],
  );

  /** Speak chunks one at a time, then optionally blend into the whole word. */
  const speakChunks = useCallback(
    (chunks: PhonicsChunk[], opts?: { whole?: string; gapMs?: number }) => {
      if (typeof window === 'undefined' || !window.speechSynthesis) return;
      window.speechSynthesis.cancel();
      const gap = opts?.gapMs ?? 350;
      let i = 0;
      const next = () => {
        if (i >= chunks.length) {
          if (opts?.whole) setTimeout(() => speak(opts.whole!), gap);
          return;
        }
        const c = chunks[i];
        i += 1;
        const utter = new SpeechSynthesisUtterance(c.text);
        utter.lang = settings.accent;
        utter.rate = Math.max(0.5, settings.rate - 0.1);
        const voice = pickVoice();
        if (voice) utter.voice = voice;
        utter.onend = () => setTimeout(next, gap);
        window.speechSynthesis.speak(utter);
      };
      next();
    },
    [settings.accent, settings.rate, pickVoice, speak],
  );

  const stop = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel();
  }, []);

  return { speak, speakChunks, stop };
}
