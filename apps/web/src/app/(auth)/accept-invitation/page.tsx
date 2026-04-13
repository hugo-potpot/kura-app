'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

interface InvitationInfo {
  valid: true;
  role: string;
  email: string;
  expiresAt: string;
}

interface InvitationInvalid {
  valid: false;
  reason: 'EXPIRED' | 'NOT_FOUND' | 'ALREADY_USED';
}

type InvitationState = InvitationInfo | InvitationInvalid | null;

function AcceptInvitationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [invitation, setInvitation] = useState<InvitationState>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    fetch(`/api/v1/invitations/accept?token=${encodeURIComponent(token)}`)
      .then((res) => res.json())
      .then((data: { data: InvitationInfo | InvitationInvalid }) => {
        setInvitation(data.data);
      })
      .catch(() => {
        setInvitation({ valid: false, reason: 'NOT_FOUND' });
      })
      .finally(() => setLoading(false));
  }, [token]);

  async function handleAccept() {
    if (!token) return;
    setAccepting(true);
    setError(null);

    try {
      const res = await fetch('/api/v1/invitations/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      const data = await res.json() as { data?: { accepted: boolean }; error?: { code: string; message: string } };

      if (!res.ok) {
        if (data.error?.code === 'UNAUTHORIZED') {
          router.push(`/login?callbackUrl=${encodeURIComponent(`/accept-invitation?token=${token}`)}`);
          return;
        }
        setError(data.error?.message ?? "Une erreur est survenue");
        return;
      }

      router.replace('/dashboard');
    } catch {
      setError("Une erreur est survenue, veuillez réessayer");
    } finally {
      setAccepting(false);
    }
  }

  const roleLabel = (role: string) => role === 'idel' ? 'IDEL collaborateur' : "Médecin prescripteur";

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <p style={styles.subtitle}>Vérification en cours…</p>
        </div>
      </div>
    );
  }

  if (!token || !invitation) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h1 style={styles.title}>KURA</h1>
          <p style={styles.errorText}>"Lien d&apos;invitation invalide"</p>
        </div>
      </div>
    );
  }

  if (!invitation.valid) {
    const messages: Record<string, string> = {
      EXPIRED: "Cette invitation a expiré — contactez votre admin pour en recevoir une nouvelle",
      ALREADY_USED: "Cette invitation a déjà été acceptée — connectez-vous",
      NOT_FOUND: "Lien d'invitation introuvable ou invalide",
    };
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h1 style={styles.title}>KURA</h1>
          <p style={styles.errorText}>{messages[invitation.reason] ?? "Lien invalide"}</p>
          {invitation.reason === 'ALREADY_USED' && (
            <a href="/login" style={styles.link}>Se connecter</a>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>KURA</h1>
        <h2 style={styles.heading}>Rejoindre une structure</h2>
        <p style={styles.subtitle}>
          {"Vous avez été invité à rejoindre une structure KURA en tant que "}
          <strong>{roleLabel(invitation.role)}</strong>.
        </p>
        <p style={styles.email}>{invitation.email}</p>

        {error && <p style={styles.errorText}>{error}</p>}

        <button
          onClick={handleAccept}
          disabled={accepting}
          style={accepting ? { ...styles.button, ...styles.buttonDisabled } : styles.button}
          aria-label="Rejoindre la structure KURA"
        >
          {accepting ? 'Connexion en cours…' : 'Rejoindre la structure'}
        </button>

        <p style={styles.hint}>
          {"Pas encore de compte ? "}
          <a
            href={`/login?callbackUrl=${encodeURIComponent(`/accept-invitation?token=${token}`)}`}
            style={styles.link}
          >
            Se connecter / Créer un compte
          </a>
        </p>
      </div>
    </div>
  );
}

export default function AcceptInvitationPage() {
  return (
    <Suspense>
      <AcceptInvitationContent />
    </Suspense>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F4F8',
    padding: '24px',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    padding: '40px',
    width: '100%',
    maxWidth: '440px',
    boxShadow: '0 4px 24px rgba(0, 0, 0, 0.08)',
  },
  title: {
    fontSize: '28px',
    fontWeight: 700,
    color: '#2563EB',
    marginBottom: '8px',
    textAlign: 'center',
  },
  heading: {
    fontSize: '20px',
    fontWeight: 600,
    color: '#1E293B',
    marginBottom: '12px',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: '15px',
    color: '#475569',
    marginBottom: '8px',
    textAlign: 'center',
    lineHeight: '1.5',
  },
  email: {
    fontSize: '14px',
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: '24px',
  },
  button: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#2563EB',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer',
    marginBottom: '16px',
  },
  buttonDisabled: {
    backgroundColor: '#93C5FD',
    cursor: 'not-allowed',
  },
  errorText: {
    color: '#DC2626',
    fontSize: '14px',
    textAlign: 'center',
    marginBottom: '16px',
  },
  hint: {
    fontSize: '14px',
    color: '#64748B',
    textAlign: 'center',
  },
  link: {
    color: '#2563EB',
    textDecoration: 'underline',
  },
};
