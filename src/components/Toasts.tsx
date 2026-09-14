import { create } from 'zustand'

interface Toast {
  id: number
  text: string
}

interface ToastState {
  toasts: Toast[]
  show: (text: string) => void
  remove: (id: number) => void
}

export const useToasts = create<ToastState>((set) => ({
  toasts: [],
  show: (text) => {
    const id = Date.now() + Math.random()
    set((s) => ({ toasts: [...s.toasts.slice(-2), { id, text }] }))
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
    }, 2600)
  },
  remove: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))

export function toast(text: string) {
  useToasts.getState().show(text)
}

export function Toasts() {
  const toasts = useToasts((s) => s.toasts)
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-28 z-[90] flex flex-col items-center gap-2 px-6">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="rounded-full bg-stone-800/90 px-4 py-2 text-sm text-white shadow-lg"
        >
          {t.text}
        </div>
      ))}
    </div>
  )
}
