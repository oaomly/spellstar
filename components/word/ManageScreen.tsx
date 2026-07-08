'use client';

import { useEffect, useState } from 'react';
import type { Word, WordList } from '@/lib/data/types';
import { useWordList } from '@/components/providers/WordListProvider';
import { useEditGate } from '@/lib/pin/useEditGate';
import { WordForm } from './WordForm';

export function ManageScreen() {
  const { grade, list, words, setWords, updateListMeta, reset, isCustomized, hydrated } = useWordList();
  const { requirePin } = useEditGate();
  const [editing, setEditing] = useState<Word | null>(null);
  const [showForm, setShowForm] = useState(false);

  const isDraft = grade === 'custom';
  const [levelTitle, setLevelTitle] = useState(list.title ?? '');
  const [publishGrade, setPublishGrade] = useState(String(list.publishAs?.grade ?? ''));
  const [publishWeek, setPublishWeek] = useState(String(list.publishAs?.week ?? ''));

  useEffect(() => {
    setLevelTitle(list.title ?? '');
    setPublishGrade(String(list.publishAs?.grade ?? ''));
    setPublishWeek(String(list.publishAs?.week ?? ''));
  }, [list.title, list.publishAs?.grade, list.publishAs?.week]);

  const saveLevelInfo = () =>
    requirePin(() => {
      const g = Number(publishGrade);
      const w = Number(publishWeek);
      updateListMeta({
        title: levelTitle.trim() || undefined,
        publishAs: g > 0 && w > 0 ? { grade: g, week: w } : undefined,
      });
    });

  const exportJson = () => {
    const g = Number(publishGrade) || 1;
    const w = Number(publishWeek) || 1;
    const payload: WordList = {
      grade: g,
      week: w,
      title: levelTitle.trim() || `Grade ${g} · Week ${w}`,
      words,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `grade${g}-week${w}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const openAdd = () => requirePin(() => { setEditing(null); setShowForm(true); });
  const openEdit = (w: Word) => requirePin(() => { setEditing(w); setShowForm(true); });

  const remove = (id: string) =>
    requirePin(() => {
      if (window.confirm('Remove this word?')) setWords(words.filter((w) => w.id !== id));
    });

  const doReset = () =>
    requirePin(() => {
      if (window.confirm('Reset to the default list? Your custom words for this week will be removed.')) {
        reset();
      }
    });

  const save = (word: Word) => {
    const exists = words.some((w) => w.id === word.id);
    setWords(exists ? words.map((w) => (w.id === word.id ? word : w)) : [...words, word]);
    setShowForm(false);
    setEditing(null);
  };

  return (
    <div>
      <div className="section-header">
        <h2>✏️ Manage Words</h2>
        <button className="btn btn-primary" onClick={openAdd}>
          ＋ Add Word
        </button>
      </div>

      {isDraft && hydrated && (
        <div className="form-group" style={{ background: 'var(--primary-light)', padding: 16, borderRadius: 'var(--radius-sm)' }}>
          <label>Level name (shown on this list)</label>
          <input
            value={levelTitle}
            onChange={(e) => setLevelTitle(e.target.value)}
            placeholder="e.g. Grade 1 · Week 9"
          />
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <div style={{ flex: 1 }}>
              <label>Grade</label>
              <input
                type="number"
                min={1}
                value={publishGrade}
                onChange={(e) => setPublishGrade(e.target.value)}
                placeholder="1"
              />
            </div>
            <div style={{ flex: 1 }}>
              <label>Week</label>
              <input
                type="number"
                min={1}
                value={publishWeek}
                onChange={(e) => setPublishWeek(e.target.value)}
                placeholder="9"
              />
            </div>
          </div>
          <p className="phonics-hint" style={{ textAlign: 'left', marginTop: 10 }}>
            This becomes <strong>grade{publishGrade || '?'}/week{publishWeek || '?'}</strong> when exported below.
          </p>
          <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
            <button className="btn btn-secondary btn-sm" onClick={saveLevelInfo}>
              💾 Save Level Info
            </button>
            <button className="btn btn-secondary btn-sm" onClick={exportJson} disabled={words.length === 0}>
              ⬇️ Export as JSON
            </button>
          </div>
          <p className="phonics-hint" style={{ textAlign: 'left', marginTop: 8 }}>
            This list is saved in <em>this browser only</em> — nobody else sees it. To make it
            part of the app for every visitor, download the JSON, save it as{' '}
            <code>data/wordlists/grade{publishGrade || 'G'}/week{publishWeek || 'W'}.json</code>,
            add it to <code>manifest.json</code> and <code>lib/data/defaultWordLists.ts</code>, then
            commit &amp; deploy.
          </p>
        </div>
      )}

      {hydrated && (
        <div className="info-banner">
          <span>
            {isCustomized
              ? '✏️ Customized · saved in this browser only'
              : '📦 You’re viewing the default list. Editing creates your own copy, saved only in this browser.'}
          </span>
          {isCustomized && (
            <button className="btn btn-secondary btn-sm" onClick={doReset}>
              ↺ Reset to Default
            </button>
          )}
        </div>
      )}

      {words.length === 0 ? (
        <div className="empty-state">
          <div className="es-icon">📝</div>
          <h3>No words yet</h3>
          <p>Add your weekly spelling words. The app will auto-detect tricky words and split sounds for you.</p>
          <button className="btn btn-primary" onClick={openAdd}>
            ＋ Add First Word
          </button>
        </div>
      ) : (
        <div className="words-grid">
          {words.map((w) => (
            <div key={w.id} className="word-card">
              <div className="word-card-img">
                {w.img ? <img src={w.img} alt={w.word} /> : <span className="no-img">{w.emoji || '📝'}</span>}
              </div>
              <div className="word-card-body">
                <h3>
                  {w.word}{' '}
                  {w.tricky ? (
                    <span className="tag tag-custom">tricky</span>
                  ) : (
                    <span className="tag tag-lesson">{w.chunks.map((c) => c.text).join('·')}</span>
                  )}
                </h3>
                <p>{w.def || 'No definition yet.'}</p>
                <div className="word-card-actions">
                  <button className="btn btn-secondary btn-sm" onClick={() => openEdit(w)}>
                    ✏️ Edit
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => remove(w.id)}>
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <WordForm
          initial={editing ?? undefined}
          onSave={save}
          onCancel={() => {
            setShowForm(false);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}
