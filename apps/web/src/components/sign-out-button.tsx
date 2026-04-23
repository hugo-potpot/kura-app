'use client';

import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { authClient } from '@/lib/auth-client';

export function SignOutButton(): React.JSX.Element {
  const router = useRouter();

  const handleSignOut = async (): Promise<void> => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push('/login');
        },
      },
    });
  };

  return (
    <button
      onClick={() => void handleSignOut()}
      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors text-sm font-medium w-full text-left"
      aria-label="Se déconnecter"
    >
      <LogOut className="w-4 h-4" />
      Déconnexion
    </button>
  );
}
