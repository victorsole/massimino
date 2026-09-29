// src/lib/dates.ts

/**
 * Convert a wall-clock date and time entered in the user's browser into a UTC Date.
 *
 * `timezoneOffset` is the browser's `new Date().getTimezoneOffset()` at that moment
 * (minutes to add to local time to get UTC, e.g. -120 in Brussels in summer).
 * Without it, the time is treated as UTC, which is what older clients relied on.
 */
export function localDateTimeToUtc(date: string, time: string, timezoneOffset?: number): Date {
  if (timezoneOffset === undefined || timezoneOffset === null) {
    return new Date(`${date}T${time}`)
  }
  const [year, month, day] = date.split('-').map(Number)
  const [hours, minutes, seconds = 0] = time.split(':').map(Number)
  const asIfUtc = Date.UTC(year, month - 1, day, hours, minutes, seconds)
  return new Date(asIfUtc + timezoneOffset * 60 * 1000)
}
