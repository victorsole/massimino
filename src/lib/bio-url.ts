/**
 * Public URL of a Massitree bio profile.
 *
 * The bio pages are served by this app at /bio/{username}. The short host
 * bio.massimino.fitness only works once its DNS points at Vercel and the
 * domain is added to the Vercel project; the bare-username redirect in
 * next.config.js then serves it. Set NEXT_PUBLIC_BIO_BASE_URL to
 * https://bio.massimino.fitness only after that is live.
 */
const BIO_BASE_URL = (process.env.NEXT_PUBLIC_BIO_BASE_URL || 'https://massimino.fitness/bio').replace(/\/$/, '')

export function bioProfileUrl(username: string): string {
  return `${BIO_BASE_URL}/${username}`
}
