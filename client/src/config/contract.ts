import idl from '../idl/cryptofish.json';
import { loadRuntimeConfig } from './runtimeConfig';

type ConnectionLike = { endpoint: string; commitment?: string };
type WalletLike = {
  publicKey?: { toBase58?: () => string };
  signTransaction?: (tx: unknown) => Promise<unknown>;
  signAllTransactions?: (txs: unknown[]) => Promise<unknown[]>;
};

const DEFAULT_PROGRAM_ID = '11111111111111111111111111111111';

type ProgramLike = {
  idl: unknown;
  programId: string;
  provider: {
    connection: ConnectionLike;
    wallet: WalletLike;
  };
};

export function getProgramIdFromConfig(cfg: { PROGRAM_ID?: string }) {
  const programIdStr = (cfg?.PROGRAM_ID || '').trim();
  if (!programIdStr) {
    return DEFAULT_PROGRAM_ID;
  }
  return programIdStr;
}

export async function getProgramId() {
  const cfg = await loadRuntimeConfig();
  return getProgramIdFromConfig(cfg);
}

export async function getProgram(connection?: ConnectionLike, wallet?: WalletLike): Promise<ProgramLike> {
  const cfg = await loadRuntimeConfig();
  const programId = getProgramIdFromConfig(cfg);
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
    programId,
    provider: {
      connection: conn,
      wallet: safeWallet,
    },
  };
}

export async function getConfig() {
  const cfg = await loadRuntimeConfig();
  return {
    rpcUrl: cfg.TON_RPC_URL || cfg.SOLANA_RPC_URL,
    programId: getProgramIdFromConfig(cfg),
    oceanPda: undefined,
    cluster: cfg.CLUSTER || 'devnet',
  };
}

export function deriveOceanPda(programId: string): string {
  return `ocean:${programId}`;
}
