'use client';

import { useCallback } from 'react';
import { useSettings } from '@/components/providers/SettingsProvider';
import { speakTTS } from './speak';

// Spoken praise/encouragement on a correct/incorrect answer. Uses the browser
// voice (reliable, no assets); phrases like "Well done!" aren't single dictionary
// words so TTS is the right tool here.
const PRAISE = ['Well done!', 'Brilliant!', 'Great job!', 'Awesome!', 'Fantastic!', 'You got it!', 'Super!'];
const ENCOURAGE = ['Good try!', 'Almost! Try again.', 'Keep going!', 'Nice try!', 'You can do it!'];

function pick(list: string[]): string {
  return list[Math.floor(Math.random() * list.length)];
}

export function useFeedbackSound() {
  const { settings } = useSettings();

  const say = useCallback(
    (text: string) => speakTTS(text, { lang: settings.accent, rate: 1, pitch: 1.1 }),
    [settings.accent],
  );

  const playCorrect = useCallback(() => say(pick(PRAISE)), [say]);
  const playWrong = useCallback(() => say(pick(ENCOURAGE)), [say]);

  return { playCorrect, playWrong };
}
