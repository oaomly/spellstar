'use client';

const CORRECT = ['🎉 Great job!', '⭐ Awesome!', '👏 You got it!', '🌟 Brilliant!', '🚀 Super!'];
const WRONG = ['💪 Keep trying!', '🤔 Almost!', '📚 Good effort!'];

export function Feedback({
  show,
  correct,
  word,
}: {
  show: boolean;
  correct: boolean;
  word?: string;
}) {
  if (!show) return null;
  const msg = correct
    ? CORRECT[Math.floor(Math.random() * CORRECT.length)]
    : WRONG[Math.floor(Math.random() * WRONG.length)];
  return (
    <div className="feedback-popup show" role="status" aria-live="polite">
      <div className="feedback-emoji">{correct ? '🎉' : '💡'}</div>
      <div className="feedback-msg">{msg}</div>
      {!correct && word && (
        <div style={{ fontWeight: 800, color: 'var(--primary)', fontSize: 24 }}>{word}</div>
      )}
    </div>
  );
}
