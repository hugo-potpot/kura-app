'use client';

import { useState, useEffect } from 'react';
import { Menu, X, Building2, LayoutDashboard, Users, Stethoscope, Settings, UserCircle } from 'lucide-react';
import type { LucideProps } from 'lucide-react';
import { SignOutButton } from '@/components/sign-out-button';

const ICON_MAP: Record<string, React.ComponentType<LucideProps>> = {
  LayoutDashboard,
  Users,
  Stethoscope,
  Building2,
  UserCircle,
  Settings,
};

export interface NavItem {
  href: string;
  label: string;
  iconName: string;
}

interface AdminSidebarClientProps {
  navItems: NavItem[];
  userName: string;
  userRole: string;
}

export function AdminSidebarClient({ navItems, userName, userRole }: AdminSidebarClientProps) {
  const [open, setOpen] = useState(false);

  // Close sidebar when navigating (URL changes)
  useEffect(() => {
    setOpen(false);
  }, []);

  // Close on Escape key
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, []);

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10">
        <div className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center">
          <Building2 className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-white font-bold text-base leading-tight">KURA</p>
          <p className="text-white/50 text-[10px] uppercase tracking-widest leading-tight">Cabinet Infirmier</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1" aria-label="Navigation principale">
        {navItems.map((item) => {
          const Icon = ICON_MAP[item.iconName];
          return (
            <a
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors text-sm font-medium group"
              aria-label={item.label}
            >
              {Icon && <Icon className="w-5 h-5 flex-shrink-0 group-hover:text-white transition-colors" />}
              {item.label}
            </a>
          );
        })}
      </nav>

      {/* User + Déconnexion */}
      <div className="px-3 py-4 border-t border-white/10">
        <div className="flex items-center gap-3 px-3 py-2 mb-1">
          <div className="w-8 h-8 bg-indigo-400 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {userName.slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-white text-sm font-medium truncate">{userName}</p>
            <p className="text-white/50 text-xs truncate">{userRole}</p>
          </div>
        </div>
        <SignOutButton />
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar — always visible on lg+ */}
      <aside className="hidden lg:flex w-64 bg-[#3949AB] flex-col flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-4 py-3 bg-[#3949AB] border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-white/10 rounded-md flex items-center justify-center">
            <Building2 className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-bold text-sm">KURA</span>
        </div>
        <button
          onClick={() => setOpen(!open)}
          className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile overlay */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 z-20 bg-black/50"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile sidebar drawer */}
      <aside
        className={`lg:hidden fixed top-0 left-0 z-30 h-full w-64 bg-[#3949AB] flex flex-col transform transition-transform duration-200 ease-in-out ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarContent />
      </aside>

      {/* Mobile desktop recommendation banner */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-20 bg-amber-50 border-t border-amber-200 px-4 py-2">
        <p className="text-xs text-amber-700 text-center">
          Pour une expérience optimale, utilisez un écran desktop
        </p>
      </div>
    </>
  );
}
