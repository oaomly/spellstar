'use client';

import { useCallback, useRef } from 'react';
import type { PhonicsChunk } from '../data/types';
import { useSettings } from '@/components/providers/SettingsProvider';
import {
  GRAPHEME_SOUND,
  PHONEME_AUDIO,
  PHONEME_AUDIO_BASE,
  letterName,
} from '../phonics/graphemeSound';

// Voices load async in Chrome; pick the best match for the chosen accent.
function pickVoice(accent: string): SpeechSynthesisVoice | undefined {
  if (typeof window === 'undefined' || !window.speechSynthesis) return undefined;
  const voices = window.speechSynthesis.getVoices();
  return (
    voices.find((v) => v.lang === accent) ||
    voices.find((v) => v.lang.startsWith(accent.slice(0, 2))) ||
    voices.find((v) => v.lang.startsWith('en'))
  );
}

/**
 * Audio for the phonics lesson. Handles both voicing modes:
 *  - playSound(): the phoneme (recorded clip if bundled, else TTS approximation)
 *  - sayLetterName(): the letter's name (spell-out)
 * plus sequenced "blend the sounds" and "spell it out" playback.
 */
export function usePhonicsAudio() {
  const { settings } = useSettings();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const tts = useCallback(
    (text: string, rate: number, onEnd?: () => void) => {
      if (typeof window === 'undefined' || !window.speechSynthesis) {
        onEnd?.();
        return;
      }
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = settings.accent;
      u.rate = rate;
      const v = pickVoice(settings.accent);
      if (v) u.voice = v;
      if (onEnd) u.onend = onEnd;
      window.speechSynthesis.speak(u);
    },
    [settings.accent],
  );

  const stop = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
  }, []);

  /** Play the phoneme SOUND of one grapheme. Recorded clip if available, else TTS. */
  const playSound = useCallback(
    (grapheme: string, onEnd?: () => void) => {
      const key = grapheme.toLowerCase();
      const hint = GRAPHEME_SOUND[key];
      const fallback = () => tts(hint ? hint.say : grapheme, hint?.rate ?? 0.6, onEnd);

      if (PHONEME_AUDIO.has(key)) {
        stop();
        const a = new Audio(`${PHONEME_AUDIO_BASE}/${key}.mp3`);
        audioRef.current = a;
        let handled = false;
        const done = () => {
          if (handled) return;
          handled = true;
          onEnd?.();
        };
        a.onended = done;
        a.onerror = () => {
          if (handled) return;
          handled = true;
          fallback();
        };
        a.play().catch(() => {
          if (handled) return;
          handled = true;
          fallback();
        });
        return;
      }
      fallback();
    },
    [tts, stop],
  );

  /** Play the SOUND of a whole chunk. Blends (gl, st) sound out letter-by-letter. */
  const playChunkSound = useCallback(
    (chunk: PhonicsChunk, onEnd?: () => void) => {
      const key = chunk.text.toLowerCase();
      if (GRAPHEME_SOUND[key] || PHONEME_AUDIO.has(key)) {
        playSound(key, onEnd);
        return;
      }
      if (chunk.type === 'blend' && chunk.text.length > 1) {
        const letters = chunk.text.split('');
        let i = 0;
        const next = () => {
          if (i >= letters.length) {
            onEnd?.();
            return;
          }
          const l = letters[i];
          i += 1;
          playSound(l, () => setTimeout(next, 120));
        };
        next();
        return;
      }
      playSound(key, onEnd);
    },
    [playSound],
  );

  const sayLetterName = useCallback(
    (ch: string, onEnd?: () => void) => tts(letterName(ch), 0.8, onEnd),
    [tts],
  );

  const speakWord = useCallback((word: string) => tts(word, settings.rate), [tts, settings.rate]);

  /**
   * Play a whole word. Prefers the recorded dictionary audio (audioUrl) when
   * present and the user hasn't opted into TTS; falls back to TTS otherwise or
   * if the clip fails to load. This is the DEFAULT word pronunciation.
   */
  const playWord = useCallback(
    (word: string, audioUrl?: string) => {
      if (settings.preferTts || !audioUrl) {
        speakWord(word);
        return;
      }
      stop();
      const a = new Audio(audioUrl);
      audioRef.current = a;
      a.onerror = () => speakWord(word);
      a.play().catch(() => speakWord(word));
    },
    [settings.preferTts, speakWord, stop],
  );

  /** Blend: each chunk's sound in sequence, then the whole word (recorded audio). */
  const blendSounds = useCallback(
    (chunks: PhonicsChunk[], word: string, audioUrl?: string, gapMs = 320) => {
      stop();
      let i = 0;
      const next = () => {
        if (i >= chunks.length) {
          setTimeout(() => playWord(word, audioUrl), gapMs + 120);
          return;
        }
        const c = chunks[i];
        i += 1;
        playChunkSound(c, () => setTimeout(next, gapMs));
      };
      next();
    },
    [playChunkSound, playWord, stop],
  );

  /** Spell out: each letter's name in sequence, then the whole word. */
  const spellLetters = useCallback(
    (word: string, audioUrl?: string, gapMs = 300) => {
      stop();
      const letters = word.split('');
      let i = 0;
      const next = () => {
        if (i >= letters.length) {
          setTimeout(() => playWord(word, audioUrl), gapMs + 120);
          return;
        }
        const l = letters[i];
        i += 1;
        sayLetterName(l, () => setTimeout(next, gapMs));
      };
      next();
    },
    [sayLetterName, playWord, stop],
  );

  return { playSound, playChunkSound, sayLetterName, speakWord, playWord, blendSounds, spellLetters, stop };
}
