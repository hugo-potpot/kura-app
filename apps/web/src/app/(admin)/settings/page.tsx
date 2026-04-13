'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

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

interface Member {
  id: string;
  name: string;
  email: string;
  role: string;
  disabled: boolean;
  createdAt: string;
  isSelf: boolean;
}

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  pending: { label: 'En attente', color: '#D97706' },
  accepted: { label: 'Acceptée', color: '#16A34A' },
  expired: { label: 'Expirée', color: '#6B7280' },
};

const ROLE_LABEL: Record<string, string> = {
  idel: 'IDEL collaborateur',
  doctor: "Médecin prescripteur",
};

const MEMBER_ROLE_LABEL: Record<string, string> = {
  admin: 'Admin',
  idel: 'IDEL collaborateur',
  doctor: "Médecin prescripteur",
};

export default function SettingsPage() {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const [members, setMembers] = useState<Member[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [memberError, setMemberError] = useState<string | null>(null);
  const [memberSuccess, setMemberSuccess] = useState<string | null>(null);
  const [pendingRoles, setPendingRoles] = useState<Record<string, string>>({});

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InviteFormData>({ resolver: zodResolver(InviteSchema) });

  const fetchInvitations = useCallback(async () => {
    setLoadingList(true);
    try {
      const res = await fetch('/api/v1/invitations');
      const data = await res.json() as { data?: { invitations: Invitation[] } };
      setInvitations(data.data?.invitations ?? []);
    } catch {
      // silent
    } finally {
      setLoadingList(false);
    }
  }, []);

  const fetchMembers = useCallback(async () => {
    setLoadingMembers(true);
    try {
      const res = await fetch('/api/v1/admin/members');
      const data = await res.json() as { data?: { members: Member[] } };
      const fetched = data.data?.members ?? [];
      setMembers(fetched);
      const initialRoles: Record<string, string> = {};
      fetched.forEach((m) => { initialRoles[m.id] = m.role; });
      setPendingRoles(initialRoles);
    } catch {
      // silent
    } finally {
      setLoadingMembers(false);
    }
  }, []);

  useEffect(() => {
    void fetchInvitations();
    void fetchMembers();
  }, [fetchInvitations, fetchMembers]);

  async function handleRoleChange(memberId: string) {
    setMemberError(null);
    setMemberSuccess(null);
    const role = pendingRoles[memberId];
    const res = await fetch(`/api/v1/admin/members/${memberId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    });
    const data = await res.json() as { error?: { code: string; message: string } };
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
    const confirmed = window.confirm(`Désactiver le compte de ${memberName} ? Cette action révoquera toutes ses sessions.`);
    if (!confirmed) return;
    setMemberError(null);
    setMemberSuccess(null);
    const res = await fetch(`/api/v1/admin/members/${memberId}/deactivate`, { method: 'POST' });
    const data = await res.json() as { error?: { code: string; message: string } };
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

  async function onSubmit(values: InviteFormData) {
    setApiError(null);
    setSuccessMessage(null);

    const res = await fetch('/api/v1/invitations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    });

    const data = await res.json() as {
      data?: { invitation: { email: string } };
      error?: { code: string; message: string };
    };

    if (!res.ok) {
      if (data.error?.code === 'INVITATION_ALREADY_PENDING') {
        setApiError("Une invitation est déjà en attente pour cet email");
      } else {
        setApiError(data.error?.message ?? "Une erreur est survenue");
      }
      return;
    }

    setSuccessMessage(`Invitation envoyée à ${data.data?.invitation.email ?? values.email}`);
    reset();
    void fetchInvitations();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800">Paramètres</h1>

      {/* Section Membres */}
      <section style={{ marginTop: '32px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#1E293B', marginBottom: '20px' }}>
          Membres
        </h2>

        {memberError && <p style={{ ...errorStyle, marginBottom: '12px' }}>{memberError}</p>}
        {memberSuccess && (
          <p style={{ color: '#16A34A', fontSize: '14px', marginBottom: '12px' }}>{memberSuccess}</p>
        )}

        <div style={cardStyle}>
          {loadingMembers ? (
            <p style={{ color: '#94A3B8', fontSize: '14px' }}>Chargement…</p>
          ) : members.length === 0 ? (
            <p style={{ color: '#94A3B8', fontSize: '14px' }}>Aucun membre dans cette structure.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                  <th style={thStyle}>Nom</th>
                  <th style={thStyle}>Email</th>
                  <th style={thStyle}>Rôle</th>
                  <th style={thStyle}>Statut</th>
                  <th style={thStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={tdStyle}>
                      {m.name}
                      {m.isSelf && (
                        <span style={{ marginLeft: '6px', fontSize: '12px', color: '#64748B' }}>(vous)</span>
                      )}
                    </td>
                    <td style={tdStyle}>{m.email}</td>
                    <td style={tdStyle}>
                      <span style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 600,
                        backgroundColor: '#EFF6FF',
                        color: '#2563EB',
                      }}>
                        {MEMBER_ROLE_LABEL[m.role] ?? m.role}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <span style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 600,
                        backgroundColor: m.disabled ? '#FEE2E2' : '#DCFCE7',
                        color: m.disabled ? '#DC2626' : '#16A34A',
                      }}>
                        {m.disabled ? "Désactivé" : "Actif"}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, display: 'flex', gap: '8px', alignItems: 'center' }}>
                      {m.role !== 'admin' && (
                        <>
                          <select
                            value={pendingRoles[m.id] ?? m.role}
                            onChange={(e) => setPendingRoles((prev) => ({ ...prev, [m.id]: e.target.value }))}
                            disabled={m.isSelf || m.disabled}
                            aria-label={`Changer le rôle de ${m.name}`}
                            style={{ ...inputStyle, width: 'auto', padding: '4px 8px' }}
                          >
                            <option value="idel">IDEL collaborateur</option>
                            <option value="doctor">Médecin prescripteur</option>
                          </select>
                          <button
                            onClick={() => void handleRoleChange(m.id)}
                            disabled={m.isSelf || m.disabled}
                            aria-label={`Modifier le rôle de ${m.name}`}
                            style={
                              m.isSelf || m.disabled
                                ? { ...buttonStyle, opacity: 0.5, cursor: 'not-allowed', padding: '4px 10px', fontSize: '12px' }
                                : { ...buttonStyle, padding: '4px 10px', fontSize: '12px' }
                            }
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
                          style={
                            m.isSelf
                              ? { ...buttonStyle, backgroundColor: '#DC2626', opacity: 0.5, cursor: 'not-allowed', padding: '4px 10px', fontSize: '12px' }
                              : { ...buttonStyle, backgroundColor: '#DC2626', padding: '4px 10px', fontSize: '12px' }
                          }
                        >
                          Désactiver
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* Section Équipe (invitations) */}
      <section style={{ marginTop: '32px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#1E293B', marginBottom: '20px' }}>
          Équipe
        </h2>

        {/* Formulaire d'invitation */}
        <div style={cardStyle}>
          <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#374151', marginBottom: '16px' }}>
            Inviter un collaborateur
          </h3>

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div style={{ marginBottom: '12px' }}>
              <label htmlFor="invite-email" style={labelStyle}>
                Adresse email
              </label>
              <input
                id="invite-email"
                type="email"
                {...register('email')}
                aria-label="Email du collaborateur à inviter"
                placeholder="collaborateur@exemple.fr"
                style={inputStyle}
              />
              {errors.email && <p style={errorStyle}>{errors.email.message}</p>}
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label htmlFor="invite-role" style={labelStyle}>
                Rôle
              </label>
              <select
                id="invite-role"
                {...register('role')}
                aria-label="Rôle du collaborateur"
                style={inputStyle}
              >
                <option value="">Sélectionner un rôle</option>
                <option value="idel">IDEL collaborateur</option>
                <option value="doctor">Médecin prescripteur</option>
              </select>
              {errors.role && <p style={errorStyle}>{errors.role.message}</p>}
            </div>

            {apiError && <p style={errorStyle}>{apiError}</p>}
            {successMessage && (
              <p style={{ color: '#16A34A', fontSize: '14px', marginBottom: '12px' }}>{successMessage}</p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              aria-label="Envoyer l'invitation"
              style={isSubmitting ? { ...buttonStyle, opacity: 0.6, cursor: 'not-allowed' } : buttonStyle}
            >
              {isSubmitting ? "Envoi en cours…" : "Envoyer l'invitation"}
            </button>
          </form>
        </div>

        {/* Liste des invitations */}
        <div style={{ ...cardStyle, marginTop: '20px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#374151', marginBottom: '16px' }}>
            Invitations envoyées
          </h3>

          {loadingList ? (
            <p style={{ color: '#94A3B8', fontSize: '14px' }}>Chargement…</p>
          ) : invitations.length === 0 ? (
            <p style={{ color: '#94A3B8', fontSize: '14px' }}>Aucune invitation envoyée pour le moment.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                  <th style={thStyle}>Email</th>
                  <th style={thStyle}>Rôle</th>
                  <th style={thStyle}>Statut</th>
                  <th style={thStyle}>Envoyée le</th>
                </tr>
              </thead>
              <tbody>
                {invitations.map((inv) => {
                  const statusInfo = STATUS_LABEL[inv.status] ?? { label: inv.status, color: '#6B7280' };
                  return (
                    <tr key={inv.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={tdStyle}>{inv.email}</td>
                      <td style={tdStyle}>{ROLE_LABEL[inv.role] ?? inv.role}</td>
                      <td style={tdStyle}>
                        <span style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: 600,
                          backgroundColor: `${statusInfo.color}20`,
                          color: statusInfo.color,
                        }}>
                          {statusInfo.label}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        {new Date(inv.createdAt).toLocaleDateString('fr-FR')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  backgroundColor: '#FFFFFF',
  borderRadius: '8px',
  padding: '24px',
  border: '1px solid #E2E8F0',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '14px',
  fontWeight: 500,
  color: '#374151',
  marginBottom: '4px',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  border: '1px solid #CBD5E1',
  borderRadius: '6px',
  fontSize: '14px',
  color: '#1E293B',
  backgroundColor: '#F8FAFC',
  boxSizing: 'border-box',
};

const buttonStyle: React.CSSProperties = {
  padding: '10px 20px',
  backgroundColor: '#2563EB',
  color: '#FFFFFF',
  border: 'none',
  borderRadius: '6px',
  fontSize: '14px',
  fontWeight: 600,
  cursor: 'pointer',
};

const errorStyle: React.CSSProperties = {
  color: '#DC2626',
  fontSize: '13px',
  marginTop: '4px',
  marginBottom: '8px',
};

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  fontSize: '12px',
  fontWeight: 600,
  color: '#64748B',
  padding: '8px 12px',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

const tdStyle: React.CSSProperties = {
  padding: '10px 12px',
  fontSize: '14px',
  color: '#374151',
};
