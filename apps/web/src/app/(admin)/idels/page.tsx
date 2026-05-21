'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  UserPlus,
  Stethoscope,
  Shield,
  Mail,
  X,
  ChevronDown,
  Users,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';

interface Member {
  id: string;
  name: string;
  email: string;
  role: string;
  disabled: boolean;
  createdAt: string;
  isSelf: boolean;
  patientCount: number;
  lastLoginAt: string | null;
}

interface Invitation {
  id: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
}

const inviteSchema = z.object({
  lastName: z.string().min(1, 'Le nom est requis'),
  firstName: z.string().min(1, 'Le prénom est requis'),
  email: z.string().email("L'adresse email est invalide"),
  role: z.enum(['idel', 'doctor']),
});

type InviteFormValues = z.infer<typeof inviteSchema>;

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function RoleBadge({ role }: { role: string }) {
  if (role === 'idel') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-700 border border-teal-200">
        <Stethoscope className="w-3 h-3" />
        IDEL
      </span>
    );
  }
  if (role === 'doctor') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700 border border-purple-200">
        <Shield className="w-3 h-3" />
        Médecin
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#1e2d6b]/10 text-[#1e2d6b] border border-[#1e2d6b]/20">
      <Shield className="w-3 h-3" />
      Admin
    </span>
  );
}

function StatusBadge({ disabled }: { disabled: boolean }) {
  if (!disabled) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200">
        <CheckCircle className="w-3 h-3" />
        Actif
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 border border-red-200">
      <XCircle className="w-3 h-3" />
      Désactivé
    </span>
  );
}

function InvitationStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    pending: {
      label: 'En attente',
      className: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
    },
    accepted: {
      label: 'Acceptée',
      className: 'bg-green-100 text-green-700 border border-green-200',
    },
    expired: {
      label: 'Expirée',
      className: 'bg-red-100 text-red-700 border border-red-200',
    },
  };
  const cfg = map[status] ?? {
    label: status,
    className: 'bg-slate-100 text-slate-700 border border-slate-200',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}

function formatRelativeDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Aujourd'hui";
  if (diffDays === 1) return 'Hier';
  if (diffDays < 7) return `Il y a ${diffDays} jours`;
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function MemberRow({
  member,
  onDeactivate,
  onRoleChange,
  onViewPlanning,
}: {
  member: Member;
  onDeactivate: (id: string) => void;
  onRoleChange: (id: string, role: string) => void;
  onViewPlanning: (id: string) => void;
}) {
  return (
    <tr className="hover:bg-slate-50 transition-colors">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold text-sm flex-shrink-0">
            {getInitials(member.name)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              {member.role === 'idel' ? (
                <button
                  onClick={() => onViewPlanning(member.id)}
                  className="text-sm font-medium text-[#1e2d6b] hover:underline text-left"
                >
                  {member.name}
                </button>
              ) : (
                <span className="text-sm font-medium text-slate-900">{member.name}</span>
              )}
              {member.isSelf && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-100 text-indigo-700 uppercase tracking-wide">
                  vous
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
              <Mail className="w-3 h-3" />
              {member.email}
            </div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <RoleBadge role={member.role} />
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <StatusBadge disabled={member.disabled} />
      </td>
      {/* Patients assignés (IDELs only) */}
      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
        {member.role === 'idel' ? (
          <span className="inline-flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-teal-500" />
            {member.patientCount}
          </span>
        ) : (
          <span className="text-slate-300">—</span>
        )}
      </td>
      {/* Dernière connexion */}
      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
        <span className="inline-flex items-center gap-1">
          <Clock className="w-3.5 h-3.5 text-slate-300" />
          {formatRelativeDate(member.lastLoginAt)}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right">
        {!member.isSelf && (
          <div className="flex items-center justify-end gap-2">
            <div className="relative inline-flex items-center">
              <select
                value={member.role}
                onChange={(e) => onRoleChange(member.id, e.target.value)}
                className="appearance-none pl-3 pr-7 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#1e2d6b]/20 focus:border-[#1e2d6b] transition-colors cursor-pointer"
                aria-label={`Rôle de ${member.name}`}
              >
                <option value="idel">Infirmier (IDEL)</option>
                <option value="doctor">Médecin</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
            </div>
            {!member.disabled && (
              <button
                onClick={() => onDeactivate(member.id)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
              >
                <XCircle className="w-3 h-3" />
                Désactiver
              </button>
            )}
          </div>
        )}
      </td>
    </tr>
  );
}

function InviteModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { role: 'idel' },
  });

  async function onSubmit(values: InviteFormValues) {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/v1/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: values.email, role: values.role }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error?.message ?? "Échec de l'envoi de l'invitation");
      }
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200">
        <div className="flex items-start justify-between px-6 pt-6 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Inviter un nouvel infirmier</h2>
            <p className="mt-1 text-sm text-slate-500 leading-snug">
              L'invitation sera envoyée par e-mail avec un lien de configuration sécurisé.
            </p>
          </div>
          <button
            onClick={onClose}
            className="ml-4 flex-shrink-0 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="px-6 pb-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Nom
              </label>
              <input
                {...register('lastName')}
                placeholder="Dupuis"
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1e2d6b]/30 focus:border-[#1e2d6b] transition-colors"
              />
              {errors.lastName && (
                <p className="mt-1 text-xs text-red-600">{errors.lastName.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Prénom
              </label>
              <input
                {...register('firstName')}
                placeholder="Marc"
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1e2d6b]/30 focus:border-[#1e2d6b] transition-colors"
              />
              {errors.firstName && (
                <p className="mt-1 text-xs text-red-600">{errors.firstName.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Adresse Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                {...register('email')}
                type="email"
                placeholder="marc.dupuis@cabinet.fr"
                className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-200 rounded-lg bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1e2d6b]/30 focus:border-[#1e2d6b] transition-colors"
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Rôle
            </label>
            <div className="relative">
              <select
                {...register('role')}
                className="w-full appearance-none px-3 py-2.5 text-sm border border-slate-200 rounded-lg bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1e2d6b]/30 focus:border-[#1e2d6b] transition-colors pr-9"
              >
                <option value="idel">Infirmier (IDEL)</option>
                <option value="doctor">Médecin prescripteur</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 px-3 py-2.5 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              <XCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="flex items-center gap-2 px-3 py-2.5 bg-teal-50 border border-teal-200 rounded-lg">
            <Shield className="w-4 h-4 text-teal-600 flex-shrink-0" />
            <span className="text-xs font-medium text-teal-700">
              HDS Certifié — Données hébergées en France, chiffrées bout en bout
            </span>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-[#1e2d6b] rounded-xl hover:bg-[#1e2d6b]/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? 'Envoi…' : "Envoyer l'invitation"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function IdelsPage() {
  const router = useRouter();
  const [members, setMembers] = useState<Member[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      const [membersRes, invitationsRes] = await Promise.all([
        fetch('/api/v1/admin/members'),
        fetch('/api/v1/invitations'),
      ]);
      if (!membersRes.ok) throw new Error('Impossible de charger les membres');
      const membersBody = await membersRes.json();
      setMembers(membersBody?.data?.members ?? []);

      if (invitationsRes.ok) {
        const invBody = await invitationsRes.json();
        setInvitations(invBody?.data?.invitations ?? []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  async function handleDeactivate(userId: string) {
    try {
      const res = await fetch(`/api/v1/admin/members/${userId}/deactivate`, { method: 'POST' });
      if (!res.ok) throw new Error('Échec de la désactivation');
      setMembers((prev) => prev.map((m) => (m.id === userId ? { ...m, disabled: true } : m)));
      showSuccess('Compte désactivé avec succès');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la désactivation');
    }
  }

  async function handleRoleChange(userId: string, role: string) {
    try {
      const res = await fetch(`/api/v1/admin/members/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) throw new Error('Échec du changement de rôle');
      setMembers((prev) => prev.map((m) => (m.id === userId ? { ...m, role } : m)));
      showSuccess('Rôle mis à jour avec succès');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du changement de rôle');
    }
  }

  function showSuccess(msg: string) {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 4000);
  }

  const idels = members.filter((m) => m.role === 'idel');
  const doctors = members.filter((m) => m.role === 'doctor');
  const activeIdels = idels.filter((m) => !m.disabled).length;
  const pendingInvitations = invitations.filter((i) => i.status === 'pending');

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Gestion des Infirmiers</h1>
          <p className="mt-1 text-sm text-slate-500">
            Visualisez et gérez l'équipe de soins de votre cabinet.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-[#1e2d6b] rounded-xl hover:bg-[#1e2d6b]/90 transition-colors shadow-sm"
        >
          <UserPlus className="w-4 h-4" />
          Inviter un nouvel infirmier
        </button>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2 px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          {successMsg}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          <XCircle className="w-4 h-4 flex-shrink-0" />
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-400 hover:text-red-600"
            aria-label="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex items-center gap-4">
          <div className="w-11 h-11 bg-teal-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <Stethoscope className="w-5 h-5 text-teal-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{loading ? '—' : activeIdels}</p>
            <p className="text-sm text-slate-500">IDELs actifs</p>
          </div>
          <span className="ml-auto inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-700">
            +0%
          </span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex items-center gap-4">
          <div className="w-11 h-11 bg-purple-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <Shield className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{loading ? '—' : doctors.length}</p>
            <p className="text-sm text-slate-500">Médecins prescripteurs</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex items-center gap-4">
          <div className="w-11 h-11 bg-amber-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <Users className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">
              {loading ? '—' : pendingInvitations.length}
            </p>
            <p className="text-sm text-slate-500">Invitations en attente</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
          <Stethoscope className="w-4 h-4 text-teal-600" />
          <h2 className="text-sm font-semibold text-slate-700">
            Infirmiers libéraux (IDELs)
          </h2>
          <span className="ml-auto text-xs text-slate-400">
            {loading ? '…' : `${idels.length} membre${idels.length !== 1 ? 's' : ''}`}
          </span>
        </div>

        {loading ? (
          <div className="px-6 py-12 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-[#1e2d6b] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : idels.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <Stethoscope className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-500">Aucun infirmier dans le cabinet.</p>
            <button
              onClick={() => setShowModal(true)}
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-[#1e2d6b] hover:underline"
            >
              <UserPlus className="w-4 h-4" />
              Inviter un infirmier
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Nom
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Rôle
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Patients
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Dernière connexion
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {idels.map((member) => (
                  <MemberRow
                    key={member.id}
                    member={member}
                    onDeactivate={handleDeactivate}
                    onRoleChange={handleRoleChange}
                    onViewPlanning={(id) => router.push(`/idels/${id}`)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {doctors.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
            <Shield className="w-4 h-4 text-purple-600" />
            <h2 className="text-sm font-semibold text-slate-700">Médecins prescripteurs</h2>
            <span className="ml-auto text-xs text-slate-400">
              {`${doctors.length} membre${doctors.length !== 1 ? 's' : ''}`}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Nom
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Rôle
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Patients
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Dernière connexion
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {doctors.map((member) => (
                  <MemberRow
                    key={member.id}
                    member={member}
                    onDeactivate={handleDeactivate}
                    onRoleChange={handleRoleChange}
                    onViewPlanning={() => undefined}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {pendingInvitations.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
            <Mail className="w-4 h-4 text-amber-600" />
            <h2 className="text-sm font-semibold text-slate-700">Invitations en attente</h2>
            <span className="ml-auto text-xs text-slate-400">
              {`${pendingInvitations.length} invitation${pendingInvitations.length !== 1 ? 's' : ''}`}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Rôle
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Date d'envoi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pendingInvitations.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                          <Mail className="w-4 h-4 text-amber-600" />
                        </div>
                        <span className="text-sm text-slate-700">{inv.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <RoleBadge role={inv.role} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <InvitationStatusBadge status={inv.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {new Date(inv.createdAt).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <InviteModal
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            fetchData();
            showSuccess("Invitation envoyée avec succès !");
          }}
        />
      )}
    </div>
  );
}
