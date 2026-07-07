'use client';

import { useCallback } from 'react';
import { useSettings } from '@/components/providers/SettingsProvider';

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
    (text: string) => {
      if (typeof window === 'undefined' || !window.speechSynthesis) return;
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = settings.accent;
      u.rate = 1;
      u.pitch = 1.1;
      const voices = window.speechSynthesis.getVoices();
      const v =
        voices.find((x) => x.lang === settings.accent) || voices.find((x) => x.lang.startsWith('en'));
      if (v) u.voice = v;
      window.speechSynthesis.speak(u);
    },
    [settings.accent],
  );

  const playCorrect = useCallback(() => say(pick(PRAISE)), [say]);
  const playWrong = useCallback(() => say(pick(ENCOURAGE)), [say]);

  return { playCorrect, playWrong };
}
