import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * Base HTTP de l'app Next (origine seule, sans /api/v1).
 * Les chemins passés à apiClient commencent déjà par /api/v1/... ou /api/auth/...
 * Si EXPO_PUBLIC_API_URL se termine par /api/v1 (ancienne doc), on le retire pour éviter
 * des URLs dupliquées du type .../api/v1/api/v1/patients (404 silencieux côté hooks).
 *
 * Sur émulateur Android, localhost = la VM, pas le PC : en dev on pointe vers 10.0.2.2 (alias hôte).
 */
export function getApiBaseUrl(): string {
  let raw = process.env['EXPO_PUBLIC_API_URL'] ?? 'http://localhost:3000';
  raw = raw.trim();

  if (
    typeof __DEV__ !== 'undefined' &&
    __DEV__ &&
    Platform.OS === 'android'
  ) {
    try {
      const withProto = raw.includes('://') ? raw : `http://${raw}`;
      const u = new URL(withProto);
      if (u.hostname === 'localhost' || u.hostname === '127.0.0.1') {
        u.hostname = '10.0.2.2';
        raw = `${u.protocol}//${u.host}${u.pathname === '/' ? '' : u.pathname}`;
      }
    } catch {
      // garder raw tel quel
    }
  }

  return raw
    .replace(/\/+$/, '')
    .replace(/\/api\/v1$/i, '')
    .replace(/\/api$/i, '');
}

const API_BASE_URL = getApiBaseUrl();
const JWT_KEY = 'kura_jwt';

interface ApiResponse<T> {
  data: T;
}

interface ApiError {
  response?: { status: number };
  message?: string;
}

let unauthorizedHandler: (() => void) | null = null;

export function setUnauthorizedHandler(handler: () => void): void {
  unauthorizedHandler = handler;
}

function handleUnauthorized(): void {
  unauthorizedHandler?.();
}

async function authHeaders(extra?: Record<string, string>): Promise<Record<string, string>> {
  const token = await SecureStore.getItemAsync(JWT_KEY);
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

interface PostOptions {
  headers?: Record<string, string>;
  /** Ne pas déclencher unauthorizedHandler si 401 (ex: login, refresh) */
  skipUnauthorizedHandler?: boolean;
}

async function post<T>(path: string, body: unknown, options?: PostOptions): Promise<ApiResponse<T>> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: await authHeaders(options?.headers),
    body: JSON.stringify(body),
  });

  if (response.status === 401 && !options?.skipUnauthorizedHandler) {
    handleUnauthorized();
  }

  if (!response.ok) {
    const error: ApiError = { response: { status: response.status } };
    throw error;
  }

  const data = await response.json() as T;
  return { data };
}

interface GetOptions {
  headers?: Record<string, string>;
  skipUnauthorizedHandler?: boolean;
}

async function get<T>(path: string, options?: GetOptions): Promise<ApiResponse<T>> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'GET',
    headers: await authHeaders(options?.headers),
  });

  if (response.status === 401 && !options?.skipUnauthorizedHandler) {
    handleUnauthorized();
  }

  if (!response.ok) {
    const error: ApiError = { response: { status: response.status } };
    throw error;
  }

  const data = await response.json() as T;
  return { data };
}

async function patch<T>(path: string, body: unknown): Promise<ApiResponse<T>> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'PATCH',
    headers: await authHeaders(),
    body: JSON.stringify(body),
  });

  if (response.status === 401) {
    handleUnauthorized();
  }

  if (!response.ok) {
    const error: ApiError = { response: { status: response.status } };
    throw error;
  }

  const data = await response.json() as T;
  return { data };
}

export const apiClient = { post, get, patch };
