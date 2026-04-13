'use client';

import { useState } from 'react';

interface SessionEntry {
  id: string;
  userId: string;
  expiresAt: string;
  createdAt: string;
  userAgent?: string | null;
  ipAddress?: string | null;
}

export default function SessionsPage(): React.JSX.Element {
  const [userId, setUserId] = useState('');
  const [sessions, setSessions] = useState<SessionEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSearch = async (): Promise<void> => {
    if (!userId.trim()) return;
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await fetch(`/api/v1/admin/sessions?userId=${encodeURIComponent(userId.trim())}`);
      const json = (await res.json()) as { data?: SessionEntry[]; error?: { message: string } };

      if (!res.ok || json.error) {
        setError(json.error?.message ?? 'Erreur lors du chargement des sessions');
        setSessions([]);
        return;
      }

      setSessions(json.data ?? []);
    } catch {
      setError('Erreur réseau. Vérifiez votre connexion.');
      setSessions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevoke = async (sessionId: string): Promise<void> => {
    const confirmed = window.confirm("Révoquer cette session ? L'utilisateur sera déconnecté de cet appareil.");
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/v1/admin/sessions/${sessionId}`, { method: 'DELETE' });
      if (res.ok) {
        setSessions((prev) => prev.filter((s) => s.id !== sessionId));
        setSuccessMessage('Session révoquée avec succès.');
      } else {
        const json = (await res.json()) as { error?: { message: string } };
        setError(json.error?.message ?? 'Erreur lors de la révocation');
      }
    } catch {
      setError('Erreur réseau lors de la révocation.');
    }
  };

  return (
    <div>
      <h1 style={styles.title}>Sessions IDEL</h1>
      <p style={styles.subtitle}>Recherchez un utilisateur par son ID pour gérer ses sessions actives.</p>

      <div style={styles.searchRow}>
        <input
          type="text"
          placeholder="ID utilisateur (ex: 01ARZ3NDEKTSV4RRFFQ69G5FAV)"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') void handleSearch(); }}
          style={styles.input}
          aria-label="ID de l'utilisateur"
        />
        <button
          onClick={() => void handleSearch()}
          disabled={isLoading || !userId.trim()}
          style={styles.searchButton}
          aria-label="Rechercher les sessions"
        >
          {isLoading ? 'Chargement…' : 'Rechercher'}
        </button>
      </div>

      {error && (
        <p role="alert" style={styles.errorText}>{error}</p>
      )}
      {successMessage && (
        <p role="status" style={styles.successText}>{successMessage}</p>
      )}

      {sessions.length > 0 && (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>ID Session</th>
              <th style={styles.th}>Créée le</th>
              <th style={styles.th}>Expire le</th>
              <th style={styles.th}>User Agent</th>
              <th style={styles.th}>IP</th>
              <th style={styles.th}>Action</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((s) => (
              <tr key={s.id} style={styles.tr}>
                <td style={styles.td}>
                  <code style={styles.code}>{s.id.slice(0, 12)}…</code>
                </td>
                <td style={styles.td}>{new Date(s.createdAt).toLocaleString('fr-FR')}</td>
                <td style={styles.td}>{new Date(s.expiresAt).toLocaleString('fr-FR')}</td>
                <td style={styles.td}>{s.userAgent ?? '—'}</td>
                <td style={styles.td}>{s.ipAddress ?? '—'}</td>
                <td style={styles.td}>
                  <button
                    onClick={() => void handleRevoke(s.id)}
                    style={styles.revokeButton}
                    aria-label={`Révoquer la session ${s.id.slice(0, 8)}`}
                  >
                    Révoquer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {sessions.length === 0 && !isLoading && userId && !error && (
        <p style={styles.emptyText}>Aucune session active trouvée pour cet utilisateur.</p>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  title: { fontSize: 22, fontWeight: 'bold', color: '#1E3A5F', marginBottom: 4 },
  subtitle: { color: '#5C8DAA', fontSize: 14, marginBottom: 20 },
  searchRow: { display: 'flex', gap: 12, marginBottom: 16 },
  input: {
    flex: 1,
    padding: '10px 14px',
    border: '1px solid #C8DFF0',
    borderRadius: 8,
    fontSize: 14,
    outline: 'none',
  },
  searchButton: {
    padding: '10px 20px',
    backgroundColor: '#3949AB',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontSize: 14,
    cursor: 'pointer',
  },
  errorText: { color: '#E53935', fontSize: 13, marginBottom: 12 },
  successText: { color: '#2E7D32', fontSize: 13, marginBottom: 12 },
  table: { width: '100%', borderCollapse: 'collapse', marginTop: 8 },
  th: {
    textAlign: 'left',
    padding: '10px 12px',
    backgroundColor: '#E8F0F8',
    fontSize: 12,
    fontWeight: 700,
    color: '#5C8DAA',
    letterSpacing: '0.5px',
    borderBottom: '1px solid #C8DFF0',
  },
  tr: { borderBottom: '1px solid #EEF4FA' },
  td: { padding: '10px 12px', fontSize: 13, color: '#1E3A5F', verticalAlign: 'middle' },
  code: { backgroundColor: '#EEF4FA', padding: '2px 6px', borderRadius: 4, fontFamily: 'monospace' },
  revokeButton: {
    padding: '6px 14px',
    backgroundColor: 'transparent',
    color: '#E53935',
    border: '1px solid #E53935',
    borderRadius: 6,
    fontSize: 12,
    cursor: 'pointer',
  },
  emptyText: { color: '#94A3B8', fontSize: 14, marginTop: 16, textAlign: 'center' },
};
