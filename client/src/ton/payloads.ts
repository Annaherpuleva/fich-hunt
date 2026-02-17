export const OPCODES = {
  CREATE: 0x01,
  FEED: 0x02,
  MARK: 0x03,
  HUNT: 0x04,
  EXIT: 0x05,
  UPDATE_DAILY: 0x06,
};

const qid = () => BigInt(Date.now());

function putUintBE(bytes: number[], value: bigint, size: number) {
  for (let i = size - 1; i >= 0; i--) {
    bytes.push(Number((value >> BigInt(8 * i)) & 0xffn));
  }
}

function toBase64(bytes: number[]) {
  const s = String.fromCharCode(...bytes);
  return btoa(s);
}

function encodeCell(body: number[]) {
  // Minimal single-cell BoC wrapper for <= 127 bytes body with 0 refs.
  // This is enough for small op payloads used by TonConnect messages.
  const d1 = 0x00;
  // Descriptor 2 uses "full-bytes + ceil(bytes)" representation.
  // For byte-aligned payloads this is `2 * bytes` (see TON cell spec).
  // We only build byte-aligned bodies here.
  const d2 = body.length * 2;
  const cell = [d1, d2, ...body];

  const header = [
    0xb5, 0xee, 0x9c, 0x72,
    0x01,
    0x01,
    0x01,
    0x00,
    0x01,
    cell.length,
    0x00,
  ];

  return toBase64([...header, ...cell]);
}

function payload(op: number, id?: number) {
  const bytes: number[] = [];
  putUintBE(bytes, BigInt(op), 4);
  if (typeof id === 'number') putUintBE(bytes, BigInt(id), 4);
  putUintBE(bytes, qid(), 8);
  return encodeCell(bytes);
}

export function createPayload() { return payload(OPCODES.CREATE); }
export function feedPayload(fishId: number) { return payload(OPCODES.FEED, fishId); }
export function markPayload(preyId: number) { return payload(OPCODES.MARK, preyId); }
export function huntPayload(preyId: number) { return payload(OPCODES.HUNT, preyId); }
export function exitPayload(fishId: number) { return payload(OPCODES.EXIT, fishId); }
export function updateDailyPayload() { return payload(OPCODES.UPDATE_DAILY); }
export function toPayloadBase64(payloadB64: string) { return payloadB64; }
