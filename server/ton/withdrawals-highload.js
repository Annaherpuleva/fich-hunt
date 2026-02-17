/**
 * Highload withdrawals architecture for TON USDT payouts.
 * Inspired by toncenter/examples withdrawals flow.
 *
 * Flow:
 * 1) Collect approved withdrawals from DB.
 * 2) Build payout queue and split by network (USDT TON/BEP20/TRC20).
 * 3) Send TON payouts in batches with seqno control.
 * 4) Persist txid to wallet_withdrawals.transaction_hash.
 */

class WithdrawalQueue {
  constructor() {
    this.queue = []
    this.processing = false
  }

  add(withdrawal) {
    this.queue.push(withdrawal)
  }

  async process(handler) {
    if (this.processing) return
    this.processing = true

    while (this.queue.length) {
      const batch = this.queue.splice(0, 50)
      await handler(batch)
    }

    this.processing = false
  }
}

async function processTonBatch(batch, { sendTonTransfer, saveTxid }) {
  for (const w of batch) {
    const txid = await sendTonTransfer(w)
    await saveTxid(w.id, txid)
  }
}

export {
  WithdrawalQueue,
  processTonBatch,
}
