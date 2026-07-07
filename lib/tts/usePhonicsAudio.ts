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
import { phonemeClipUrl, hasClips } from '../phonics/phonemeAudio';
import { speakTTS, cancelTTS } from './speak';
import { announceAudio } from './audioSource';

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
      speakTTS(text, { lang: settings.accent, rate, onEnd });
    },
    [settings.accent],
  );

  const stop = useCallback(() => {
    cancelTTS();
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

  /**
   * Play a sequence of recorded phoneme clips (authentic Wikimedia audio).
   * In multi-phoneme sequences (blends) each clip is capped so the blend stays
   * snappy despite trailing silence; a single clip plays in full.
   */
  const playClipSeq = useCallback(
    (ipaList: string[], onEnd?: () => void) => {
      stop();
      const cap = ipaList.length > 1 ? 640 : 1500;
      let i = 0;
      const next = () => {
        if (i >= ipaList.length) {
          onEnd?.();
          return;
        }
        const url = phonemeClipUrl(ipaList[i]);
        i += 1;
        if (!url) {
          next();
          return;
        }
        const a = new Audio(url);
        audioRef.current = a;
        let advanced = false;
        const go = () => {
          if (advanced) return;
          advanced = true;
          a.pause();
          setTimeout(next, 70);
        };
        a.onended = go;
        a.onerror = go;
        setTimeout(go, cap);
        a.play().catch(go);
      };
      next();
    },
    [stop],
  );

  /**
   * Play the SOUND of a chunk. Prefers authentic recorded phoneme clips (using
   * the chunk's aligned IPA); otherwise TTS approximation. Blends (gl, st)
   * without clips sound out letter-by-letter.
   */
  const playChunkSound = useCallback(
    (chunk: PhonicsChunk, ipa?: string | null, onEnd?: () => void) => {
      const phonemes = ipa ? ipa.split('·').map((s) => s.trim()).filter(Boolean) : [];
      if (hasClips(phonemes)) {
        playClipSeq(phonemes, onEnd);
        return;
      }
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
    [playSound, playClipSeq],
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
      announceAudio('recorded');
      a.play().catch(() => speakWord(word));
    },
    [settings.preferTts, speakWord, stop],
  );

  /** Blend: each chunk's sound in sequence, then the whole word (recorded audio). */
  const blendSounds = useCallback(
    (chunks: PhonicsChunk[], chunkIpa: (string | null)[] | null, word: string, audioUrl?: string, gapMs = 320) => {
      stop();
      let i = 0;
      const next = () => {
        if (i >= chunks.length) {
          setTimeout(() => playWord(word, audioUrl), gapMs + 120);
          return;
        }
        const c = chunks[i];
        const ipa = chunkIpa?.[i] ?? null;
        i += 1;
        playChunkSound(c, ipa, () => setTimeout(next, gapMs));
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
