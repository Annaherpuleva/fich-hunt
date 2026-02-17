import { PublicKey, SystemProgram } from './solanaWeb3';

export class BN {
  private readonly value: bigint;

  constructor(input: number | string | bigint) {
    this.value = BigInt(input);
  }

  toString(radix?: number): string {
    return this.value.toString(radix);
  }

  toNumber(): number {
    return Number(this.value);
  }

  toArrayLike(ArrayType: typeof Uint8Array | typeof Buffer, endian: 'le' | 'be', length: number): Uint8Array | Buffer {
    const bytes = new Uint8Array(length);
    let v = this.value;
    for (let i = 0; i < length; i += 1) {
      const idx = endian === 'le' ? i : length - 1 - i;
      bytes[idx] = Number(v & 255n);
      v >>= 8n;
    }
    return ArrayType === Buffer ? Buffer.from(bytes) : bytes;
  }
}

export type Wallet = {
  publicKey: PublicKey;
  signTransaction?: (tx: unknown) => Promise<unknown>;
  signAllTransactions?: (txs: unknown[]) => Promise<unknown[]>;
};

export const web3 = {
  PublicKey,
  SystemProgram,
};
