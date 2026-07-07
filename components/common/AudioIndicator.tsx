'use client';

import { useEffect, useState } from 'react';
import { AUDIO_EVENT, type AudioSource } from '@/lib/tts/audioSource';
import { installTTSUnlock } from '@/lib/tts/speak';

/**
 * Small transient badge showing whether the sound just played came from the
 * recorded dictionary audio or the browser's text-to-speech voice.
 */
export function AudioIndicator() {
  const [src, setSrc] = useState<AudioSource | null>(null);

  useEffect(() => {
    installTTSUnlock();
    let timer: ReturnType<typeof setTimeout>;
    const onAudio = (e: Event) => {
      const source = (e as CustomEvent<{ source: AudioSource }>).detail?.source;
      if (!source) return;
      setSrc(source);
      clearTimeout(timer);
      timer = setTimeout(() => setSrc(null), 2000);
    };
    window.addEventListener(AUDIO_EVENT, onAudio);
    return () => {
      window.removeEventListener(AUDIO_EVENT, onAudio);
      clearTimeout(timer);
    };
  }, []);

  if (!src) return null;
  const recorded = src === 'recorded';
  return (
    <div className={`audio-indicator ${recorded ? 'ai-recorded' : 'ai-tts'}`} role="status" aria-live="polite">
      {recorded ? '🎙️ Dictionary audio' : '🔊 Computer voice (TTS)'}
    </div>
  );
}
