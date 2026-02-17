export const LAMPORTS_PER_SOL = 1_000_000_000;

const encode = (value: string) => new TextEncoder().encode(value);

const normalizeBytes = (value: unknown): Uint8Array => {
  if (typeof value === 'string') return encode(value);
  if (value instanceof Uint8Array) return value;
  if (value instanceof ArrayBuffer) return new Uint8Array(value);
  if (value && typeof (value as { toBytes?: () => Uint8Array | ArrayBuffer }).toBytes === 'function') {
    return normalizeBytes((value as { toBytes: () => Uint8Array | ArrayBuffer }).toBytes());
  }
  if (value && typeof (value as { toBuffer?: () => Buffer | Uint8Array }).toBuffer === 'function') {
    return normalizeBytes((value as { toBuffer: () => Buffer | Uint8Array }).toBuffer());
  }
  return encode(String(value ?? ''));
};

const mergeSeeds = (seeds: Uint8Array[], programId: Uint8Array): Uint8Array => {
  const out = new Uint8Array(32);
  const all = [...seeds, programId];
  all.forEach((seed, seedIdx) => {
    seed.forEach((byte, byteIdx) => {
      const idx = (seedIdx * 11 + byteIdx) % 32;
      out[idx] = (out[idx] + byte + idx + seedIdx) % 256;
    });
  });
  return out;
};

export class PublicKey {
  private readonly raw: string;
  private readonly bytes: Uint8Array;

  constructor(value: string | Uint8Array | ArrayBuffer) {
    if (typeof value === 'string') {
      this.raw = value;
      this.bytes = normalizeBytes(value.padEnd(32, '0').slice(0, 32));
      return;
    }
    this.bytes = normalizeBytes(value);
    this.raw = Array.from(this.bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  toBase58(): string {
    return this.raw;
  }

  toString(): string {
    return this.toBase58();
  }

  toBuffer(): Buffer {
    return Buffer.from(this.bytes);
  }

  toBytes(): Uint8Array {
    return new Uint8Array(this.bytes);
  }

  equals(other: PublicKey): boolean {
    return this.toBase58() === other.toBase58();
  }

  static findProgramAddressSync(seeds: (Buffer | Uint8Array)[], programId: PublicKey | unknown): [PublicKey, number] {
    const seedBytes = seeds.map((seed) => normalizeBytes(seed));
    const merged = mergeSeeds(seedBytes, normalizeBytes(programId));
    return [new PublicKey(merged), 255];
  }
}

export const SystemProgram = {
  programId: new PublicKey('11111111111111111111111111111111'),
};

type Commitment = 'confirmed' | 'finalized' | 'processed';

export class Transaction {
  recentBlockhash?: string;
  feePayer?: PublicKey;

  static from(_: Uint8Array): Transaction {
    return new Transaction();
  }

  compileMessage(): Record<string, unknown> {
    return { recentBlockhash: this.recentBlockhash, feePayer: this.feePayer?.toBase58() };
  }

  serialize(): Uint8Array {
    return encode(JSON.stringify(this.compileMessage()));
  }
}

export class VersionedTransaction {
  static deserialize(_: Uint8Array): VersionedTransaction {
    return new VersionedTransaction();
  }

  serialize(): Uint8Array {
    return new Uint8Array();
  }
}

export class Connection {
  constructor(public endpoint: string, public commitment: Commitment = 'confirmed') {}

  async getFeeForMessage(): Promise<{ value: number }> {
    return { value: 5_000 };
  }

  async getBalance(): Promise<number> {
    return 0;
  }

  async getLatestBlockhash(): Promise<{ blockhash: string; lastValidBlockHeight: number }> {
    return { blockhash: `mock-${Date.now()}`, lastValidBlockHeight: 0 };
  }

  async sendRawTransaction(_: Uint8Array, __?: { skipPreflight?: boolean }): Promise<string> {
    return `mock-signature-${Date.now()}`;
  }

  async confirmTransaction(): Promise<{ value: { err: null } }> {
    return { value: { err: null } };
  }
}
