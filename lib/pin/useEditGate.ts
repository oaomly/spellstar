'use client';

import { useCallback } from 'react';
import { useSettings } from '@/components/providers/SettingsProvider';

/**
 * Soft, client-side-only edit gate — a deterrent from a curious kid, NOT real
 * security. If a PIN is set, ask for it; if none is set, offer to set one.
 */
export function useEditGate() {
  const { settings, update } = useSettings();

  const requirePin = useCallback(
    (onOk: () => void) => {
      if (typeof window === 'undefined') return;

      if (!settings.editPin) {
        const setNow = window.prompt(
          'Set a parent PIN to protect editing (leave blank to skip):',
          '',
        );
        if (setNow && setNow.trim()) {
          update({ editPin: setNow.trim() });
        }
        onOk();
        return;
      }

      const entered = window.prompt('🔒 Enter parent PIN:');
      if (entered === null) return;
      if (entered === settings.editPin) {
        onOk();
      } else {
        window.alert('❌ Incorrect PIN.');
      }
    },
    [settings.editPin, update],
  );

  return { requirePin };
}
