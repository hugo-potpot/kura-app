'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

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
  doctor: "Médecin prescripteur",
};

export default function ProfilePage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormData>({ resolver: zodResolver(ProfileSchema) });

  useEffect(() => {
    void authClient.getSession().then(({ data }) => {
      if (data?.user) {
        reset({
          name: data.user.name ?? '',
          image: (data.user.image as string | undefined) ?? '',
        });
      }
    });
  }, [reset]);

  const fetchTeam = useCallback(async () => {
    setLoadingMembers(true);
    try {
      const res = await fetch('/api/v1/team');
      const data = await res.json() as { data?: { members: TeamMember[] } };
      setMembers(data.data?.members ?? []);
    } catch {
      // silent
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
      setErrorMsg(result.error.message ?? "Une erreur est survenue");
      return;
    }

    setSuccessMsg("Profil mis à jour avec succès");
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800">Mon Profil</h1>

      {/* Section profil */}
      <section style={{ marginTop: '32px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#1E293B', marginBottom: '20px' }}>
          Informations personnelles
        </h2>

        <div style={cardStyle}>
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div style={{ marginBottom: '12px' }}>
              <label htmlFor="profile-name" style={labelStyle}>
                Nom complet
              </label>
              <input
                id="profile-name"
                type="text"
                {...register('name')}
                aria-label="Nom complet"
                style={inputStyle}
              />
              {errors.name && <p style={errorStyle}>{errors.name.message}</p>}
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label htmlFor="profile-image" style={labelStyle}>
                URL de photo de profil (optionnel)
              </label>
              <input
                id="profile-image"
                type="url"
                {...register('image')}
                aria-label="URL de photo de profil"
                placeholder="https://exemple.fr/photo.jpg"
                style={inputStyle}
              />
              {errors.image && <p style={errorStyle}>{errors.image.message}</p>}
            </div>

            {errorMsg && <p style={errorStyle}>{errorMsg}</p>}
            {successMsg && (
              <p style={{ color: '#16A34A', fontSize: '14px', marginBottom: '12px' }}>{successMsg}</p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              aria-label="Enregistrer le profil"
              style={isSubmitting ? { ...buttonStyle, opacity: 0.6, cursor: 'not-allowed' } : buttonStyle}
            >
              {isSubmitting ? "Enregistrement…" : "Enregistrer"}
            </button>
          </form>
        </div>
      </section>

      {/* Section équipe */}
      <section style={{ marginTop: '32px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#1E293B', marginBottom: '20px' }}>
          Mon équipe
        </h2>

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
                        {ROLE_LABEL[m.role] ?? m.role}
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
                  </tr>
                ))}
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
