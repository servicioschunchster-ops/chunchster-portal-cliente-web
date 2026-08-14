import { Trash2 } from 'lucide-react';

export default function PackageAttributesEditor({ atributos, onAtributoChange, onAgregar, onEliminar }) {
  return (
    <div className="border-t border-gray-100 pt-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold uppercase text-gray-400">Atributos del paquete</p>
        <button
          type="button"
          onClick={onAgregar}
          className="text-xs font-bold text-indigo-600 hover:underline cursor-pointer"
        >
          + Agregar atributo
        </button>
      </div>

      <div className="space-y-2">
        {atributos.map((fila) => (
          <div key={fila.id} className="flex gap-2 items-center">
            <input
              type="text"
              value={fila.key}
              onChange={(e) => onAtributoChange(fila.id, 'key', e.target.value)}
              placeholder="Clave (ej. ocasion, incluye)"
              className="w-1/3 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-300"
            />
            <input
              type="text"
              value={fila.value}
              onChange={(e) => onAtributoChange(fila.id, 'value', e.target.value)}
              placeholder="Valor (usa comas para varios)"
              className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-300"
            />
            <button
              type="button"
              onClick={() => onEliminar(fila.id)}
              disabled={atributos.length === 1}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-400 mt-3">
        Ej. ocasion: Quinceañera · incluye: vestido, tiara, guantes
      </p>
    </div>
  );
}