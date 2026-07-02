'use client';

import { useSettings } from '@/components/providers/SettingsProvider';
import type { Accent } from '@/lib/data/types';

const ACCENTS: { code: Accent; label: string }[] = [
  { code: 'en-US', label: '🇺🇸 US' },
  { code: 'en-GB', label: '🇬🇧 UK' },
  { code: 'en-AU', label: '🇦🇺 AU' },
  { code: 'en-IN', label: '🇮🇳 IN' },
];

export function AccentSelector() {
  const { settings, update } = useSettings();
  return (
    <div className="accent-select">
      {ACCENTS.map((a) => (
        <button
          key={a.code}
          className={`accent-chip${settings.accent === a.code ? ' active' : ''}`}
          onClick={() => update({ accent: a.code })}
        >
          {a.label}
        </button>
      ))}
    </div>
  );
}
