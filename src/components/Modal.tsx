import type { ReactNode } from 'react'

interface Props {
  title: ReactNode
  onClose: () => void
  children: ReactNode
  maxWidth?: string
}

export default function Modal({ title, onClose, children, maxWidth = 'max-w-2xl' }: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4 backdrop-blur-sm dark:bg-black/60"
      onClick={onClose}
    >
      <div
        className={`my-4 w-full ${maxWidth} rounded-2xl bg-white shadow-2xl dark:bg-slate-900`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">{title}</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
          >
            ✕
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}
