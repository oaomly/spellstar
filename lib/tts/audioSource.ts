// Broadcasts which audio source is currently playing so a small on-screen
// indicator can tell the user whether they're hearing recorded dictionary audio
// or the browser's text-to-speech voice.

export type AudioSource = 'recorded' | 'tts';

export const AUDIO_EVENT = 'spellstar:audio';

export function announceAudio(source: AudioSource): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(AUDIO_EVENT, { detail: { source } }));
}
