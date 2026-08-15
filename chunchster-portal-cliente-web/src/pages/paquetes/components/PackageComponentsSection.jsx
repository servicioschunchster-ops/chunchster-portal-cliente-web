import { useState, useMemo } from 'react';
import { Loader2, Plus, Trash2, Package, Search, X } from 'lucide-react';

const LIMITE_CON_TEXTO = 8;
const LIMITE_SOLO_CATEGORIA = 20;

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
  const [busqueda, setBusqueda] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('');
  const [listaAbierta, setListaAbierta] = useState(false);

  // Categorías reales presentes en el catálogo ya precargado, para el <select>
  // de filtro. No pega a la API: se calcula del mismo array que ya tenemos.
  const categoriasUnicas = useMemo(() => {
    return Array.from(
      new Set(productosCatalogo.map((p) => p.category_id).filter(Boolean))
    ).sort((a, b) => a.localeCompare(b));
  }, [productosCatalogo]);

  // Filtro combinado: primero por categoría (si hay una elegida), después por
  // texto (nombre o SKU). Si solo hay categoría elegida y no texto, igual
  // muestra resultados (para "navegar" la categoría) con un tope más alto.
  // Todo en memoria sobre el catálogo ya cargado — funciona igual de rápido
  // con 500 o con 5000 productos porque nunca renderiza más de 20 filas.
  const resultados = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    if (!termino && !categoriaFiltro) return [];

    let lista = productosCatalogo;
    if (categoriaFiltro) {
      lista = lista.filter((p) => p.category_id === categoriaFiltro);
    }
    if (termino) {
      lista = lista.filter(
        (p) =>
          p.name?.toLowerCase().includes(termino) ||
          p.sku?.toLowerCase().includes(termino)
      );
    }

    const limite = termino ? LIMITE_CON_TEXTO : LIMITE_SOLO_CATEGORIA;
    return lista.slice(0, limite);
  }, [busqueda, categoriaFiltro, productosCatalogo]);

  const totalCoincidencias = useMemo(() => {
    if (!categoriaFiltro && !busqueda.trim()) return 0;
    let lista = productosCatalogo;
    if (categoriaFiltro) lista = lista.filter((p) => p.category_id === categoriaFiltro);
    if (busqueda.trim()) {
      const termino = busqueda.trim().toLowerCase();
      lista = lista.filter(
        (p) => p.name?.toLowerCase().includes(termino) || p.sku?.toLowerCase().includes(termino)
      );
    }
    return lista.length;
  }, [busqueda, categoriaFiltro, productosCatalogo]);

  const seleccionar = (productId) => {
    onElegirProducto(productId);
    setBusqueda('');
    setListaAbierta(false);
  };

  const hayFiltroActivo = Boolean(busqueda.trim() || categoriaFiltro);

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
        <div className="relative">
          <div className="flex flex-col sm:flex-row gap-2">
            <select
              value={categoriaFiltro}
              onChange={(e) => {
                setCategoriaFiltro(e.target.value);
                setListaAbierta(true);
              }}
              disabled={cargandoCatalogoProductos || categoriasUnicas.length === 0}
              className="w-full sm:w-44 px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-300 cursor-pointer disabled:opacity-50 shrink-0"
            >
              <option value="">Todas las categorías</option>
              {categoriasUnicas.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => {
                  setBusqueda(e.target.value);
                  setListaAbierta(true);
                }}
                onFocus={() => setListaAbierta(true)}
                onBlur={() => setTimeout(() => setListaAbierta(false), 150)}
                disabled={cargandoCatalogoProductos}
                placeholder={
                  cargandoCatalogoProductos
                    ? 'Cargando productos...'
                    : 'Busca por nombre o SKU (opcional)'
                }
                className="w-full pl-9 pr-8 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-300 disabled:opacity-50"
              />
              {busqueda && (
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => { setBusqueda(''); setListaAbierta(false); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {listaAbierta && hayFiltroActivo && (
            <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-72 overflow-y-auto">
              {resultados.length === 0 ? (
                <p className="px-3 py-2 text-sm text-gray-400">Sin resultados con ese filtro.</p>
              ) : (
                <>
                  {resultados.map((p) => (
                    <button
                      key={p.product_id}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => seleccionar(p.product_id)}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-indigo-50 transition-colors cursor-pointer flex items-center justify-between gap-2"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-gray-800">{p.name}</span>
                        {!categoriaFiltro && p.category_id && (
                          <span className="block text-[11px] text-gray-400">{p.category_id}</span>
                        )}
                      </span>
                      <span className="text-xs text-gray-400 font-mono shrink-0">{p.sku}</span>
                    </button>
                  ))}
                  {totalCoincidencias > resultados.length && (
                    <p className="px-3 py-1.5 text-[11px] text-gray-400 border-t border-gray-100">
                      +{totalCoincidencias - resultados.length} más — afina la búsqueda para verlos
                    </p>
                  )}
                </>
              )}
            </div>
          )}
        </div>
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