'use client'

// Renders notify() toasts and confirmAction() dialogs (see src/lib/notify.ts).
import { useCallback, useEffect, useRef, useState } from 'react'
import * as Toast from '@radix-ui/react-toast'
import * as AlertDialog from '@radix-ui/react-alert-dialog'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'
import { registerNotifyHost, type ConfirmRequest, type NotifyMessage } from '@/lib/notify'

const STYLES = {
  success: { box: 'border-green-200 bg-white', icon: <CheckCircle2 className="h-5 w-5 text-green-700" aria-hidden /> },
  error: { box: 'border-red-200 bg-white', icon: <AlertCircle className="h-5 w-5 text-red-700" aria-hidden /> },
  info: { box: 'border-brand-primary/20 bg-white', icon: <Info className="h-5 w-5 text-brand-primary" aria-hidden /> },
} as const

export function NotifyHost() {
  const [toasts, setToasts] = useState<NotifyMessage[]>([])
  const [queue, setQueue] = useState<ConfirmRequest[]>([])
  const current = queue[0]
  const answered = useRef(false)

  useEffect(
    () =>
      registerNotifyHost({
        notify: (n) => setToasts((prev) => [...prev.slice(-3), n]),
        confirm: (r) => setQueue((prev) => [...prev, r]),
      }),
    []
  )

  const answer = useCallback(
    (ok: boolean) => {
      if (!current || answered.current) return
      answered.current = true
      current.resolve(ok)
      setQueue((prev) => prev.slice(1))
    },
    [current]
  )

  useEffect(() => {
    answered.current = false
  }, [current?.id])

  return (
    <Toast.Provider swipeDirection="right" duration={5000}>
      {toasts.map((t) => (
        <Toast.Root
          key={t.id}
          type={t.variant === 'error' ? 'foreground' : 'background'}
          duration={t.variant === 'error' ? 8000 : 5000}
          onOpenChange={(open) => {
            if (!open) setToasts((prev) => prev.filter((x) => x.id !== t.id))
          }}
          className={`flex items-start gap-3 rounded-xl border p-4 shadow-lg ${STYLES[t.variant].box} data-[state=closed]:opacity-0 transition-opacity`}
        >
          {STYLES[t.variant].icon}
          <Toast.Description className="flex-1 text-sm text-gray-800">{t.message}</Toast.Description>
          <Toast.Close aria-label="Dismiss" className="rounded p-1 text-gray-500 hover:text-gray-800">
            <X className="h-4 w-4" aria-hidden />
          </Toast.Close>
        </Toast.Root>
      ))}
      <Toast.Viewport className="fixed bottom-4 right-4 z-[100] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2 outline-none" />

      <AlertDialog.Root open={!!current} onOpenChange={(open) => { if (!open) answer(false) }}>
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 z-[110] bg-black/40" />
          <AlertDialog.Content className="fixed left-1/2 top-1/2 z-[111] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-xl focus:outline-none">
            <AlertDialog.Title className="text-base font-semibold text-gray-900">Please confirm</AlertDialog.Title>
            <AlertDialog.Description className="mt-2 text-sm text-gray-700">{current?.message}</AlertDialog.Description>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <AlertDialog.Cancel asChild>
                <button type="button" onClick={() => answer(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-800 hover:bg-gray-50">
                  {current?.cancelLabel}
                </button>
              </AlertDialog.Cancel>
              <AlertDialog.Action asChild>
                <button
                  type="button"
                  onClick={() => answer(true)}
                  className={`rounded-lg px-4 py-2 text-sm font-medium text-white ${current?.destructive ? 'bg-red-700 hover:bg-red-800' : 'bg-brand-primary hover:bg-brand-primary-dark'}`}
                >
                  {current?.confirmLabel}
                </button>
              </AlertDialog.Action>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </Toast.Provider>
  )
}
