import idl from '../idl/cryptofish.json';
import { loadRuntimeConfig } from './runtimeConfig';

type ConnectionLike = { endpoint: string; commitment?: string };
type WalletLike = {
  publicKey?: { toBase58?: () => string };
  signTransaction?: (tx: unknown) => Promise<unknown>;
  signAllTransactions?: (txs: unknown[]) => Promise<unknown[]>;
};

const DEFAULT_SERVICE_ID = '11111111111111111111111111111111';

type OceanServiceLike = {
  idl: unknown;
  serviceId: string;
  programId: string;
  provider: {
    connection: ConnectionLike;
    wallet: WalletLike;
  };
};

export function getServiceIdFromConfig(cfg: { SERVICE_ID?: string; PROGRAM_ID?: string; OCEAN_TON?: string }) {
  const serviceIdStr = (cfg?.SERVICE_ID || cfg?.PROGRAM_ID || cfg?.OCEAN_TON || '').trim();
  if (!serviceIdStr) {
    return DEFAULT_SERVICE_ID;
  }
  return serviceIdStr;
}

export async function getServiceId() {
  const cfg = await loadRuntimeConfig();
  return getServiceIdFromConfig(cfg);
}

export async function getOceanService(connection?: ConnectionLike, wallet?: WalletLike): Promise<OceanServiceLike> {
  const cfg = await loadRuntimeConfig();
  const serviceId = getServiceIdFromConfig(cfg);
  const rpcEndpoint = cfg.TON_RPC_URL || cfg.SOLANA_RPC_URL || '';
  const conn: ConnectionLike = connection || { endpoint: rpcEndpoint, commitment: 'confirmed' };
  const safeWallet: WalletLike = wallet || {};

  if (!safeWallet.publicKey) {
    safeWallet.publicKey = { toBase58: () => '11111111111111111111111111111111' };
    safeWallet.signTransaction = async (tx: unknown) => tx;
    safeWallet.signAllTransactions = async (txs: unknown[]) => txs;
  }

  return {
    idl,
    serviceId,
    // compat alias for legacy call-sites during migration window
    programId: serviceId,
    provider: {
      connection: conn,
      wallet: safeWallet,
    },
  };
}

export async function getOceanConfig() {
  const cfg = await loadRuntimeConfig();
  return {
    rpcUrl: cfg.TON_RPC_URL || cfg.SOLANA_RPC_URL,
    serviceId: getServiceIdFromConfig(cfg),
    tenantId: cfg.TENANT_ID || cfg.OCEAN_TON,
    oceanPda: undefined,
    cluster: cfg.CLUSTER || 'devnet',
  };
}

export function deriveOceanServiceKey(serviceId: string): string {
  return `ocean:${serviceId}`;
}
