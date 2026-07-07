'use client';

// Robust text-to-speech that works in Chrome, not just Safari. Chrome quirks
// handled here:
//  - getVoices() is async and returns [] until 'voiceschanged' fires
//  - utterances get garbage-collected mid-speech unless a reference is held
//  - speech is blocked until the first user gesture (autoplay policy)
//  - synthesis can get stuck "paused" — nudge it with resume()

import { announceAudio } from './audioSource';

const active = new Set<SpeechSynthesisUtterance>();
let unlockInstalled = false;

function synth(): SpeechSynthesis | null {
  return typeof window !== 'undefined' && window.speechSynthesis ? window.speechSynthesis : null;
}

function withVoices(fn: (voices: SpeechSynthesisVoice[]) => void): void {
  const s = synth();
  if (!s) return;
  const now = s.getVoices();
  if (now.length) {
    fn(now);
    return;
  }
  let done = false;
  const run = () => {
    if (done) return;
    done = true;
    s.removeEventListener('voiceschanged', run);
    fn(s.getVoices());
  };
  s.addEventListener('voiceschanged', run);
  setTimeout(run, 300);
}

export interface SpeakOpts {
  lang?: string;
  rate?: number;
  pitch?: number;
  onEnd?: () => void;
}

export function speakTTS(text: string, opts: SpeakOpts = {}): void {
  const s = synth();
  if (!s || !text.trim()) {
    opts.onEnd?.();
    return;
  }
  s.cancel();
  withVoices((voices) => {
    const lang = opts.lang ?? 'en-US';
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang;
    u.rate = opts.rate ?? 0.9;
    u.pitch = opts.pitch ?? 1;
    const base = lang.slice(0, 2);
    const voice =
      voices.find((v) => v.lang === lang) ||
      voices.find((v) => v.lang.startsWith(base)) ||
      voices.find((v) => v.lang.startsWith('en'));
    if (voice) u.voice = voice;
    const done = () => {
      active.delete(u);
      opts.onEnd?.();
    };
    u.onend = done;
    u.onerror = done;
    active.add(u); // hold a reference so Chrome doesn't GC it mid-speech
    announceAudio('tts');
    s.speak(u);
    if (s.paused) s.resume();
  });
}

export function cancelTTS(): void {
  synth()?.cancel();
}

/** Warm up TTS on the first user gesture so Chrome will speak afterwards. */
export function installTTSUnlock(): void {
  if (typeof window === 'undefined' || unlockInstalled) return;
  unlockInstalled = true;
  const unlock = () => {
    window.removeEventListener('pointerdown', unlock);
    window.removeEventListener('keydown', unlock);
    const s = synth();
    if (!s) return;
    s.getVoices();
    const warm = new SpeechSynthesisUtterance(' ');
    warm.volume = 0;
    s.speak(warm);
  };
  window.addEventListener('pointerdown', unlock);
  window.addEventListener('keydown', unlock);
}
