'use client';

import { useCallback } from 'react';
import { useSettings } from '@/components/providers/SettingsProvider';
import { speakTTS, cancelTTS } from './speak';

/** Accent-aware text-to-speech (Chrome-safe via speakTTS). */
export function useSpeech() {
  const { settings } = useSettings();

  const speak = useCallback(
    (text: string, onEnd?: () => void) => {
      speakTTS(text, { lang: settings.accent, rate: settings.rate, onEnd });
    },
    [settings.accent, settings.rate],
  );

  const stop = useCallback(() => cancelTTS(), []);

  return { speak, stop };
}
