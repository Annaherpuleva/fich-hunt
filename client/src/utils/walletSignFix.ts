import { Transaction, VersionedTransaction } from '@/shims/solanaWeb3';

function getManualSignProvider(): any {
  if (typeof window === 'undefined') return null;
  const w = window as any;
  return w.trustwallet?.solana || (w.solana?.isTrust ? w.solana : null);
}

async function signWithProvider(tx: Transaction): Promise<Transaction | null> {
  const provider = getManualSignProvider();
  if (!provider) return null;

  try {
    if (typeof provider.signTransaction === 'function') {
      const signed = await provider.signTransaction(tx);

      if (signed) {
        if (typeof signed.serialize === 'function') {
          try {
            const signedBytes = signed.serialize();
            return Transaction.from(signedBytes);
          } catch {
            // Continue with other methods
          }
        }

        if (signed instanceof Transaction) {
          return signed;
        }
      }
    }

    return null;
  } catch {
    return null;
  }
}

export function rebuildTransaction(tx: Transaction | VersionedTransaction): Transaction | VersionedTransaction {
  try {
    if (tx instanceof Transaction) return tx;
    if (tx instanceof VersionedTransaction) return tx;

    const anyTx = tx as any;

    if (typeof anyTx.serialize === 'function') {
      try {
        const serialized = anyTx.serialize();
        try {
          return VersionedTransaction.deserialize(serialized);
        } catch {
          return Transaction.from(serialized);
        }
      } catch {
        // Fall through
      }
    }

    if (typeof anyTx.serializeMessage === 'function') {
      return tx;
    }

    if (anyTx.message && anyTx.signatures) {
      try {
        const serialized = Buffer.from(anyTx.serialize());
        return VersionedTransaction.deserialize(serialized);
      } catch {
        // Fall through
      }
    }

    return tx;
  } catch {
    return tx;
  }
}

export function wrapSignTransaction(
  originalSignTransaction: ((tx: Transaction) => Promise<Transaction>) | undefined,
  useManualSign: boolean
): ((tx: Transaction) => Promise<Transaction>) | undefined {
  if (!originalSignTransaction) return undefined;
  if (!useManualSign) return originalSignTransaction;

  return async (tx: Transaction): Promise<Transaction> => {
    try {
      const signedTx = await originalSignTransaction(tx);

      if (!(signedTx instanceof Transaction)) {
        const rebuilt = rebuildTransaction(signedTx);
        if (rebuilt instanceof Transaction) {
          return rebuilt;
        }
        throw new Error('Expected legacy Transaction but got VersionedTransaction');
      }

      return signedTx;
    } catch (e: any) {
      if (e?.message?.includes('serializeMessage')) {
        const nativeSigned = await signWithProvider(tx);
        if (nativeSigned) {
          return nativeSigned;
        }
      }

      throw e;
    }
  };
}

export function wrapSignAllTransactions(
  originalSignAllTransactions: ((txs: Transaction[]) => Promise<Transaction[]>) | undefined,
  useManualSign: boolean
): ((txs: Transaction[]) => Promise<Transaction[]>) | undefined {
  if (!originalSignAllTransactions) return undefined;
  if (!useManualSign) return originalSignAllTransactions;

  return async (txs: Transaction[]): Promise<Transaction[]> => {
    const signedTxs = await originalSignAllTransactions(txs);

    return signedTxs.map((signedTx, index) => {
      if (!(signedTx instanceof Transaction)) {
        const rebuilt = rebuildTransaction(signedTx);
        if (rebuilt instanceof Transaction) {
          return rebuilt;
        }
        throw new Error(`Expected legacy Transaction but got VersionedTransaction at index ${index}`);
      }
      return signedTx;
    });
  };
}

export function createCompatibleWallet(
  publicKey: any,
  signTransaction: ((tx: Transaction) => Promise<Transaction>) | undefined,
  signAllTransactions: ((txs: Transaction[]) => Promise<Transaction[]>) | undefined,
  useManualSign: boolean
) {
  return {
    publicKey,
    signTransaction: wrapSignTransaction(signTransaction, useManualSign),
    signAllTransactions: wrapSignAllTransactions(signAllTransactions, useManualSign),
  };
}
