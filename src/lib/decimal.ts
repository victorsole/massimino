/**
 * Decimal helper.
 *
 * Some monetary columns moved from Prisma `Float` to `Decimal @db.Decimal(10, 2)`.
 * Under the legacy generated client these columns are typed `number`; once
 * `prisma generate` is rerun they become `Prisma.Decimal | null`. Aggregations
 * (`_sum`, `_avg`, `_min`, `_max`) follow the column's underlying type.
 *
 * `toNumber(x)` accepts any of (number, string, Decimal, null, undefined) and
 * returns a plain `number`. It is correct under both the old and the new
 * generated types, so call sites can be migrated incrementally without
 * waiting for the Prisma client regeneration.
 *
 * Use this for arithmetic and for `.toLocaleString()` / `.toFixed()` display
 * formatting; raw Decimal values do not implement those number methods the
 * way callers expect.
 */

type DecimalLike = number | string | { toNumber: () => number } | null | undefined

export function toNumber(value: DecimalLike, fallback = 0): number {
  if (value == null) return fallback
  if (typeof value === 'number') return value
  if (typeof value === 'string') {
    const n = Number(value)
    return Number.isFinite(n) ? n : fallback
  }
  if (typeof (value as { toNumber?: () => number }).toNumber === 'function') {
    return (value as { toNumber: () => number }).toNumber()
  }
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}
