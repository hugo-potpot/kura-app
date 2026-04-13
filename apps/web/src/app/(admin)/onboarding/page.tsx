'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const StructureSchema = z.object({
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  address: z.string().min(5, "L'adresse doit contenir au moins 5 caractères"),
  siret: z
    .string()
    .regex(/^\d{14}$/, 'Le SIRET doit contenir 14 chiffres')
    .optional()
    .or(z.literal(''))
    .transform((v) => (v === '' ? undefined : v)),
});

type StructureFormData = z.input<typeof StructureSchema>;

interface ApiResponse {
  data?: { structure: { id: string; name: string }; warning?: string };
  error?: { code: string; message: string };
}

export default function OnboardingPage(): React.JSX.Element {
  const router = useRouter();
  const [siretWarning, setSiretWarning] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<StructureFormData>({
    resolver: zodResolver(StructureSchema),
  });

  const onSubmit = async (data: StructureFormData): Promise<void> => {
    setApiError(null);
    setSiretWarning(false);

    try {
      const res = await fetch('/api/v1/structures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const json = (await res.json()) as ApiResponse;

      if (!res.ok || json.error) {
        setApiError(json.error?.message ?? 'Une erreur est survenue. Réessayez.');
        return;
      }

      if (json.data?.warning === 'SIRET_EXISTS') {
        setSiretWarning(true);
        // Laisser 2s pour que l'utilisateur lise l'avertissement, puis rediriger
        setTimeout(() => { router.push('/dashboard'); }, 2000);
        return;
      }

      router.push('/dashboard');
    } catch {
      setApiError('Erreur réseau. Vérifiez votre connexion et réessayez.');
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.header}>
          <span style={styles.logo}>KURA</span>
          <h1 style={styles.title}>Créez votre structure</h1>
          <p style={styles.subtitle}>
            Renseignez les informations de votre cabinet ou réseau IDEL
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate style={styles.form}>
          <div style={styles.field}>
            <label htmlFor="name" style={styles.label}>
              Nom du cabinet *
            </label>
            <input
              id="name"
              type="text"
              placeholder="Cabinet Infirmier du Centre"
              aria-label="Nom du cabinet"
              aria-required="true"
              aria-invalid={!!errors.name}
              style={errors.name ? { ...styles.input, ...styles.inputError } : styles.input}
              {...register('name')}
            />
            {errors.name && (
              <p role="alert" style={styles.fieldError}>{errors.name.message}</p>
            )}
          </div>

          <div style={styles.field}>
            <label htmlFor="address" style={styles.label}>
              Adresse *
            </label>
            <input
              id="address"
              type="text"
              placeholder="12 rue de la Paix, 75001 Paris"
              aria-label="Adresse du cabinet"
              aria-required="true"
              aria-invalid={!!errors.address}
              style={errors.address ? { ...styles.input, ...styles.inputError } : styles.input}
              {...register('address')}
            />
            {errors.address && (
              <p role="alert" style={styles.fieldError}>{errors.address.message}</p>
            )}
          </div>

          <div style={styles.field}>
            <label htmlFor="siret" style={styles.label}>
              SIRET <span style={styles.optional}>(optionnel)</span>
            </label>
            <input
              id="siret"
              type="text"
              placeholder="12345678901234"
              aria-label="Numéro SIRET (optionnel)"
              aria-invalid={!!errors.siret}
              maxLength={14}
              style={errors.siret ? { ...styles.input, ...styles.inputError } : styles.input}
              {...register('siret')}
            />
            {errors.siret && (
              <p role="alert" style={styles.fieldError}>{errors.siret.message}</p>
            )}
          </div>

          {siretWarning && (
            <div role="status" style={styles.warning}>
              ⚠️ Une structure avec ce SIRET semble déjà exister. Votre structure a quand même été créée.
            </div>
          )}

          {apiError && (
            <div role="alert" style={styles.error}>
              {apiError}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            aria-label="Créer ma structure et accéder au tableau de bord"
            style={isSubmitting ? { ...styles.button, ...styles.buttonDisabled } : styles.button}
          >
            {isSubmitting ? 'Création en cours…' : 'Créer ma structure'}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#F0F4F8',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    padding: '40px',
    width: '100%',
    maxWidth: '480px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
  },
  header: {
    marginBottom: '32px',
    textAlign: 'center',
  },
  logo: {
    display: 'inline-block',
    fontSize: '22px',
    fontWeight: 'bold',
    color: '#00897B',
    letterSpacing: '2px',
    marginBottom: '16px',
  },
  title: {
    fontSize: '22px',
    fontWeight: 'bold',
    color: '#1E3A5F',
    margin: '0 0 8px',
  },
  subtitle: {
    fontSize: '14px',
    color: '#5C8DAA',
    margin: 0,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#1E3A5F',
    letterSpacing: '0.3px',
  },
  optional: {
    fontWeight: 400,
    color: '#94A3B8',
    fontSize: '12px',
  },
  input: {
    padding: '10px 14px',
    border: '1px solid #C8DFF0',
    borderRadius: '8px',
    fontSize: '14px',
    color: '#1E3A5F',
    outline: 'none',
    minHeight: '44px',
  },
  inputError: {
    borderColor: '#E53935',
  },
  fieldError: {
    color: '#E53935',
    fontSize: '12px',
    margin: 0,
  },
  warning: {
    backgroundColor: '#FFF8E1',
    border: '1px solid #FFB300',
    borderRadius: '8px',
    padding: '12px 16px',
    fontSize: '13px',
    color: '#7B5800',
  },
  error: {
    backgroundColor: '#FFEBEE',
    border: '1px solid #E53935',
    borderRadius: '8px',
    padding: '12px 16px',
    fontSize: '13px',
    color: '#C62828',
  },
  button: {
    backgroundColor: '#3949AB',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '8px',
    padding: '12px 24px',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
    minHeight: '48px',
  },
  buttonDisabled: {
    backgroundColor: '#90A4AE',
    cursor: 'not-allowed',
  },
};
