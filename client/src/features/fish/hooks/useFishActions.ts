import { useWallet } from '../../../wallet/tonWallet';
import { PublicKey, SystemProgram } from '@/shims/solanaWeb3';
import * as anchor from '@/shims/anchor';
import { getProgram } from '../../../config/contract';
import { useTx } from '../../../components/TxOverlay';
import { deriveOceanPda, deriveVaultPda, deriveFishPda } from '../api/pda';
import { Buffer } from 'buffer';
import { sendTransactionWithWallet } from '../../../utils/sendTransactionWithWallet';

export type TxEntityMeta = {
  fishId?: number;
  name?: string;
  valueText?: string;
  avatarUrl?: string | null;
  feedDeltaSol?: number;
  feedPercent?: number;
  huntGainSol?: number;
  recipient?: string;
  payoutSol?: number;
};

type FeedParams = {
  fishId: number;
  amountLamports: number;
  processingText: string;
  actionText: string;
  waitingForCloseTx: () => Promise<Partial<TxEntityMeta>>;
  entity?: TxEntityMeta;
};

type MarkParams = {
  hunterId?: number;
  preyId: number;
  markCostLamports?: number;
  processingText: string;
  actionText: string;
  waitingForCloseTx: () => Promise<void>;
  entity?: TxEntityMeta;
};

type HuntParams = {
  hunterId: number;
  preyId: number;
  processingText: string;
  actionText: string;
  waitingForCloseTx: () => Promise<void>;
  entity?: TxEntityMeta;
};

type ExitParams = {
  fishId: number;
  processingText: string;
  actionText: string;
  waitingForCloseTx: () => Promise<void>;
  entity?: TxEntityMeta;
};

type TransferParams = {
  fishId: number;
  newOwner: string;
  processingText: string;
  actionText: string;
  entity?: TxEntityMeta;
};

export function useFishActions() {
  const { publicKey, signTransaction, signAllTransactions } = useWallet();
  const { runTx } = useTx();
  const useManualSign = false;

  const deriveNameRegistryPda = async (programId: PublicKey, name: string) => {
    const enc = new TextEncoder();
    // @ts-ignore
    const digest = await crypto.subtle.digest('SHA-256', enc.encode(name));
    const nameSeed = Buffer.from(new Uint8Array(digest));
    const [pda] = PublicKey.findProgramAddressSync([Buffer.from('fish_name'), nameSeed], programId);
    return pda;
  };

  // Хелпер для отправки транзакции
  const sendTx = async (methodCall: (program: any) => any) => {
    if (!publicKey) {
      throw new Error('Wallet not connected');
    }
    if (!signTransaction || !signAllTransactions) {
      throw new Error('Wallet does not support transaction signing');
    }
    return sendTransactionWithWallet({
      methodCall,
      publicKey,
      signTransaction: signTransaction as any,
      signAllTransactions: signAllTransactions as any,
      useManualSign,
    });
  };

  const feedFish = async ({ fishId, amountLamports, processingText, actionText, entity, waitingForCloseTx }: FeedParams) => {
    if (!publicKey) return;
    
    // Для read-only операций (получение данных) используем пустой wallet
    const readProgram: any = await getProgram(undefined, {} as any);
    const programId: PublicKey = readProgram.programId as PublicKey;
    const oceanPda = deriveOceanPda(programId);

    const all = await readProgram.account.fish.all();
    const target = all.find((it: any) => {
      try {
        return Number(it.account?.id?.toNumber?.() ?? Number(it.account?.id)) === fishId;
      } catch {
        return false;
      }
    });
    if (!target) throw new Error('Fish not found');
    const fishPda = target.publicKey as PublicKey;

    const vaultPda = deriveVaultPda(programId, oceanPda);
    // @ts-ignore
    const ocean: any = await readProgram.account.ocean.fetch(oceanPda);
    const adminPk = new PublicKey(ocean.admin);

    await runTx(
      async () => {
        const res = await sendTx(
          (program) =>
            program.methods
              .feedFish(new anchor.BN(amountLamports))
              .accounts({ ocean: oceanPda, fish: fishPda, vault: vaultPda, owner: publicKey, admin: adminPk, systemProgram: SystemProgram.programId } as any)
        );
          
        if (res) {
          const updatedEntity = await waitingForCloseTx();
          if (entity && updatedEntity && Object.keys(updatedEntity).length) {
            Object.entries(updatedEntity).forEach(([key, value]) => {
              if (key in updatedEntity) {
                entity[key] = value;
              }
            });
          }
        }

        return res;
      },
      processingText,
      { actionText, entity, successKind: 'feed' }
    );
  };

  const placeMark = async ({ hunterId, preyId, markCostLamports, processingText, actionText, entity, waitingForCloseTx }: MarkParams) => {
    if (!publicKey) return;
    
    const readProgram: any = await getProgram(undefined, {} as any);
    const programId: PublicKey = readProgram.programId as PublicKey;
    const oceanPda = deriveOceanPda(programId);

    const myAll = await readProgram.account.fish.all([{ memcmp: { offset: 16, bytes: publicKey.toBase58() } }]);
    if (!myAll?.length) throw new Error('No hunter fish');

    let hunterEntry: any | undefined;
    if (typeof hunterId === 'number' && Number.isFinite(hunterId)) {
      hunterEntry = myAll.find((it: any) => {
        try {
          return Number(it.account?.id?.toNumber?.() ?? Number(it.account?.id)) === hunterId;
        } catch {
          return false;
        }
      });
    }
    if (!hunterEntry) {
      hunterEntry = myAll[0];
    }
    const hunterPk = hunterEntry.publicKey as PublicKey;

    const all = await readProgram.account.fish.all();
    const prey = all.find((it: any) => {
      try { return Number(it.account?.id?.toNumber?.() ?? Number(it.account?.id)) === preyId; } catch { return false; }
    });
    if (!prey) throw new Error('Prey fish not found');
    const preyPk = prey.publicKey as PublicKey;
    // Mark cost is validated on-chain for TON flow.

    const vaultPda = deriveVaultPda(programId, oceanPda);
    // @ts-ignore
    const ocean: any = await readProgram.account.ocean.fetch(oceanPda);
    const adminPk = new PublicKey(ocean.admin);

    await runTx(
      async () => {
        const res = await sendTx(
          (program) =>
            program.methods
              .placeHuntingMark()
              .accounts({ ocean: oceanPda, hunter: hunterPk, prey: preyPk, vault: vaultPda, hunterOwner: publicKey, admin: adminPk, systemProgram: SystemProgram.programId } as any)
        );
        
        if (res) {
          await waitingForCloseTx();
        }

        return res;
      },
      processingText,
      { actionText, entity, successKind: 'mark' }
    );
  };

  const huntFish = async ({ hunterId, preyId, processingText, actionText, entity, waitingForCloseTx }: HuntParams) => {
    if (!publicKey) return;
    
    const readProgram: any = await getProgram(undefined, {} as any);
    const programId: PublicKey = readProgram.programId as PublicKey;
    const oceanPda = deriveOceanPda(programId);
    const vaultPda = deriveVaultPda(programId, oceanPda);

    const ownerFilter = { memcmp: { offset: 16, bytes: publicKey.toBase58() } } as any;
    const myFish = await readProgram.account.fish.all([ownerFilter]);
    const hunterEntry = (myFish || []).find((it: any) => {
      try { return Number(it.account?.id?.toNumber?.() ?? Number(it.account?.id)) === hunterId; } catch { return false; }
    });
    if (!hunterEntry) throw new Error('Hunter fish not found or not owned by wallet');
    const hunterPk = hunterEntry.publicKey as PublicKey;

    const all = await readProgram.account.fish.all();
    const prey = all.find((it: any) => {
      try { return Number(it.account?.id?.toNumber?.() ?? Number(it.account?.id)) === preyId; } catch { return false; }
    });
    if (!prey) throw new Error('Prey fish not found');
    const preyPk = prey.publicKey as PublicKey;

    const preyAcc: any = await readProgram.account.fish.fetch(preyPk);
    const preyNameRegistry = await deriveNameRegistryPda(programId, String(preyAcc.name || ''));
    const expectedShareStr = (preyAcc.share ?? 0)?.toString?.() ?? String(preyAcc.share ?? 0);
    const expectedPreyShare = new anchor.BN(expectedShareStr);

    // @ts-ignore
    const ocean: any = await readProgram.account.ocean.fetch(oceanPda);
    const adminPk = new PublicKey(ocean.admin);

    await runTx(
      async () => {
        const res = await sendTx(
          (program) =>
            program.methods
              .huntFish(expectedPreyShare)
              .accounts({
                ocean: oceanPda,
                hunter: hunterPk,
                prey: preyPk,
                vault: vaultPda,
                hunterOwner: publicKey,
                admin: adminPk,
                systemProgram: SystemProgram.programId,
                preyNameRegistry,
              } as any),
        );
          
        if (res) {
          await waitingForCloseTx();
        }
        
        return res;
      },
      processingText,
      { actionText, entity, successKind: 'hunt' }
    );
  };

  const exitFish = async ({ fishId, processingText, actionText, entity, waitingForCloseTx }: ExitParams) => {
    if (!publicKey) return;
    
    const readProgram: any = await getProgram(undefined, {} as any);
    const programId: PublicKey = readProgram.programId as PublicKey;
    const oceanPda = deriveOceanPda(programId);
    const [vaultPda] = PublicKey.findProgramAddressSync([Buffer.from('vault'), oceanPda.toBuffer()], programId);

    const all = await readProgram.account.fish.all();
    const target = all.find((it: any) => {
      try { return Number(it.account?.id?.toNumber?.() ?? Number(it.account?.id)) === fishId; } catch { return false; }
    });
    if (!target) throw new Error('Fish not found');
    const fishPk = target.publicKey as PublicKey;
    const fishName = String(target.account?.name || '');
    const nameRegistryPda = await deriveNameRegistryPda(programId, fishName);

    // @ts-ignore
    const ocean: any = await readProgram.account.ocean.fetch(oceanPda);
    const adminPk = new PublicKey(ocean.admin);

    await runTx(
      async () => {
        const res = await sendTx(
          (program) =>
            program.methods
              .exitGame()
              .accounts({
                ocean: oceanPda,
                fish: fishPk,
                vault: vaultPda,
                owner: publicKey,
                admin: adminPk,
                nameRegistry: nameRegistryPda,
                systemProgram: SystemProgram.programId,
              } as any),
        );
        
        if (res) {
          await waitingForCloseTx();
        }

        return res;
      },
      processingText,
      { actionText, entity, successKind: 'sell' as any }
    );
  };

  const transferFish = async ({ fishId, newOwner, processingText, actionText, entity }: TransferParams) => {
    if (!publicKey) return;
    
    const readProgram: any = await getProgram(undefined, {} as any);
    const programId: PublicKey = readProgram.programId as PublicKey;
    const [oceanPda] = PublicKey.findProgramAddressSync([Buffer.from('ocean')], programId);

    let newOwnerPk: PublicKey;
    try { newOwnerPk = new PublicKey(newOwner); } catch { throw new Error('Invalid recipient address'); }

    const all = await readProgram.account.fish.all();
    const current = all.find((it: any) => {
      try { return Number(it.account?.id?.toNumber?.() ?? Number(it.account?.id)) === fishId && String(it.account?.owner) === String(publicKey); } catch { return false; }
    });
    if (!current) throw new Error('Fish not found or not owned');
    const fishPk = current.publicKey as PublicKey;

    const newFishPda = deriveFishPda(programId, newOwnerPk, fishId);

    await runTx(
      async () => {
        return sendTx(
          (program) =>
            program.methods
              .transferFish()
              .accounts({ ocean: oceanPda, fish: fishPk, newFish: newFishPda, currentOwner: publicKey, newOwner: newOwnerPk, systemProgram: SystemProgram.programId } as any),
        );
      },
      processingText,
      { actionText, entity, successKind: 'gift' }
    );
  };

  return { feedFish, placeMark, huntFish, exitFish, transferFish };
}
