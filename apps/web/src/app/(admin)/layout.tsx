import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { AdminSidebarClient, type NavItem } from '@/components/layout/AdminSidebarClient';

const ALL_NAV_ITEMS: (NavItem & { doctorHidden?: boolean })[] = [
  { href: '/dashboard', label: 'Tableau de bord', iconName: 'LayoutDashboard' },
  { href: '/patients', label: 'Patients', iconName: 'Users' },
  { href: '/idels', label: 'Infirmiers', iconName: 'Stethoscope', doctorHidden: true },
  { href: '/structure', label: 'Structure', iconName: 'Building2', doctorHidden: true },
  { href: '/profile', label: 'Profil', iconName: 'UserCircle' },
  { href: '/settings', label: 'Paramètres', iconName: 'Settings', doctorHidden: true },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() });
  const user = session?.user as { name?: string; email?: string; role?: string } | undefined;
  const isDoctor = user?.role === 'doctor';
  const userName = user?.name ?? 'Utilisateur';
  const userRole =
    user?.role === 'admin'
      ? 'Administrateur'
      : user?.role === 'doctor'
        ? 'Médecin'
        : 'Infirmier';

  const navItems: NavItem[] = ALL_NAV_ITEMS.filter(
    (item) => !(item.doctorHidden && isDoctor),
  ).map(({ doctorHidden: _d, ...rest }) => rest);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <AdminSidebarClient navItems={navItems} userName={userName} userRole={userRole} />

      {/* Main content — offset on mobile for top bar */}
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 p-8 pt-8 lg:pt-8 mt-[52px] lg:mt-0 mb-[40px] lg:mb-0">
          {children}
        </main>
      </div>
    </div>
  );
}
