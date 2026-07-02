import Link from 'next/link';
import { manifest } from '@/lib/data/defaultWordLists';
import { ContinueCard } from '@/components/home/ContinueCard';

export default function HomePage() {
  return (
    <div>
      <div className="home-hero">
        <h1>SpellStar ⭐</h1>
        <p>Learn to spell by sound — then play to practise!</p>
      </div>

      <ContinueCard />

      <div className="section-header">
        <h2>Pick a grade</h2>
      </div>
      <div className="home-cards">
        {manifest.grades.map((g) => (
          <Link key={String(g.grade)} href={`/grade/${g.grade}`} className="home-card">
            <div
              className="card-icon"
              style={{
                background: g.grade === 'custom' ? 'var(--yellow-light)' : 'var(--primary-light)',
              }}
            >
              {g.grade === 'custom' ? '✏️' : '🎓'}
            </div>
            <h2>{g.label}</h2>
            <p>
              {g.grade === 'custom'
                ? 'Make your own spelling list'
                : `${g.weeks.length} week${g.weeks.length > 1 ? 's' : ''} of words`}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
