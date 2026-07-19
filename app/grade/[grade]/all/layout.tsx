import { notFound } from 'next/navigation';
import { manifest, getAllWordsForGrade } from '@/lib/data/defaultWordLists';
import { AllWordsProvider } from '@/components/providers/WordListProvider';

export function generateStaticParams() {
  return manifest.grades
    .filter((g) => g.grade !== 'custom')
    .map((g) => ({ grade: String(g.grade) }));
}

export default async function AllLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ grade: string }>;
}) {
  const { grade } = await params;
  const gradeEntry = manifest.grades.find((g) => String(g.grade) === grade && g.grade !== 'custom');
  if (!gradeEntry) notFound();

  const allWords = getAllWordsForGrade(Number(grade));

  return (
    <AllWordsProvider grade={Number(grade)} allWords={allWords}>
      {children}
    </AllWordsProvider>
  );
}
