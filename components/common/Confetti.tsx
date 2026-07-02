'use client';

import { useEffect, useState } from 'react';

const COLORS = ['#6C63FF', '#FF6B6B', '#2DCB70', '#FFD166', '#4ECDC4'];

/** Fires a burst of confetti when `trigger` changes to a new truthy value. */
export function Confetti({ trigger }: { trigger: number }) {
  const [pieces, setPieces] = useState<{ id: number; left: number; color: string; delay: number }[]>([]);

  useEffect(() => {
    if (!trigger) return;
    const burst = Array.from({ length: 40 }, (_, i) => ({
      id: trigger * 1000 + i,
      left: Math.random() * 100,
      color: COLORS[i % COLORS.length],
      delay: Math.random() * 0.3,
    }));
    setPieces(burst);
    const t = setTimeout(() => setPieces([]), 1800);
    return () => clearTimeout(t);
  }, [trigger]);

  return (
    <>
      {pieces.map((p) => (
        <span
          key={p.id}
          className="confetti-piece"
          style={{ left: `${p.left}%`, background: p.color, animationDelay: `${p.delay}s` }}
        />
      ))}
    </>
  );
}
