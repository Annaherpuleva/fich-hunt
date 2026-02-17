type RuntimeConfig = {
  API_BASE_URL?: string;
  OCEAN_TON?: string;
  TON_RPC_URL?: string;
  SOLANA_RPC_URL?: string;
  PROGRAM_ID?: string;
  CLUSTER?: string;
};

let cachedConfig: RuntimeConfig | null = null;

const DEFAULT_PROGRAM_ID = '11111111111111111111111111111111';

function normalizeApiBaseUrl(raw: string | undefined): string {
  const trimmed = String(raw || '').replace(/\/$/, '');
  return trimmed.replace(/\/api(?:\/v1)?$/, '');
}

export async function loadRuntimeConfig(): Promise<RuntimeConfig> {
  if (cachedConfig) return cachedConfig;

  const viteEnv = (typeof import.meta !== 'undefined' ? ((import.meta as any).env || {}) : {}) as Record<string, string | undefined>;
  const nodeEnv = (typeof process !== 'undefined' ? (process as any).env || {} : {}) as Record<string, string | undefined>;
  const windowOrigin = typeof window !== 'undefined' ? window.location.origin : '';

  cachedConfig = {
    API_BASE_URL: normalizeApiBaseUrl(viteEnv.VITE_API_BASE_URL || nodeEnv.VITE_API_BASE_URL || nodeEnv.API_BASE_URL || nodeEnv.REACT_APP_API_BASE_URL || windowOrigin || ''),
    OCEAN_TON: viteEnv.VITE_OCEAN_TON || nodeEnv.VITE_OCEAN_TON || '',
    TON_RPC_URL: viteEnv.VITE_TON_RPC_URL || nodeEnv.VITE_TON_RPC_URL || nodeEnv.REACT_APP_TON_RPC_URL || nodeEnv.TON_RPC_URL || '',
    SOLANA_RPC_URL: nodeEnv.REACT_APP_SOLANA_RPC_URL || nodeEnv.SOLANA_RPC_URL || '',
    PROGRAM_ID:
      viteEnv.VITE_PROGRAM_ID ||
      nodeEnv.VITE_PROGRAM_ID ||
      nodeEnv.REACT_APP_PROGRAM_ID ||
      nodeEnv.PROGRAM_ID ||
      viteEnv.VITE_OCEAN_TON ||
      nodeEnv.VITE_OCEAN_TON ||
      DEFAULT_PROGRAM_ID,
    CLUSTER: nodeEnv.REACT_APP_CLUSTER || nodeEnv.CLUSTER || 'devnet',
  };

  return cachedConfig;
}
