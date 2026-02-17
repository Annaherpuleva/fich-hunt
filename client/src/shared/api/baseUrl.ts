function normalizeApiBaseUrl(raw: string): string {
  const trimmed = String(raw || '').replace(/\/$/, '');
  return trimmed.replace(/\/api(?:\/v1)?$/, '');
}

export function getApiBaseUrlSync(): string {
  const viteEnv = (typeof import.meta !== 'undefined' ? ((import.meta as any).env || {}) : {}) as Record<string, string | undefined>;
  const nodeEnv = (typeof process !== 'undefined' ? (process as any).env || {} : {}) as Record<string, string | undefined>;
  const windowOrigin = typeof window !== 'undefined' ? window.location.origin : '';

  const raw =
    viteEnv.VITE_API_BASE_URL ||
    nodeEnv.VITE_API_BASE_URL ||
    nodeEnv.API_BASE_URL ||
    nodeEnv.REACT_APP_API_BASE_URL ||
    windowOrigin ||
    '';

  return normalizeApiBaseUrl(String(raw));
}

