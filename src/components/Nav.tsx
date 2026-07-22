'use client';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const LINKS = [
  { href: '/', label: 'Add' },
  { href: '/library', label: 'Library' },
  { href: '/pending', label: 'Pending' },
  { href: '/stats', label: 'Stats' },
];

export function Nav({ name }: { name: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  return (
    <header className="border-b border-gray-800 sticky top-0 bg-[#0f1117]/95 backdrop-blur z-10">
      <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Image src="/icon.png" alt="Curator" width={24} height={24} className="rounded-md mr-2" />
          {LINKS.map((link) => {
            const active = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  active ? 'bg-gray-800 text-gray-100' : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-gray-500">{name}</span>
          <button onClick={logout} className="text-gray-500 hover:text-gray-300 transition-colors">
            Log out
          </button>
        </div>
      </div>
    </header>
  );
}
