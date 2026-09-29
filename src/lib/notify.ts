// src/lib/notify.ts
// In-app replacements for window.alert() and window.confirm().
// Rendered by <NotifyHost /> (mounted once in the root layout); both functions
// fall back to the native browser behaviour if the host is not mounted.

export type NotifyVariant = 'success' | 'error' | 'info'

export interface NotifyMessage {
  id: number
  message: string
  variant: NotifyVariant
}

export interface ConfirmRequest {
  id: number
  message: string
  confirmLabel: string
  cancelLabel: string
  destructive: boolean
  resolve: (ok: boolean) => void
}

type Host = {
  notify: (n: NotifyMessage) => void
  confirm: (r: ConfirmRequest) => void
}

let host: Host | null = null
let nextId = 1

/** Called by NotifyHost when it mounts; returns an unregister function. */
export function registerNotifyHost(h: Host): () => void {
  host = h
  return () => {
    if (host === h) host = null
  }
}

const ERROR_HINT = /\b(fail|failed|error|could not|couldn't|cannot|can't|unable|invalid|not allowed|denied|too many|required|must|please (select|enter|choose|fill|provide))/i
const SUCCESS_HINT = /\b(success|successfully|saved|deleted|created|started|complete|completed|joined|sent|copied|updated|added|removed|accepted|approved|great)\b/i

function inferVariant(message: string): NotifyVariant {
  if (ERROR_HINT.test(message)) return 'error'
  if (SUCCESS_HINT.test(message)) return 'success'
  return 'info'
}

/** Show a non-blocking message. The variant is inferred from the text unless given. */
export function notify(message: unknown, variant?: NotifyVariant): void {
  const text = typeof message === 'string' ? message : String(message ?? '')
  if (typeof window === 'undefined') return
  if (!host) {
    window.alert(text)
    return
  }
  host.notify({ id: nextId++, message: text, variant: variant ?? inferVariant(text) })
}

/** Ask the user to confirm an action. Resolves true when they confirm. */
export function confirmAction(
  message: string,
  options: { confirmLabel?: string; cancelLabel?: string; destructive?: boolean } = {}
): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(false)
  const destructive = options.destructive ?? /\b(delete|remove|leave|cancel|discard|clear|reset|end)\b/i.test(message)
  if (!host) return Promise.resolve(window.confirm(message))
  return new Promise((resolve) => {
    host!.confirm({
      id: nextId++,
      message,
      confirmLabel: options.confirmLabel ?? (destructive ? 'Yes, continue' : 'Confirm'),
      cancelLabel: options.cancelLabel ?? 'Cancel',
      destructive,
      resolve,
    })
  })
}
