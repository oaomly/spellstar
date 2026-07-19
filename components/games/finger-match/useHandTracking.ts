'use client';

// Index-fingertip tracking for Finger Match. Loads MediaPipe HandLandmarker
// (self-hosted WASM + model under /public/mediapipe), reads the webcam, and on
// every animation frame reports the fingertip position in viewport pixels via
// an `onFrame` callback — deliberately NOT React state, to avoid re-rendering
// the whole board 60×/second. Everything runs in the browser; frames never
// leave the device.

import { useEffect, useRef, useState } from 'react';
import type { HandLandmarker as HL } from '@mediapipe/tasks-vision';

export type TrackStatus = 'idle' | 'loading' | 'ready' | 'denied' | 'error';

export interface Tip {
  x: number;
  y: number;
}

const WASM_PATH = '/mediapipe/wasm';
const MODEL_PATH = '/mediapipe/hand_landmarker.task';
const PINCH_DIST = 0.06; // normalized index↔middle fingertip distance = "scissor close"

export function useHandTracking(opts: {
  enabled: boolean;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  /** Called each frame with the fingertip (viewport px, null when no hand) and
   *  whether index + middle fingertips are pinched together (scissor-close). */
  onFrame: (tip: Tip | null, close: boolean) => void;
}) {
  const { enabled, videoRef, onFrame } = opts;
  const [status, setStatus] = useState<TrackStatus>('idle');
  const onFrameRef = useRef(onFrame);
  onFrameRef.current = onFrame;

  useEffect(() => {
    if (!enabled) return;
    let landmarker: HL | null = null;
    let stream: MediaStream | null = null;
    let raf = 0;
    let cancelled = false;
    let lastTs = -1;

    async function start() {
      setStatus('loading');
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false,
        });
      } catch {
        if (!cancelled) setStatus('denied');
        return;
      }
      const video = videoRef.current;
      if (!video || cancelled) return;
      video.srcObject = stream;
      try {
        await video.play();
      } catch {
        /* autoplay may need the muted attr; video is muted in JSX */
      }

      try {
        const vision = await import('@mediapipe/tasks-vision');
        const fileset = await vision.FilesetResolver.forVisionTasks(WASM_PATH);
        landmarker = await vision.HandLandmarker.createFromOptions(fileset, {
          baseOptions: { modelAssetPath: MODEL_PATH, delegate: 'GPU' },
          runningMode: 'VIDEO',
          numHands: 1,
        });
      } catch {
        if (!cancelled) setStatus('error');
        return;
      }
      if (cancelled) return;
      setStatus('ready');

      const loop = () => {
        if (cancelled) return;
        raf = requestAnimationFrame(loop); // always reschedule (survives Play Again)
        const v = videoRef.current;
        if (!landmarker || !v) {
          onFrameRef.current(null, false);
          return;
        }
        // A fresh <video> (e.g. after "Play again" remounts it) has no stream yet —
        // reattach the existing stream instead of restarting the whole camera.
        if (stream && v.srcObject !== stream) {
          v.srcObject = stream;
          v.play().catch(() => {});
        }
        if (v.readyState < 2 || v.videoWidth === 0) return;
        const ts = performance.now();
        if (ts === lastTs) return;
        lastTs = ts;

        let tip: Tip | null = null;
        let close = false;
        try {
          const res = landmarker.detectForVideo(v, ts);
          const hand = res.landmarks?.[0];
          const lm8 = hand?.[8]; // index fingertip
          const lm12 = hand?.[12]; // middle fingertip
          if (lm8) {
            const rect = v.getBoundingClientRect();
            // Video is mirrored (CSS scaleX(-1)) for a selfie feel, so mirror x.
            tip = { x: rect.left + (1 - lm8.x) * rect.width, y: rect.top + lm8.y * rect.height };
            if (lm12) close = Math.hypot(lm8.x - lm12.x, lm8.y - lm12.y) < PINCH_DIST;
          }
        } catch {
          /* transient decode error — skip this frame */
        }
        onFrameRef.current(tip, close);
      };
      raf = requestAnimationFrame(loop);
    }

    start();

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      try {
        landmarker?.close();
      } catch {
        /* noop */
      }
      stream?.getTracks().forEach((t) => t.stop());
      const v = videoRef.current;
      if (v) v.srcObject = null;
      onFrameRef.current(null, false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  return { status };
}
