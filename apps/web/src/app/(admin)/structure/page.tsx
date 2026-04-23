'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Building2,
  Mail,
  UserPlus,
  ChevronDown,
  Stethoscope,
  Shield,
  Users,
  Clock,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

const InviteSchema = z.object({
  email: z.string().email('Email invalide'),
  role: z.enum(['idel', 'doctor']),
});

type InviteFormData = z.infer<typeof InviteSchema>;

interface Invitation {
  id: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
  expiresAt: string;
}

const STATUS_META: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
  pending: {
    label: 'En attente',
    className: 'bg-amber-100 text-amber-700 border border-amber-200',
    icon: <Clock size={11} />,
  },
  accepted: {
    label: 'Acceptée',
    className: 'bg-green-100 text-green-700 border border-green-200',
    icon: <CheckCircle2 size={11} />,
  },
  expired: {
    label: 'Expirée',
    className: 'bg-slate-100 text-slate-500 border border-slate-200',
    icon: <XCircle size={11} />,
  },
};

const ROLE_LABEL: Record<string, string> = {
  idel: 'IDEL collaborateur',
  doctor: 'Médecin prescripteur',
};

function RoleBadge({ role }: { role: string }) {
  if (role === 'idel') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-700 border border-teal-200">
        <Stethoscope size={10} />
        IDEL
      </span>
    );
  }
  if (role === 'doctor') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700 border border-purple-200">
        <Shield size={10} />
        Médecin
      </span>
    );
  }
  return null;
}

export default function StructurePage() {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loadingInvitations, setLoadingInvitations] = useState(true);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [memberCount, setMemberCount] = useState<number>(0);
  const [pendingCount, setPendingCount] = useState<number>(0);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InviteFormData>({ resolver: zodResolver(InviteSchema) });

  const fetchInvitations = useCallback(async () => {
    setLoadingInvitations(true);
    try {
      const res = await fetch('/api/v1/invitations');
      const data = (await res.json()) as { data?: { invitations: Invitation[] } };
      const list = data.data?.invitations ?? [];
      setInvitations(list);
      setPendingCount(list.filter((i) => i.status === 'pending').length);
    } catch {
    } finally {
      setLoadingInvitations(false);
    }
  }, []);

  const fetchMemberCount = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/admin/members');
      const data = (await res.json()) as { data?: { members: unknown[] } };
      setMemberCount(data.data?.members.length ?? 0);
    } catch {}
  }, []);

  useEffect(() => {
    void fetchInvitations();
    void fetchMemberCount();
  }, [fetchInvitations, fetchMemberCount]);

  async function onSubmit(values: InviteFormData) {
    setApiError(null);
    setSuccessMessage(null);

    const res = await fetch('/api/v1/invitations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    });

    const data = (await res.json()) as {
      data?: { invitation: { email: string } };
      error?: { code: string; message: string };
    };

    if (!res.ok) {
      if (data.error?.code === 'INVITATION_ALREADY_PENDING') {
        setApiError('Une invitation est déjà en attente pour cet email');
      } else {
        setApiError(data.error?.message ?? 'Une erreur est survenue');
      }
      return;
    }

    setSuccessMessage(`Invitation envoyée à ${data.data?.invitation.email ?? values.email}`);
    reset();
    setShowModal(false);
    void fetchInvitations();
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1e2d6b]">Structure</h1>
          <p className="text-sm text-slate-500 mt-1">
            Gérez les informations de votre cabinet et invitez vos collaborateurs.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 rounded-lg bg-[#1e2d6b] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#162255] transition-colors"
        >
          <UserPlus size={16} />
          Inviter un collaborateur
        </button>
      </div>

      {/* Stat bento */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center shrink-0">
            <Users size={20} className="text-teal-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-800">{memberCount}</p>
            <p className="text-xs text-slate-500 mt-0.5">Membres actifs</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
            <Mail size={20} className="text-amber-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-800">{pendingCount}</p>
            <p className="text-xs text-slate-500 mt-0.5">Invitations en attente</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-[#1e2d6b]/10 flex items-center justify-center shrink-0">
            <Building2 size={20} className="text-[#1e2d6b]" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-800">HDS</p>
            <p className="text-xs text-slate-500 mt-0.5">Hébergement certifié</p>
          </div>
        </div>
      </div>

      {/* Cabinet info card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-6">
          <Building2 size={18} className="text-[#1e2d6b]" />
          <h2 className="text-base font-semibold text-slate-800">Informations du cabinet</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
          {[
            { label: 'Nom du cabinet', placeholder: 'Cabinet KURA', type: 'text' },
            { label: 'Adresse', placeholder: '12 rue de la Paix, 75001 Paris', type: 'text' },
            { label: 'Numéro RPPS', placeholder: '10012345678', type: 'text' },
            { label: 'SIRET', placeholder: '123 456 789 00012', type: 'text' },
          ].map((field) => (
            <div key={field.label}>
              <label className="block text-sm font-medium text-slate-700 mb-1">{field.label}</label>
              <input
                type={field.type}
                placeholder={field.placeholder}
                disabled
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-400 cursor-not-allowed placeholder:text-slate-300"
              />
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-400 mt-4">
          La modification des informations du cabinet sera disponible prochainement.
        </p>
      </div>

      {/* Invitations */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Mail size={18} className="text-[#1e2d6b]" />
            <h2 className="text-base font-semibold text-slate-800">Invitations envoyées</h2>
          </div>
          {invitations.length > 0 && (
            <span className="text-xs text-slate-400">{invitations.length} invitation{invitations.length > 1 ? 's' : ''}</span>
          )}
        </div>

        {successMessage && (
          <div className="mb-4 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700 flex items-center gap-2">
            <CheckCircle2 size={15} />
            {successMessage}
          </div>
        )}

        {loadingInvitations ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-12 rounded-lg bg-slate-100 animate-pulse" />
            ))}
          </div>
        ) : invitations.length === 0 ? (
          <div className="text-center py-10">
            <Mail size={32} className="mx-auto text-slate-300 mb-3" />
            <p className="text-sm text-slate-500">Aucune invitation envoyée pour le moment.</p>
            <button
              onClick={() => setShowModal(true)}
              className="mt-4 text-sm font-medium text-[#1e2d6b] hover:underline"
            >
              Inviter le premier collaborateur →
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  {['Email', 'Rôle', 'Statut', 'Envoyée le'].map((h) => (
                    <th
                      key={h}
                      className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-3 py-2"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {invitations.map((inv) => {
                  const meta = STATUS_META[inv.status] ?? {
                    label: inv.status,
                    className: 'bg-slate-100 text-slate-500',
                    icon: null,
                  };
                  return (
                    <tr key={inv.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                      <td className="px-3 py-3 text-sm text-slate-700 font-medium">{inv.email}</td>
                      <td className="px-3 py-3">
                        <RoleBadge role={inv.role} />
                      </td>
                      <td className="px-3 py-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${meta.className}`}>
                          {meta.icon}
                          {meta.label}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-sm text-slate-500">
                        {new Date(inv.createdAt).toLocaleDateString('fr-FR')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invite modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Inviter un collaborateur</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  L'invitation sera envoyée par e-mail avec un lien de configuration sécurisé.
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                aria-label="Fermer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} noValidate className="px-6 py-5 space-y-4">
              <div>
                <label htmlFor="modal-email" className="block text-sm font-medium text-slate-700 mb-1">
                  Adresse email
                </label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="modal-email"
                    type="email"
                    {...register('email')}
                    placeholder="collaborateur@exemple.fr"
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1e2d6b] focus:border-transparent"
                  />
                </div>
                {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
              </div>

              <div>
                <label htmlFor="modal-role" className="block text-sm font-medium text-slate-700 mb-1">
                  Rôle
                </label>
                <div className="relative">
                  <select
                    id="modal-role"
                    {...register('role')}
                    className="w-full appearance-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 pr-8 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1e2d6b] focus:border-transparent"
                  >
                    <option value="">Sélectionner un rôle</option>
                    <option value="idel">Infirmier (IDEL)</option>
                    <option value="doctor">Médecin prescripteur</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
                {errors.role && <p className="mt-1 text-xs text-red-600">{errors.role.message}</p>}
              </div>

              {apiError && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                  {apiError}
                </div>
              )}

              {/* HDS badge */}
              <div className="flex items-center gap-2 rounded-lg bg-[#1e2d6b]/5 border border-[#1e2d6b]/10 px-3 py-2.5">
                <Shield size={14} className="text-[#1e2d6b] shrink-0" />
                <p className="text-xs text-[#1e2d6b] font-medium">
                  Transmission sécurisée · HDS Certifié
                </p>
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); reset(); setApiError(null); }}
                  className="flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-[#1e2d6b] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#162255] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                >
                  <Mail size={14} />
                  {isSubmitting ? 'Envoi…' : "Envoyer l'invitation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
