export type MoneyAtomic = bigint

export type CurrencyCode = "TON"

export type GameAmount = {
  atomic: MoneyAtomic
  currency: CurrencyCode
}

export const GAME_CURRENCY: CurrencyCode = "TON"
export const ATOMIC_UNITS_PER_CURRENCY = BigInt(1_000_000_000)

export const toAtomicAmount = (amount: number): MoneyAtomic => {
  if (!Number.isFinite(amount) || amount <= 0) return BigInt(0)
  return BigInt(Math.floor(amount * Number(ATOMIC_UNITS_PER_CURRENCY)))
}

export const fromAtomicAmount = (amount: bigint | number): number => {
  const atomic = typeof amount === "bigint" ? Number(amount) : amount
  return atomic / Number(ATOMIC_UNITS_PER_CURRENCY)
}

export const formatAtomicAmount = (amount: bigint | number, digits = 4, withCurrency = true): string => {
  const value = fromAtomicAmount(amount).toFixed(digits)
  return withCurrency ? `${value} ${GAME_CURRENCY}` : value
}

