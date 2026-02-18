export type EventCommentInput = {
  eventType: string
  fishId?: number
  actorUserId?: number
  txHash?: string
}

export function buildEventComment(input: EventCommentInput): string {
  const normalizedType = String(input.eventType || "")
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .toLowerCase()

  switch (normalizedType) {
    case "fish_created":
      return `create fish: user #${input.actorUserId ?? "unknown"} created fish #${input.fishId ?? "unknown"}`
    case "fish_fed":
      return `feed: user #${input.actorUserId ?? "unknown"} fed fish #${input.fishId ?? "unknown"}`
    case "hunting_mark_placed":
      return `mark: user #${input.actorUserId ?? "unknown"} placed a hunt mark`
    case "fish_hunted":
      return `hunt: user #${input.actorUserId ?? "unknown"} executed a hunt`
    case "fish_resurrected":
      return `resurrect: user #${input.actorUserId ?? "unknown"} resurrected fish #${input.fishId ?? "unknown"}`
    case "fish_exited":
      return `exit: user #${input.actorUserId ?? "unknown"} exited fish #${input.fishId ?? "unknown"}`
    case "fish_transferred":
      return `transfer: user #${input.actorUserId ?? "unknown"} transferred fish #${input.fishId ?? "unknown"}`
    case "ton_deposit_confirmed":
      return `deposit confirmed for user #${input.actorUserId ?? "unknown"}: tx ${input.txHash ?? "unknown"}`
    case "ton_withdrawal_sent":
      return `withdrawal sent: tx ${input.txHash ?? "unknown"}`
    case "ton_withdrawal_failed":
      return `withdrawal failed for user #${input.actorUserId ?? "unknown"}`
    default:
      return `event ${input.eventType}`
  }
}
