'use client'

import { AlertTriangle } from 'lucide-react'

interface Props {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmModal({ open, title, message, confirmLabel = 'Elimina', onConfirm, onCancel }: Props) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
            <AlertTriangle className="text-red-500" size={20} />
          </div>
          <h2 className="font-semibold text-slate-800">{title}</h2>
        </div>
        <p className="text-sm text-slate-600 mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button className="btn-secondary" onClick={onCancel}>Annulla</button>
          <button className="btn-danger" onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  )
}
