import Link from 'next/link';
import { notFound } from 'next/navigation';
import { manifest, getGradeLabel } from '@/lib/data/defaultWordLists';
import { WeekTile } from '@/components/home/WeekTile';

export function generateStaticParams() {
  return manifest.grades.map((g) => ({ grade: String(g.grade) }));
}

export default async function GradePage({ params }: { params: Promise<{ grade: string }> }) {
  const { grade } = await params;
  const gradeEntry = manifest.grades.find((g) => String(g.grade) === grade);
  if (!gradeEntry) notFound();

  return (
    <div>
      <div className="subnav">
        <Link href="/">← Home</Link>
      </div>
      <div className="section-header">
        <h2>{getGradeLabel(gradeEntry.grade)}</h2>
      </div>
      <div className="week-list">
        {gradeEntry.weeks.map((w) => (
          <WeekTile key={w.week} grade={grade} week={w.week} title={w.title} count={w.count} />
        ))}
      </div>
    </div>
  );
}
