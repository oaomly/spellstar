'use client';

import { useState } from 'react';
import { useSettings } from '@/components/providers/SettingsProvider';
import { AccentSelector } from '@/components/common/AccentSelector';
import { useSpeech } from '@/lib/tts/useSpeech';

export function SettingsScreen() {
  const { settings, update, hydrated } = useSettings();
  const { speak } = useSpeech();
  const [keyValue, setKeyValue] = useState('');
  const [dictKey, setDictKey] = useState('');

  if (!hydrated) return null;

  const clearAll = () => {
    if (window.confirm('Clear ALL your data (custom word lists, settings, PIN)? This cannot be undone.')) {
      Object.keys(window.localStorage)
        .filter((k) => k.startsWith('spellstar:'))
        .forEach((k) => window.localStorage.removeItem(k));
      window.location.href = '/';
    }
  };

  return (
    <div>
      <div className="section-header">
        <h2>⚙️ Settings</h2>
      </div>

      <div className="settings-section">
        <h3>Voice &amp; Accent</h3>
        <AccentSelector />
        <div className="setting-row">
          <div>
            <div className="setting-label">Speaking speed</div>
            <div className="setting-sub">{settings.rate.toFixed(2)}× — slower is easier for young learners</div>
          </div>
          <input
            type="range"
            min={0.5}
            max={1.2}
            step={0.05}
            value={settings.rate}
            onChange={(e) => update({ rate: Number(e.target.value) })}
          />
        </div>
        <div className="setting-row">
          <div className="setting-label">Test voice</div>
          <button className="btn btn-secondary btn-sm" onClick={() => speak('Hello, let us practise spelling!')}>
            🔊 Play
          </button>
        </div>
      </div>

      <div className="settings-section">
        <h3>Learning</h3>
        <div className="setting-row">
          <div>
            <div className="setting-label">Auto-speak words</div>
            <div className="setting-sub">Say each word automatically in the lesson</div>
          </div>
          <label className="toggle">
            <input type="checkbox" checked={settings.autospeak} onChange={(e) => update({ autospeak: e.target.checked })} />
            <span className="toggle-slider" />
          </label>
        </div>
        <div className="setting-row">
          <div>
            <div className="setting-label">Celebration confetti</div>
            <div className="setting-sub">Show confetti on good scores</div>
          </div>
          <label className="toggle">
            <input type="checkbox" checked={settings.confetti} onChange={(e) => update({ confetti: e.target.checked })} />
            <span className="toggle-slider" />
          </label>
        </div>
        <div className="setting-row">
          <div>
            <div className="setting-label">Use computer voice</div>
            <div className="setting-sub">Off = play the recorded dictionary audio when available (recommended)</div>
          </div>
          <label className="toggle">
            <input type="checkbox" checked={settings.preferTts} onChange={(e) => update({ preferTts: e.target.checked })} />
            <span className="toggle-slider" />
          </label>
        </div>
      </div>

      <div className="settings-section">
        <h3>Parent Controls</h3>
        <div className="setting-row">
          <div>
            <div className="setting-label">Edit PIN</div>
            <div className="setting-sub">{settings.editPin ? 'A PIN is set — needed to edit words.' : 'No PIN set.'}</div>
          </div>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => {
              const pin = window.prompt('Set a new edit PIN (leave blank to remove):', settings.editPin ?? '');
              if (pin === null) return;
              update({ editPin: pin.trim() ? pin.trim() : null });
            }}
          >
            {settings.editPin ? 'Change' : 'Set PIN'}
          </button>
        </div>
      </div>

      <div className="settings-section">
        <h3>Handwriting Recognition (optional)</h3>
        <p className="setting-sub" style={{ marginBottom: 12 }}>
          Listen &amp; Write can auto-check handwriting with your own Google Vision API key. This is stored only in
          this browser and never uploaded anywhere except directly to Google. Leave blank to use the &quot;show word
          &amp; self-check&quot; mode.
        </p>
        <div className="form-group" style={{ marginBottom: 8 }}>
          <input
            type="password"
            value={keyValue || settings.visionApiKey || ''}
            onChange={(e) => setKeyValue(e.target.value)}
            placeholder="Paste your Google Vision API key"
          />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-primary btn-sm" onClick={() => update({ visionApiKey: keyValue.trim() || undefined })}>
            Save key
          </button>
          {settings.visionApiKey && (
            <button
              className="btn btn-danger btn-sm"
              onClick={() => {
                setKeyValue('');
                update({ visionApiKey: undefined });
              }}
            >
              Remove key
            </button>
          )}
        </div>
      </div>

      <div className="settings-section">
        <h3>Word Dictionary (optional)</h3>
        <p className="setting-sub" style={{ marginBottom: 12 }}>
          The “Look up” button when adding a word pulls the definition, pronunciation, recorded
          audio, and example sentences from Merriam-Webster. It works out of the box via the site’s
          proxy; paste your own key here to use your own account instead. Stored only in this browser.
        </p>
        <div className="form-group" style={{ marginBottom: 8 }}>
          <input
            type="password"
            value={dictKey || settings.dictionaryApiKey || ''}
            onChange={(e) => setDictKey(e.target.value)}
            placeholder="Paste your Merriam-Webster API key"
          />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-primary btn-sm" onClick={() => update({ dictionaryApiKey: dictKey.trim() || undefined })}>
            Save key
          </button>
          {settings.dictionaryApiKey && (
            <button
              className="btn btn-danger btn-sm"
              onClick={() => {
                setDictKey('');
                update({ dictionaryApiKey: undefined });
              }}
            >
              Remove key
            </button>
          )}
        </div>
      </div>

      <div className="settings-section">
        <h3>Data</h3>
        <div className="setting-row">
          <div>
            <div className="setting-label">Clear all my data</div>
            <div className="setting-sub">Removes custom word lists, settings, and PIN from this browser.</div>
          </div>
          <button className="btn btn-danger btn-sm" onClick={clearAll}>
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}
