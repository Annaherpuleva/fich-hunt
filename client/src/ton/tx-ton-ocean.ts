import { createPayload, exitPayload, feedPayload, huntPayload, markPayload, toPayloadBase64, updateDailyPayload } from './payloads';

export type TonConnectMessage = { address: string; amount: string; payload: string };
export type TonConnectTx = { validUntil: number; messages: TonConnectMessage[] };

// TonConnect rejects transactions when validUntil is more than 5 minutes ahead.
// Keep a safety buffer for client/server clock skew.
const TONCONNECT_VALID_UNTIL_SECONDS = 240;
const validUntil = () => Math.floor(Date.now() / 1000) + TONCONNECT_VALID_UNTIL_SECONDS;
const toNano = (v: string) => Math.round(Number(v || 0) * 1_000_000_000).toString();

export function buildTonCreateTx(oceanAddress: string, amountTon: string): TonConnectTx {
  return {
    validUntil: validUntil(),
    messages: [{ address: oceanAddress, amount: toNano(amountTon), payload: toPayloadBase64(createPayload()) }],
  };
}

export function buildTonFeedTx(oceanAddress: string, fishId: number, amountTon: string): TonConnectTx {
  return {
    validUntil: validUntil(),
    messages: [{ address: oceanAddress, amount: toNano(amountTon), payload: toPayloadBase64(feedPayload(fishId)) }],
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
    messages: [{ address: oceanAddress, amount: toNano('0.05'), payload: toPayloadBase64(payload) }],
  };
}
