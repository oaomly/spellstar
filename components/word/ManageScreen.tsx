'use client';

import { useState } from 'react';
import type { Word } from '@/lib/data/types';
import { useWordList } from '@/components/providers/WordListProvider';
import { useEditGate } from '@/lib/pin/useEditGate';
import { WordForm } from './WordForm';

export function ManageScreen() {
  const { words, setWords, reset, isCustomized, hydrated } = useWordList();
  const { requirePin } = useEditGate();
  const [editing, setEditing] = useState<Word | null>(null);
  const [showForm, setShowForm] = useState(false);

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
