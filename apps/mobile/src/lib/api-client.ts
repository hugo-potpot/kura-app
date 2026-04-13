const API_BASE_URL = process.env['EXPO_PUBLIC_API_URL'] ?? 'http://localhost:3000';

interface ApiResponse<T> {
  data: T;
}

interface ApiError {
  response?: { status: number };
  message?: string;
}

// Global 401 handler — registered by _layout.tsx to handle session revocation
let unauthorizedHandler: (() => void) | null = null;

export function setUnauthorizedHandler(handler: () => void): void {
  unauthorizedHandler = handler;
}

function handleUnauthorized(): void {
  unauthorizedHandler?.();
}

async function post<T>(path: string, body: unknown, headers?: Record<string, string>): Promise<ApiResponse<T>> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
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

async function get<T>(path: string, headers?: Record<string, string>): Promise<ApiResponse<T>> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
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

export const apiClient = { post, get };
