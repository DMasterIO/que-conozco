import { useState } from 'react'
import Modal from './Modal'
import { useStore, DEFAULT_COLORS } from '../store'
import type { MapColors } from '../types'

const FIELDS: { key: keyof MapColors; label: string }[] = [
  { key: 'visited', label: 'Países visitados' },
  { key: 'notVisited', label: 'No visitados' },
  { key: 'hover', label: 'Hover' },
  { key: 'border', label: 'Bordes' },
]

export default function ColorConfig({ onClose }: { onClose: () => void }) {
  const colors = useStore((s) => s.colors)
  const setColors = useStore((s) => s.setColors)
  const [local, setLocal] = useState<MapColors>(colors)

  return (
    <Modal title="Colores del mapa" onClose={onClose}>
      <p className="mb-5 text-sm text-slate-500">
        Personaliza solo los colores del mapa, sin afectar el resto de la página.
      </p>
      <div className="grid grid-cols-2 gap-4">
        {FIELDS.map((f) => (
          <label key={f.key} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3">
            <input
              type="color"
              value={local[f.key]}
              onChange={(e) => setLocal({ ...local, [f.key]: e.target.value })}
              className="h-10 w-12 cursor-pointer rounded border border-slate-200 bg-white p-0.5"
            />
            <div>
              <div className="text-sm font-medium text-slate-700">{f.label}</div>
              <div className="font-mono text-xs text-slate-400">{local[f.key]}</div>
            </div>
          </label>
        ))}
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <button
          onClick={() => setLocal(DEFAULT_COLORS)}
          className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
        >
          Restablecer
        </button>
        <button
          onClick={() => {
            setColors(local)
            onClose()
          }}
          className="rounded-xl bg-teal-600 px-5 py-2 text-sm font-medium text-white hover:bg-teal-700"
        >
          Aplicar
        </button>
      </div>
    </Modal>
  )
}
