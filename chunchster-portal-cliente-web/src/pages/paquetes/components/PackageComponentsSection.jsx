import { Loader2, Plus, Trash2, Package } from 'lucide-react';

export default function PackageComponentsSection({
  componentes,
  nombreDeComponente,
  onQuitarComponente,
  productosCatalogo,
  cargandoCatalogoProductos,
  productoSeleccionado,
  onElegirProducto,
  onCancelarSeleccion,
  cargandoVariantes,
  variantesDisponibles,
  varianteElegida,
  setVarianteElegida,
  cantidadElegida,
  setCantidadElegida,
  onAgregarComponente,
}) {
  return (
    <div className="border-t border-gray-100 pt-4">
      <p className="text-xs font-bold uppercase text-gray-400 mb-2">Componentes del paquete</p>

      {componentes.length > 0 && (
        <div className="space-y-2 mb-3">
          {componentes.map((c, i) => (
            <div
              key={`${c.product_id}-${c.variant_key}-${i}`}
              className="flex items-center gap-3 border border-gray-100 rounded-lg p-2.5"
            >
              <Package className="w-4 h-4 text-gray-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">
                  {nombreDeComponente(c) || (
                    <span className="text-gray-400 italic flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" /> Cargando nombre...
                    </span>
                  )}
                </p>
                <p className="text-xs text-gray-400">Variante: {c.variant_key} · Cantidad: {c.quantity}</p>
              </div>
              <button
                onClick={() => onQuitarComponente(i)}
                className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {!productoSeleccionado ? (
        <select
          value=""
          onChange={(e) => onElegirProducto(e.target.value)}
          disabled={cargandoCatalogoProductos}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-300 cursor-pointer disabled:opacity-50"
        >
          <option value="">
            {cargandoCatalogoProductos
              ? 'Cargando productos...'
              : productosCatalogo.length === 0
              ? 'No hay productos activos disponibles'
              : 'Selecciona un producto para agregar como componente'}
          </option>
          {productosCatalogo.map((p) => (
            <option key={p.product_id} value={p.product_id}>
              {p.name} — {p.sku}
            </option>
          ))}
        </select>
      ) : (
        <div className="border border-indigo-200 bg-indigo-50/50 rounded-lg p-3 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-800">{productoSeleccionado.name}</p>
            <button
              onClick={onCancelarSeleccion}
              className="text-xs text-gray-500 hover:text-gray-800 cursor-pointer"
            >
              Cancelar
            </button>
          </div>

          {cargandoVariantes ? (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Cargando variantes...
            </div>
          ) : variantesDisponibles.length === 0 ? (
            <p className="text-xs text-red-500">Este producto no tiene variantes con stock registrado.</p>
          ) : (
            <div className="flex flex-col sm:flex-row gap-2">
              <select
                value={varianteElegida}
                onChange={(e) => setVarianteElegida(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none cursor-pointer"
              >
                <option value="">Selecciona variante</option>
                {variantesDisponibles.map((v) => (
                  <option key={v.variant_key} value={v.variant_key}>
                    {v.variant_key} (stock: {v.qty_available})
                  </option>
                ))}
              </select>
              <input
                type="number"
                min="1"
                value={cantidadElegida}
                onChange={(e) => setCantidadElegida(e.target.value)}
                className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none"
                placeholder="Cant."
              />
              <button
                onClick={onAgregarComponente}
                disabled={!varianteElegida}
                className="flex items-center justify-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-40 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Agregar
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}