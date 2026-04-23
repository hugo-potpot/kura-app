'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Settings,
  Users,
  Brain,
  Bell,
  Shield,
  ChevronDown,
} from 'lucide-react';

interface Member {
  id: string;
  name: string;
  email: string;
  role: string;
  disabled: boolean;
  createdAt: string;
  isSelf: boolean;
}

type TabId = 'general' | 'ia' | 'notifications' | 'securite';

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'general', label: 'Général', icon: <Settings size={15} /> },
  { id: 'ia', label: 'IA & Transmissions', icon: <Brain size={15} /> },
  { id: 'notifications', label: 'Notifications', icon: <Bell size={15} /> },
  { id: 'securite', label: 'Sécurité', icon: <Shield size={15} /> },
];

const MEMBER_ROLE_LABEL: Record<string, string> = {
  admin: 'Admin',
  idel: 'IDEL collaborateur',
  doctor: 'Médecin prescripteur',
};

function Toggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={enabled}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1e2d6b] ${
        enabled ? 'bg-[#0d9488]' : 'bg-slate-200'
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${
          enabled ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

function TabGeneral() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      <h2 className="text-base font-semibold text-slate-800 mb-5">Informations du cabinet</h2>
      <div className="space-y-4 max-w-md">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Nom du cabinet
          </label>
          <input
            type="text"
            defaultValue="Cabinet KURA"
            disabled
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500 cursor-not-allowed"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Fuseau horaire
          </label>
          <div className="relative">
            <select
              defaultValue="Europe/Paris"
              disabled
              className="w-full appearance-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500 cursor-not-allowed pr-8"
            >
              <option value="Europe/Paris">Europe/Paris (UTC+1)</option>
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>
        <p className="text-xs text-slate-400 pt-1">
          La modification des informations du cabinet sera disponible prochainement.
        </p>
      </div>
    </div>
  );
}

function TabIA() {
  const [transcription, setTranscription] = useState(true);
  const [validation, setValidation] = useState(true);
  const [precision, setPrecision] = useState(100);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
      <div>
        <h2 className="text-base font-semibold text-slate-800">Configuration IA</h2>
        <p className="text-sm text-slate-500 mt-1">
          Personnalisez le comportement de l'assistant IA lors de vos consultations.
        </p>
      </div>

      <div className="divide-y divide-slate-100">
        <div className="flex items-start justify-between py-5 first:pt-0">
          <div className="pr-8">
            <p className="text-sm font-medium text-slate-800">Transcription Automatique</p>
            <p className="text-sm text-slate-500 mt-0.5">
              L'IA rédige vos notes en temps réel suite à la consultation.
            </p>
          </div>
          <Toggle enabled={transcription} onToggle={() => setTranscription((v) => !v)} />
        </div>

        <div className="py-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-slate-800">Précision IA</p>
              <p className="text-sm text-slate-500 mt-0.5">
                Ajustez l'équilibre entre prudence et performance.
              </p>
            </div>
            <span className="text-xs font-semibold text-[#0d9488] bg-teal-50 px-2.5 py-1 rounded-full">
              {precision < 40 ? 'PRUDENT' : precision < 70 ? 'ÉQUILIBRÉ' : 'OPTIMAL'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 w-14 text-right shrink-0">PRUDENT</span>
            <input
              type="range"
              min={0}
              max={100}
              value={precision}
              onChange={(e) => setPrecision(Number(e.target.value))}
              className="flex-1 h-2 rounded-full appearance-none bg-slate-200 accent-[#0d9488] cursor-pointer"
            />
            <span className="text-xs text-slate-400 w-14 shrink-0">OPTIMAL</span>
          </div>
        </div>

        <div className="flex items-start justify-between py-5 last:pb-0">
          <div className="pr-8">
            <p className="text-sm font-medium text-slate-800">Validation Obligatoire</p>
            <p className="text-sm text-slate-500 mt-0.5">
              Revue humaine requise avant sauvegarde.
            </p>
          </div>
          <Toggle enabled={validation} onToggle={() => setValidation((v) => !v)} />
        </div>
      </div>
    </div>
  );
}

function TabNotifications() {
  const [nouvelles, setNouvelles] = useState(true);
  const [absences, setAbsences] = useState(false);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
      <div>
        <h2 className="text-base font-semibold text-slate-800">Préférences de notifications</h2>
        <p className="text-sm text-slate-500 mt-1">
          Choisissez les événements pour lesquels vous souhaitez être notifié.
        </p>
      </div>

      <div className="divide-y divide-slate-100">
        <div className="flex items-start justify-between py-5 first:pt-0">
          <div className="pr-8">
            <p className="text-sm font-medium text-slate-800">Nouvelles transmissions</p>
            <p className="text-sm text-slate-500 mt-0.5">
              Recevez une notification à chaque nouvelle transmission soumise.
            </p>
          </div>
          <Toggle enabled={nouvelles} onToggle={() => setNouvelles((v) => !v)} />
        </div>

        <div className="flex items-start justify-between py-5 last:pb-0">
          <div className="pr-8">
            <p className="text-sm font-medium text-slate-800">Absences patients</p>
            <p className="text-sm text-slate-500 mt-0.5">
              Soyez alerté lorsqu'un patient est absent lors d'une visite planifiée.
            </p>
          </div>
          <Toggle enabled={absences} onToggle={() => setAbsences((v) => !v)} />
        </div>
      </div>
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  const classes =
    role === 'doctor'
      ? 'bg-purple-100 text-purple-700'
      : role === 'admin'
        ? 'bg-slate-100 text-slate-600'
        : 'bg-blue-100 text-blue-700';
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${classes}`}>
      {MEMBER_ROLE_LABEL[role] ?? role}
    </span>
  );
}

function StatusBadge({ disabled }: { disabled: boolean }) {
  return (
    <span
      className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${
        disabled ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'
      }`}
    >
      {disabled ? 'Désactivé' : 'Actif'}
    </span>
  );
}

function TabSecurite() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [memberError, setMemberError] = useState<string | null>(null);
  const [memberSuccess, setMemberSuccess] = useState<string | null>(null);
  const [pendingRoles, setPendingRoles] = useState<Record<string, string>>({});

  const fetchMembers = useCallback(async () => {
    setLoadingMembers(true);
    try {
      const res = await fetch('/api/v1/admin/members');
      const data = (await res.json()) as { data?: { members: Member[] } };
      const fetched = data.data?.members ?? [];
      setMembers(fetched);
      const initialRoles: Record<string, string> = {};
      fetched.forEach((m) => {
        initialRoles[m.id] = m.role;
      });
      setPendingRoles(initialRoles);
    } catch {
    } finally {
      setLoadingMembers(false);
    }
  }, []);

  useEffect(() => {
    void fetchMembers();
  }, [fetchMembers]);

  async function handleRoleChange(memberId: string) {
    setMemberError(null);
    setMemberSuccess(null);
    const role = pendingRoles[memberId];
    const res = await fetch(`/api/v1/admin/members/${memberId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    });
    const data = (await res.json()) as { error?: { code: string; message: string } };
    if (!res.ok) {
      if (data.error?.code === 'LAST_ADMIN_PROTECTION') {
        setMemberError("Impossible — vous êtes le seul admin de cette structure");
      } else {
        setMemberError(data.error?.message ?? "Une erreur est survenue");
      }
      return;
    }
    setMemberSuccess("Rôle modifié avec succès");
    void fetchMembers();
  }

  async function handleDeactivate(memberId: string, memberName: string) {
    const confirmed = window.confirm(
      `Désactiver le compte de ${memberName} ? Cette action révoquera toutes ses sessions.`
    );
    if (!confirmed) return;
    setMemberError(null);
    setMemberSuccess(null);
    const res = await fetch(`/api/v1/admin/members/${memberId}/deactivate`, { method: 'POST' });
    const data = (await res.json()) as { error?: { code: string; message: string } };
    if (!res.ok) {
      if (data.error?.code === 'LAST_ADMIN_PROTECTION') {
        setMemberError("Impossible — vous êtes le seul admin de cette structure");
      } else {
        setMemberError(data.error?.message ?? "Une erreur est survenue");
      }
      return;
    }
    setMemberSuccess("Compte désactivé et sessions révoquées");
    void fetchMembers();
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-5">
          <Users size={18} className="text-[#1e2d6b]" />
          <h2 className="text-base font-semibold text-slate-800">Membres de la structure</h2>
        </div>

        {memberError && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {memberError}
          </div>
        )}
        {memberSuccess && (
          <div className="mb-4 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
            {memberSuccess}
          </div>
        )}

        {loadingMembers ? (
          <p className="text-sm text-slate-400">Chargement…</p>
        ) : members.length === 0 ? (
          <p className="text-sm text-slate-400">Aucun membre dans cette structure.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-3 py-2">
                    Nom
                  </th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-3 py-2">
                    Email
                  </th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-3 py-2">
                    Rôle
                  </th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-3 py-2">
                    Statut
                  </th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-3 py-2">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-3 py-3 text-sm text-slate-700">
                      <span className="font-medium">{m.name}</span>
                      {m.isSelf && (
                        <span className="ml-1.5 text-xs text-slate-400">(vous)</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-sm text-slate-500">{m.email}</td>
                    <td className="px-3 py-3">
                      <RoleBadge role={m.role} />
                    </td>
                    <td className="px-3 py-3">
                      <StatusBadge disabled={m.disabled} />
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        {m.role !== 'admin' && (
                          <>
                            <div className="relative">
                              <select
                                value={pendingRoles[m.id] ?? m.role}
                                onChange={(e) =>
                                  setPendingRoles((prev) => ({ ...prev, [m.id]: e.target.value }))
                                }
                                disabled={m.isSelf || m.disabled}
                                aria-label={`Changer le rôle de ${m.name}`}
                                className="appearance-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 pr-7 text-xs text-slate-700 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[#1e2d6b]"
                              >
                                <option value="idel">IDEL collaborateur</option>
                                <option value="doctor">Médecin prescripteur</option>
                              </select>
                              <ChevronDown
                                size={12}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                              />
                            </div>
                            <button
                              onClick={() => void handleRoleChange(m.id)}
                              disabled={m.isSelf || m.disabled}
                              aria-label={`Modifier le rôle de ${m.name}`}
                              className="rounded-lg bg-[#1e2d6b] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#162255] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              Modifier le rôle
                            </button>
                          </>
                        )}
                        {!m.disabled && (
                          <button
                            onClick={() => void handleDeactivate(m.id, m.name)}
                            disabled={m.isSelf}
                            aria-label={`Désactiver le compte de ${m.name}`}
                            className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            Désactiver
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('general');

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-[#1e2d6b] mb-6">Paramètres</h1>

        <div className="flex items-center gap-1 mb-8 p-1 bg-slate-100 rounded-xl w-fit">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                activeTab === tab.id
                  ? 'bg-[#1e2d6b] text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'general' && <TabGeneral />}
        {activeTab === 'ia' && <TabIA />}
        {activeTab === 'notifications' && <TabNotifications />}
        {activeTab === 'securite' && <TabSecurite />}
      </div>
    </div>
  );
}
