'use client';
import type { ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { BASE_PATH } from '@/lib/base-path';
import { apiFetch } from '@/lib/api-fetch';

// Bottom tab bar, deacon-app style (watson-tools/src/app/cat/deaconapp/
// DeaconAppTabs.tsx) — 3 tabs only, Stats dropped (2026-09-04, at Bill's
// request). Uses next/link + real routes rather than DeaconAppTabs' client
// state, since each tab here is its own page (Add still needs its own full
// route for deep-linking/refresh), not a single-page tab switch.
//
// Two separate components (not one), because the deacon app's shell puts
// the header above <main> and the tab bar below it — layout.tsx renders
// NavHeader, then {children}, then NavTabs, in that order.

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v8M8 12h8" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
      <path d="M8 6h12M8 12h12M8 18h12" />
      <circle cx="4" cy="6" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="4" cy="12" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="4" cy="18" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M9 21H5a1 1 0 01-1-1V4a1 1 0 011-1h4" />
      <path d="M16 17l5-5-5-5M21 12H9" />
    </svg>
  );
}

const TABS: { href: string; label: string; icon: () => ReactNode }[] = [
  { href: '/', label: 'Add', icon: PlusIcon },
  { href: '/pending', label: 'Pending', icon: ClockIcon },
  { href: '/library', label: 'List', icon: ListIcon },
];

export function NavHeader({ name }: { name: string }) {
  const router = useRouter();

  async function logout() {
    await apiFetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  return (
    <div className="shrink-0 bg-[#0f1117] border-b border-gray-800 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Image src={`${BASE_PATH}/icon.png`} alt="" width={22} height={22} className="rounded-md" />
        <span className="font-semibold text-gray-100 text-sm">Curator</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xs text-gray-500">{name}</span>
        <button
          onClick={logout}
          aria-label="Log out"
          className="text-gray-500 hover:text-gray-300 transition-colors"
        >
          <LogoutIcon />
        </button>
      </div>
    </div>
  );
}

export function NavTabs() {
  const pathname = usePathname();

  return (
    <div className="shrink-0 bg-[#0f1117] border-t border-gray-800 flex pb-[env(safe-area-inset-bottom)]">
      {TABS.map((t) => {
        const Icon = t.icon;
        const active = t.href === '/' ? pathname === '/' : pathname.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`flex-1 flex flex-col items-center justify-center gap-1 py-[14px] transition-colors ${
              active ? 'text-blue-500' : 'text-gray-500'
            }`}
          >
            <Icon />
            <span className={`text-[11px] ${active ? 'font-semibold' : 'font-medium'}`}>{t.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
