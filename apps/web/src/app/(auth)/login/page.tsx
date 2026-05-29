'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authClient } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const loginSchema = z.object({
  email: z.string().email('Adresse email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage(): React.JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') ?? '/dashboard';
  const errorParam = searchParams.get('error');

  const SESSION_ERRORS: Record<string, string> = {
    session_expired: 'Votre session a expiré. Veuillez vous reconnecter.',
    account_disabled: 'Votre compte a été désactivé. Contactez votre administrateur.',
  };
  const sessionError = errorParam ? (SESSION_ERRORS[errorParam] ?? null) : null;

  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData): Promise<void> => {
    setIsSubmitting(true);
    setApiError(null);

    const { error } = await authClient.signIn.email({
      email: data.email,
      password: data.password,
      callbackURL: callbackUrl,
    });

    setIsSubmitting(false);

    if (error) {
      if (!error.status) {
        setApiError('Impossible de se connecter au serveur. Vérifiez votre connexion internet.');
      } else {
        setApiError('Email ou mot de passe incorrect.');
      }
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  };

  return (
    <div className="flex min-h-screen">
      {/* Panneau gauche — branding (masqué sur mobile) */}
      <div className="relative hidden flex-col items-center justify-center bg-gradient-to-b from-teal-700 to-teal-900 px-12 md:flex md:w-1/2">
        <div className="flex flex-col items-center gap-4">
          <span className="text-5xl font-bold tracking-tight text-white">KURA</span>
          <div className="h-1 w-12 rounded bg-teal-400/50" />
          <p className="text-center text-lg text-teal-200">Simplifiez votre quotidien d&apos;IDEL</p>
        </div>
        <p className="absolute bottom-8 text-xs text-teal-300/60">© 2025 KURA</p>
      </div>

      {/* Panneau droit — formulaire */}
      <div className="flex flex-1 flex-col justify-center bg-white px-8 py-16">
        <div className="mx-auto w-full max-w-md">
          {/* Logo mobile uniquement */}
          <div className="mb-8 text-center md:hidden">
            <span className="text-3xl font-bold tracking-tight text-teal-700">KURA</span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-gray-900">Bienvenue</h1>
            <p className="mt-1 text-sm text-gray-500">Connectez-vous à votre espace</p>
          </div>

          {sessionError && (
            <div
              role="alert"
              className="mb-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700"
            >
              {sessionError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                aria-describedby={errors.email ? 'email-error' : undefined}
                aria-invalid={!!errors.email}
                {...register('email')}
              />
              {errors.email && (
                <p id="email-error" role="alert" className="text-xs text-red-600">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Mot de passe</Label>
                <a href="/forgot-password" className="text-xs text-teal-600 hover:underline">
                  Mot de passe oublié ?
                </a>
              </div>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                aria-describedby={errors.password ? 'password-error' : undefined}
                aria-invalid={!!errors.password}
                {...register('password')}
              />
              {errors.password && (
                <p id="password-error" role="alert" className="text-xs text-red-600">
                  {errors.password.message}
                </p>
              )}
            </div>

            {apiError && (
              <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {apiError}
              </div>
            )}

            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-10 w-full bg-teal-700 text-white hover:bg-teal-800"
            >
              {isSubmitting ? 'Connexion…' : 'Se connecter'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}