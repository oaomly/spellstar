'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function TopNav() {
  const pathname = usePathname();
  const isSettings = pathname?.startsWith('/settings');
  const isHome = pathname === '/' || (!isSettings && !pathname?.includes('/week/'));

  return (
    <nav className="nav">
      <Link href="/" className="nav-logo">
        Spell<span>Star</span> ⭐
      </Link>
      <Link href="/" className={`nav-btn${isHome ? ' active' : ''}`}>
        Home
      </Link>
      <Link href="/settings" className={`nav-btn${isSettings ? ' active' : ''}`}>
        Settings
      </Link>
    </nav>
  );
}
