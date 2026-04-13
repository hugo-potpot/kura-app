'use client';

import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const resetPasswordSchema = z
  .object({
    password: z.string().min(12, 'Minimum 12 caractères'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  });

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage(): React.JSX.Element {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  if (!token) {
    return (
      <main style={styles.container}>
        <p role="alert" style={styles.errorText}>
          Lien invalide.
        </p>
        <a href="/login" style={styles.link}>
          Demander un nouveau lien
        </a>
      </main>
    );
  }

  if (successMessage) {
    return (
      <main style={styles.container}>
        <p role="status" style={styles.successText}>
          {successMessage}
        </p>
        <a href="/login" style={styles.link}>
          Se reconnecter
        </a>
      </main>
    );
  }

  const onSubmit = async (data: ResetPasswordFormData): Promise<void> => {
    setIsSubmitting(true);
    setApiError(null);
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword: data.password, token }),
      });

      if (response.ok) {
        setSuccessMessage('Mot de passe mis à jour — vous pouvez vous reconnecter.');
      } else {
        setApiError('Lien expiré, veuillez en demander un nouveau.');
      }
    } catch {
      setApiError('Une erreur réseau est survenue. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main style={styles.container}>
      <h1 style={styles.title}>Nouveau mot de passe</h1>

      {apiError && (
        <>
          <p role="alert" style={styles.errorText}>
            {apiError}
          </p>
          <button
            type="button"
            onClick={() => router.push('/login')}
            style={styles.secondaryButton}
          >
            Renvoyer un lien
          </button>
        </>
      )}

      {!apiError && (
        <form onSubmit={handleSubmit(onSubmit)} style={styles.form} noValidate>
          <div style={styles.field}>
            <label htmlFor="password" style={styles.label}>
              Nouveau mot de passe
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              style={styles.input}
              aria-describedby={errors.password ? 'password-error' : undefined}
              {...register('password')}
            />
            {errors.password && (
              <span id="password-error" role="alert" style={styles.fieldError}>
                {errors.password.message}
              </span>
            )}
          </div>

          <div style={styles.field}>
            <label htmlFor="confirmPassword" style={styles.label}>
              Confirmer le mot de passe
            </label>
            <input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              style={styles.input}
              aria-describedby={errors.confirmPassword ? 'confirm-error' : undefined}
              {...register('confirmPassword')}
            />
            {errors.confirmPassword && (
              <span id="confirm-error" role="alert" style={styles.fieldError}>
                {errors.confirmPassword.message}
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            style={styles.submitButton}
            aria-label="Réinitialiser le mot de passe"
          >
            {isSubmitting ? 'Mise à jour...' : 'Réinitialiser le mot de passe'}
          </button>
        </form>
      )}
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: 400,
    margin: '80px auto',
    padding: '0 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  label: {
    fontWeight: 500,
    fontSize: 14,
  },
  input: {
    padding: '10px 12px',
    border: '1px solid #ccc',
    borderRadius: 6,
    fontSize: 16,
    minHeight: 48,
  },
  fieldError: {
    color: '#E53935',
    fontSize: 13,
  },
  errorText: {
    color: '#E53935',
    fontWeight: 500,
  },
  successText: {
    color: '#2E7D32',
    fontWeight: 500,
  },
  submitButton: {
    padding: '12px 24px',
    backgroundColor: '#3949AB',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    fontSize: 16,
    cursor: 'pointer',
    minHeight: 48,
  },
  secondaryButton: {
    padding: '12px 24px',
    backgroundColor: 'transparent',
    color: '#3949AB',
    border: '1px solid #3949AB',
    borderRadius: 6,
    fontSize: 16,
    cursor: 'pointer',
    minHeight: 48,
  },
  link: {
    color: '#3949AB',
    textDecoration: 'underline',
  },
};
