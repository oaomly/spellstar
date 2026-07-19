// Microphone capture for the voice-spelling game. Produces base64 LINEAR16 PCM
// at 16 kHz — the format Google Speech-to-Text decodes reliably on every browser.
//
// We deliberately do NOT use MediaRecorder: on iPad/iOS Safari it emits AAC in an
// MP4 container, which Google STT cannot decode. Capturing raw samples through an
// AudioContext + ScriptProcessorNode works the same everywhere (incl. iOS), and we
// downsample to 16 kHz mono ourselves.

'use client';

const TARGET_RATE = 16000;

export interface Recording {
  /** Stop capture and return base64-encoded 16 kHz mono LINEAR16 PCM. */
  stop: () => Promise<string>;
  /** Abort without producing audio (releases the mic). */
  cancel: () => void;
}

type AudioCtor = typeof AudioContext;

function getAudioContextCtor(): AudioCtor | null {
  if (typeof window === 'undefined') return null;
  return window.AudioContext || (window as unknown as { webkitAudioContext?: AudioCtor }).webkitAudioContext || null;
}

export function sttSupported(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    !!navigator.mediaDevices?.getUserMedia &&
    !!getAudioContextCtor()
  );
}

function mergeChunks(chunks: Float32Array[]): Float32Array {
  let len = 0;
  for (const c of chunks) len += c.length;
  const out = new Float32Array(len);
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.length;
  }
  return out;
}

/** Linear-interpolation downsample from `inRate` to 16 kHz. */
function downsample(input: Float32Array, inRate: number): Float32Array {
  if (inRate === TARGET_RATE) return input;
  const ratio = inRate / TARGET_RATE;
  const outLen = Math.round(input.length / ratio);
  const out = new Float32Array(outLen);
  for (let i = 0; i < outLen; i++) {
    const pos = i * ratio;
    const i0 = Math.floor(pos);
    const i1 = Math.min(i0 + 1, input.length - 1);
    const frac = pos - i0;
    out[i] = input[i0] * (1 - frac) + input[i1] * frac;
  }
  return out;
}

/** Float32 [-1,1] -> 16-bit little-endian PCM. */
function floatToPcm16(input: Float32Array): ArrayBuffer {
  const buf = new ArrayBuffer(input.length * 2);
  const view = new DataView(buf);
  for (let i = 0; i < input.length; i++) {
    const s = Math.max(-1, Math.min(1, input[i]));
    view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return buf;
}

function base64FromBuffer(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = '';
  const CHUNK = 0x8000; // avoid arg-count limits in String.fromCharCode
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + CHUNK)));
  }
  return btoa(binary);
}

export async function startRecording(): Promise<Recording> {
  const Ctor = getAudioContextCtor();
  if (!Ctor) throw new Error('no-audio-context');

  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const ctx = new Ctor();
  // iOS requires an explicit resume within the user gesture that started this.
  if (ctx.state === 'suspended') await ctx.resume();

  const source = ctx.createMediaStreamSource(stream);
  const processor = ctx.createScriptProcessor(4096, 1, 1);
  // Route through a muted gain node so onaudioprocess keeps firing without
  // echoing the mic back through the speakers.
  const mute = ctx.createGain();
  mute.gain.value = 0;

  const chunks: Float32Array[] = [];
  processor.onaudioprocess = (e) => {
    chunks.push(new Float32Array(e.inputBuffer.getChannelData(0)));
  };

  source.connect(processor);
  processor.connect(mute);
  mute.connect(ctx.destination);

  const teardown = () => {
    processor.onaudioprocess = null;
    try { processor.disconnect(); } catch { /* noop */ }
    try { source.disconnect(); } catch { /* noop */ }
    try { mute.disconnect(); } catch { /* noop */ }
    stream.getTracks().forEach((t) => t.stop());
    void ctx.close();
  };

  return {
    cancel: teardown,
    stop: async () => {
      const inRate = ctx.sampleRate;
      const merged = mergeChunks(chunks);
      teardown();
      const pcm = floatToPcm16(downsample(merged, inRate));
      return base64FromBuffer(pcm);
    },
  };
}
