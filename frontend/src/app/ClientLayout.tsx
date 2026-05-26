"use client";

import './globals.css';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, PlusSquare, ListVideo, Settings2, ImageIcon } from 'lucide-react';

const navLinks = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/create', label: 'Vidéo', icon: PlusSquare },
  { href: '/image', label: 'Image', icon: ImageIcon },
  { href: '/queue', label: 'Queue', icon: ListVideo },
  { href: '/settings', label: 'Settings', icon: Settings2 },
];

function Sidebar({ pathname }: { pathname: string }) {
  return (
    <aside
      className="hidden lg:flex w-[260px] flex-col justify-between flex-shrink-0"
      style={{
        background: 'rgba(9,9,17,0.98)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        padding: '28px 20px',
        position: 'sticky',
        top: 0,
        height: '100vh',
      }}
    >
      <div>
        <Link href="/" className="block mb-10">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 pulse-glow"
              style={{ background: 'linear-gradient(135deg, #a855f7, #ec4899)' }}
            >
              <ImageIcon className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-bold text-sm text-white leading-tight">AI Studio</p>
              <p className="text-xs text-gray-500 leading-tight">Influencer Engine</p>
            </div>
          </div>
        </Link>

        <nav className="space-y-1">
          {navLinks.map(({ href, label, icon: Icon }) => {
            const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href);
            return (
              <Link key={href} href={href} className={`nav-item ${isActive ? 'active' : ''}`}>
                <Icon className="w-4 h-4 flex-shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="text-xs text-gray-700 px-1">© 2026 AI Studio</div>
    </aside>
  );
}

function BottomNav({ pathname }: { pathname: string }) {
  return (
    <nav className="bottom-nav lg:hidden">
      {navLinks.map(({ href, label, icon: Icon }) => {
        const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href);
        return (
          <Link key={href} href={href} className={`bottom-nav-item ${isActive ? 'active' : ''}`}>
            <Icon className="w-5 h-5" />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="flex w-full min-h-screen">
      <Sidebar pathname={pathname} />
      <div className="flex flex-col flex-1 min-w-0">
        {/* Mobile top bar */}
        <header
          className="lg:hidden sticky top-0 z-40 flex items-center gap-3 px-4 py-3"
          style={{
            background: 'rgba(9,9,17,0.95)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
          }}
        >
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #a855f7, #ec4899)' }}
          >
            <ImageIcon className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-bold text-sm text-white">AI Studio</span>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8">
          {children}
        </main>
      </div>
      <BottomNav pathname={pathname} />
    </div>
  );
}
