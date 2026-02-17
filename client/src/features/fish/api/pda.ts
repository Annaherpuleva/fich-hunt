import { BN } from '@/shims/anchor';
import { PublicKey } from '@/shims/solanaWeb3';

export function deriveOceanPda(programId: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync([Buffer.from('ocean')], programId);
  return pda;
}

export function deriveVaultPda(programId: PublicKey, oceanPda: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync([Buffer.from('vault'), oceanPda.toBuffer()], programId);
  return pda;
}

export function deriveFishPda(programId: PublicKey, owner: PublicKey, fishId: number): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from('fish'), owner.toBuffer(), new BN(fishId).toArrayLike(Buffer, 'le', 8)],
    programId,
  );
  return pda;
}
