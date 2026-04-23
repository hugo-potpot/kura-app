'use client';
import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Shield, ChevronRight, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { authClient } from '@/lib/auth-client';

const ProfileSchema = z.object({
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  image: z.string().url('URL invalide').optional().or(z.literal('')),
});

type ProfileFormData = z.infer<typeof ProfileSchema>;

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  disabled: boolean | null;
  isSelf: boolean;
}

const ROLE_LABEL: Record<string, string> = {
  admin: 'Admin',
  idel: 'IDEL collaborateur',
  doctor: 'Médecin prescripteur',
};

const ROLE_BADGE: Record<string, string> = {
  admin: 'bg-[#1e2d6b]/10 text-[#1e2d6b]',
  idel: 'bg-teal-100 text-teal-700',
  doctor: 'bg-purple-100 text-purple-700',
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

export default function ProfilePage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [currentName, setCurrentName] = useState('');
  const [currentEmail, setCurrentEmail] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormData>({ resolver: zodResolver(ProfileSchema) });

  const watchedName = watch('name', currentName);

  useEffect(() => {
    void authClient.getSession().then(({ data }) => {
      if (data?.user) {
        reset({
          name: data.user.name ?? '',
          image: (data.user.image as string | undefined) ?? '',
        });
        setCurrentName(data.user.name ?? '');
        setCurrentEmail(data.user.email ?? '');
      }
    });
  }, [reset]);

  const fetchTeam = useCallback(async () => {
    setLoadingMembers(true);
    try {
      const res = await fetch('/api/v1/team');
      const data = (await res.json()) as { data?: { members: TeamMember[] } };
      setMembers(data.data?.members ?? []);
    } catch {
    } finally {
      setLoadingMembers(false);
    }
  }, []);

  useEffect(() => {
    void fetchTeam();
  }, [fetchTeam]);

  async function onSubmit(values: ProfileFormData) {
    setErrorMsg(null);
    setSuccessMsg(null);

    const result = await authClient.updateUser({
      name: values.name,
      image: values.image || undefined,
    });

    if (result.error) {
      setErrorMsg(result.error.message ?? 'Une erreur est survenue');
      return;
    }

    setCurrentName(values.name);
    setSuccessMsg('Profil mis à jour avec succès');
  }

  const displayInitials = getInitials(watchedName || currentName || 'U');

  return (
    <div className="min-h-full">
      {successMsg && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-green-600" />
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <XCircle className="h-4 w-4 flex-shrink-0 text-red-500" />
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#1e2d6b]">Profil Administrateur</h1>
            <p className="mt-1 text-sm text-slate-500">
              Gérez vos informations de compte et vos paramètres de sécurité.
            </p>
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 rounded-lg bg-[#1e2d6b] px-5 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {isSubmitting ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-5 text-base font-semibold text-slate-800">
                Informations Personnelles
              </h2>

              <div className="mb-6 flex items-center gap-4">
                <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 text-lg font-bold text-indigo-700">
                  {displayInitials}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800">{watchedName || currentName}</p>
                  <p className="text-xs text-slate-500">{currentEmail}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="profile-name"
                    className="mb-1 block text-sm font-medium text-slate-700"
                  >
                    Nom complet
                  </label>
                  <input
                    id="profile-name"
                    type="text"
                    {...register('name')}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-[#1e2d6b] focus:ring-2 focus:ring-[#1e2d6b]/20"
                  />
                  {errors.name && (
                    <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="profile-email"
                    className="mb-1 block text-sm font-medium text-slate-700"
                  >
                    Adresse e-mail
                  </label>
                  <input
                    id="profile-email"
                    type="email"
                    value={currentEmail}
                    readOnly
                    className="w-full cursor-not-allowed rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-500 outline-none"
                  />
                  <p className="mt-1 text-xs text-slate-400">
                    L&apos;adresse e-mail ne peut pas être modifiée.
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="profile-phone"
                    className="mb-1 block text-sm font-medium text-slate-700"
                  >
                    Téléphone
                    <span className="ml-1 text-xs font-normal text-slate-400">(optionnel)</span>
                  </label>
                  <input
                    id="profile-phone"
                    type="tel"
                    disabled
                    placeholder="+33 6 00 00 00 00"
                    className="w-full cursor-not-allowed rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-400 outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center gap-2">
                <Shield className="h-4 w-4 text-[#0d9488]" />
                <h2 className="text-base font-semibold text-slate-800">Sécurité</h2>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-700">Face ID / Touch ID</p>
                    <p className="text-xs text-slate-400">Connexion biométrique</p>
                  </div>
                  <div className="relative">
                    <div className="h-6 w-11 cursor-not-allowed rounded-full bg-slate-200" />
                    <div className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow" />
                  </div>
                </div>

                <div className="border-t border-slate-100" />

                <button
                  type="button"
                  disabled
                  className="flex w-full cursor-not-allowed items-center justify-between rounded-lg px-1 py-1 text-left opacity-50 transition hover:bg-slate-50"
                >
                  <span className="text-sm font-medium text-slate-700">
                    Changer le mot de passe
                  </span>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </button>

                <div className="border-t border-slate-100" />

                <button
                  type="button"
                  disabled
                  className="flex w-full cursor-not-allowed items-center justify-between rounded-lg px-1 py-1 text-left opacity-50 transition hover:bg-slate-50"
                >
                  <span className="text-sm font-medium text-slate-700">
                    Gérer la double authentification
                  </span>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>

      <div className="mt-6">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-base font-semibold text-slate-800">Mon Équipe</h2>

          {loadingMembers ? (
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              Chargement des membres…
            </div>
          ) : members.length === 0 ? (
            <p className="text-sm text-slate-400">Aucun membre dans cette structure.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {members.map((m) => (
                <li key={m.id} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">
                    {getInitials(m.name || 'U')}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium text-slate-800">{m.name}</p>
                      {m.isSelf && (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                          vous
                        </span>
                      )}
                    </div>
                    <p className="truncate text-xs text-slate-400">{m.email}</p>
                  </div>

                  <div className="flex flex-shrink-0 items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${ROLE_BADGE[m.role] ?? 'bg-slate-100 text-slate-600'}`}
                    >
                      {ROLE_LABEL[m.role] ?? m.role}
                    </span>

                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${m.disabled ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}
                    >
                      {m.disabled ? 'Désactivé' : 'Actif'}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
