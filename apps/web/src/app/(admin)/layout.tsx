import { headers } from 'next/headers';
import { LayoutDashboard, Users, Stethoscope, Building2, Settings, UserCircle } from 'lucide-react';
import { auth } from '@/lib/auth';
import { SignOutButton } from '@/components/sign-out-button';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  adminOnly?: boolean;
  doctorHidden?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
  { href: '/patients', label: 'Patients', icon: Users },
  { href: '/idels', label: 'Infirmiers', icon: Stethoscope, doctorHidden: true },
  { href: '/structure', label: 'Structure', icon: Building2, doctorHidden: true },
  { href: '/profile', label: 'Profil', icon: UserCircle },
  { href: '/settings', label: 'Paramètres', icon: Settings, doctorHidden: true },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() });
  const user = session?.user as { name?: string; email?: string; role?: string } | undefined;
  const isDoctor = user?.role === 'doctor';
  const userName = user?.name ?? 'Utilisateur';
  const userRole = user?.role === 'admin' ? 'Administrateur' : user?.role === 'doctor' ? 'Médecin' : 'Infirmier';

  const visibleItems = NAV_ITEMS.filter((item) => !(item.doctorHidden && isDoctor));

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-[#1e2d6b] flex flex-col flex-shrink-0">
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
          {visibleItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors text-sm font-medium group"
              aria-label={item.label}
            >
              <item.icon className="w-5 h-5 flex-shrink-0 group-hover:text-white transition-colors" />
              {item.label}
            </a>
          ))}
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
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
