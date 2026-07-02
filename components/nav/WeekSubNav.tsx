'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function WeekSubNav({ grade, week }: { grade: string; week: number }) {
  const pathname = usePathname() ?? '';
  const base = `/grade/${grade}/week/${week}`;
  const tabs = [
    { href: `${base}/lesson`, label: '📖 Lesson' },
    { href: `${base}/games`, label: '🎮 Games' },
    { href: `${base}/manage`, label: '✏️ Manage Words' },
  ];
  return (
    <div className="subnav">
      <Link href={`/grade/${grade}`}>← Weeks</Link>
      {tabs.map((t) => (
        <Link key={t.href} href={t.href} className={pathname.startsWith(t.href) ? 'active' : ''}>
          {t.label}
        </Link>
      ))}
    </div>
  );
}
