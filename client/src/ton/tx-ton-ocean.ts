import { createPayload, exitPayload, feedPayload, huntPayload, markPayload, toPayloadBase64, updateDailyPayload } from './payloads';

export type TonConnectMessage = { address: string; amount: string; payload: string };
export type TonConnectTx = { validUntil: number; messages: TonConnectMessage[] };

// TonConnect rejects transactions when validUntil is more than 5 minutes ahead.
// Keep a safety buffer for client/server clock skew.
const TONCONNECT_VALID_UNTIL_SECONDS = 240;
const validUntil = () => Math.floor(Date.now() / 1000) + TONCONNECT_VALID_UNTIL_SECONDS;

function toNano(v: string): bigint {
  const normalized = String(v || '0').replace(',', '.').trim();
  const [wholeRaw = '0', fracRaw = ''] = normalized.split('.');
  const whole = wholeRaw.replace(/\D/g, '') || '0';
  const frac = fracRaw.replace(/\D/g, '').slice(0, 9).padEnd(9, '0');
  return BigInt(whole) * 1_000_000_000n + BigInt(frac || '0');
}

function withCommission(amountNano: bigint, commissionBps: bigint): bigint {
  return (amountNano * (10_000n + commissionBps) + 9_999n) / 10_000n;
}

export function buildTonCreateTx(oceanAddress: string, amountTon: string): TonConnectTx {
  const depositNano = toNano(amountTon);
  // Create requires +10% game entry fee on top of the resident deposit.
  const payableNano = withCommission(depositNano, 1_000n);
  return {
    validUntil: validUntil(),
    messages: [{ address: oceanAddress, amount: payableNano.toString(), payload: toPayloadBase64(createPayload()) }],
  };
}

export function buildTonFeedTx(oceanAddress: string, fishId: number, amountTon: string): TonConnectTx {
  return {
    validUntil: validUntil(),
    messages: [{ address: oceanAddress, amount: toNano(amountTon).toString(), payload: toPayloadBase64(feedPayload(fishId)) }],
  };
}

export function buildTonActionTx(oceanAddress: string, action: 'mark' | 'hunt' | 'exit' | 'updateDaily', fishId?: number): TonConnectTx {
  const payload = action === 'mark'
    ? markPayload(fishId || 0)
    : action === 'hunt'
      ? huntPayload(fishId || 0)
      : action === 'exit'
        ? exitPayload(fishId || 0)
        : updateDailyPayload();

  return {
    validUntil: validUntil(),
    messages: [{ address: oceanAddress, amount: toNano('0.05').toString(), payload: toPayloadBase64(payload) }],
  };
}
