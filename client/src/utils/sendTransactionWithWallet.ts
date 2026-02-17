import { Connection, Transaction, PublicKey, LAMPORTS_PER_SOL } from '@/shims/solanaWeb3';
import * as anchor from '@/shims/anchor';
import { loadRuntimeConfig } from '../config/runtimeConfig';
import { createCompatibleWallet } from './walletSignFix';
import { getOceanService } from '../config/runtimeGame';

const INSUFFICIENT_FUNDS_ERROR = 'Error Number: 6009';
const TON_ADDRESS_RE = /^(EQ|UQ)[A-Za-z0-9_-]{30,}$/;

export interface SendTransactionParams {
  methodCall: (program: any) => any;
  publicKey: PublicKey;
  signTransaction: (tx: Transaction) => Promise<Transaction>;
  signAllTransactions?: (txs: Transaction[]) => Promise<Transaction[]>;
  useManualSign?: boolean;
  skipPreflight?: boolean;
  requiredLamports?: number;
}

const extractFeeLamports = (feeResponse: any): number => {
  if (typeof feeResponse === 'number') return feeResponse;
  if (typeof feeResponse?.value === 'number') return feeResponse.value;
  return 0;
};

const assertSufficientBalance = async ({
  connection,
  tx,
  publicKey,
  requiredLamports,
}: {
  connection: Connection;
  tx: Transaction;
  publicKey: PublicKey;
  requiredLamports: number;
}) => {
  const feeResponse = await connection.getFeeForMessage(tx.compileMessage(), 'confirmed');
  const feeLamports = extractFeeLamports(feeResponse);
  const balanceLamports = await connection.getBalance(publicKey, 'confirmed');
  const requiredTotalLamports = requiredLamports + feeLamports;
  const balanceSol = balanceLamports / LAMPORTS_PER_SOL;
  const requiredTotalSol = Math.ceil((requiredTotalLamports * 100) / LAMPORTS_PER_SOL) / 100;

  if (balanceSol < requiredTotalSol) {
    throw new Error(INSUFFICIENT_FUNDS_ERROR);
  }
};

export async function sendTransactionWithWallet({
  methodCall,
  publicKey,
  signTransaction,
  signAllTransactions,
  useManualSign = false,
  skipPreflight = false,
  requiredLamports,
}: SendTransactionParams): Promise<string> {
  const cfg = await loadRuntimeConfig();
  const connection = new Connection(cfg.SOLANA_RPC_URL, 'confirmed');
  const walletAddress = publicKey?.toBase58?.() || '';
  const isTonWallet = TON_ADDRESS_RE.test(walletAddress);
  const balanceCheckLamports =
    typeof requiredLamports === 'number' && Number.isFinite(requiredLamports)
      ? Math.max(0, Math.floor(requiredLamports))
      : 0;
  const shouldCheckBalance = !isTonWallet && balanceCheckLamports > 0;

  if (useManualSign) {
    const program: any = await getOceanService(undefined, {} as any);
    const methodBuilder = methodCall(program);
    const tx: Transaction = await methodBuilder.transaction();

    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
    tx.recentBlockhash = blockhash;
    tx.feePayer = publicKey;

    if (shouldCheckBalance) {
      await assertSufficientBalance({
        connection,
        tx,
        publicKey,
        requiredLamports: balanceCheckLamports,
      });
    }

    const compatWallet = createCompatibleWallet(publicKey, signTransaction, signAllTransactions, true);
    const signedTx = await compatWallet.signTransaction!(tx);

    const rawTx = signedTx.serialize();
    const sig = await connection.sendRawTransaction(rawTx, { skipPreflight });
    await connection.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight }, 'confirmed');

    return sig;
  }

  const wallet = { publicKey, signTransaction, signAllTransactions } as any;
  const program: any = await getOceanService(undefined, wallet);
  const methodBuilder = methodCall(program);

  if (shouldCheckBalance) {
    const tx: Transaction = await methodBuilder.transaction();
    const { blockhash } = await connection.getLatestBlockhash('confirmed');
    tx.recentBlockhash = blockhash;
    tx.feePayer = publicKey;

    await assertSufficientBalance({
      connection,
      tx,
      publicKey,
      requiredLamports: balanceCheckLamports,
    });
  }

  const rpcOpts: any = skipPreflight ? { skipPreflight: true } : undefined;
  return methodBuilder.rpc(rpcOpts);
}
