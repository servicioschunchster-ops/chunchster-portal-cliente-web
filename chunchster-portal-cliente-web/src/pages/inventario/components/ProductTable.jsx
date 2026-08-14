import { useState, useMemo } from 'react';
import {
  Edit2, Trash2, Package, X, Eye, ChevronLeft, ChevronRight,
  Tag, Power, PowerOff, CircleDot, CircleSlash, Boxes,
  Search, ChevronUp, ChevronDown, ChevronsUpDown, AlertTriangle,
} from 'lucide-react';

// ==========================================
// Traducciones / helpers de presentación
// ==========================================
const TIPO_LABEL = {
  sale: 'Venta',
  rental: 'Alquiler',
  both: 'Venta y Alquiler',
};

const traducirTipo = (tipo) => TIPO_LABEL[tipo] || tipo;

const UMBRAL_STOCK_BAJO = 2;

// Colores según stock disponible
const claseStock = (qty) => {
  if (qty === undefined || qty === null) return 'text-gray-400';
  if (qty <= 0) return 'text-red-600';
  if (qty <= UMBRAL_STOCK_BAJO) return 'text-yellow-600';
  return 'text-gray-700';
};

export default function ProductTable({ productos, onEdit, onDelete, onToggleActive }) {
  // Los paquetes (is_package: true) son productos según la API, pero tienen
  // su propia vista (PackageTable/PackageModal). Se excluyen acá para que no
  // aparezcan duplicados entre las dos tablas.
  const productosSinCombos = useMemo(
    () => productos.filter((p) => !p.is_package),
    [productos]
  );

  // ------------------------------------------
  // Búsqueda y filtros
  // ------------------------------------------
  const [busqueda, setBusqueda] = useState('');
  const [filtros, setFiltros] = useState({ categoria: 'todas', tipo: 'todos', estado: 'todos' });
  const [orden, setOrden] = useState({ campo: null, direccion: 'asc' });

  const categorias = useMemo(() => {
    const unicas = new Set(productosSinCombos.map((p) => p.category_id).filter(Boolean));
    return [...unicas];
  }, [productosSinCombos]);

  const tipos = useMemo(() => {
    const unicos = new Set(productosSinCombos.map((p) => p.product_type).filter(Boolean));
    return [...unicos];
  }, [productosSinCombos]);

  const setFiltro = (clave, valor) => setFiltros((prev) => ({ ...prev, [clave]: valor }));

  const alternarOrden = (campo) => {
    setOrden((prev) =>
      prev.campo === campo
        ? { campo, direccion: prev.direccion === 'asc' ? 'desc' : 'asc' }
        : { campo, direccion: 'asc' }
    );
  };

  const productosFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();

    let resultado = productosSinCombos.filter((p) => {
      const pasaCategoria = filtros.categoria === 'todas' || p.category_id === filtros.categoria;
      const pasaTipo = filtros.tipo === 'todos' || p.product_type === filtros.tipo;
      const pasaEstado =
        filtros.estado === 'todos' || (filtros.estado === 'activos' ? p.is_active : !p.is_active);
      const pasaBusqueda =
        !q ||
        p.name?.toLowerCase().includes(q) ||
        p.sku?.toLowerCase().includes(q) ||
        p.tags?.some((t) => t.toLowerCase().includes(q));
      return pasaCategoria && pasaTipo && pasaEstado && pasaBusqueda;
    });

    if (orden.campo) {
      resultado = [...resultado].sort((a, b) => {
        const va = a[orden.campo] ?? -Infinity;
        const vb = b[orden.campo] ?? -Infinity;
        return orden.direccion === 'asc' ? va - vb : vb - va;
      });
    }

    return resultado;
  }, [productosSinCombos, filtros, busqueda, orden]);

  // Chips de resumen (sobre el total sin combos, no sobre lo filtrado)
  const resumen = useMemo(() => {
    const activos = productosSinCombos.filter((p) => p.is_active).length;
    const inactivos = productosSinCombos.length - activos;
    const stockBajo = productosSinCombos.filter(
      (p) => p.is_active && (p.qty_available_total ?? 0) <= UMBRAL_STOCK_BAJO
    ).length;
    return { activos, inactivos, stockBajo };
  }, [productosSinCombos]);

  // ------------------------------------------
  // Visor de imágenes
  // ------------------------------------------
  const [visor, setVisor] = useState({ abierto: false, producto: null, indiceActual: 0 });

  const abrirVisor = (producto, index = 0) => {
    if (producto.images && producto.images.length > 0) {
      setVisor({ abierto: true, producto, indiceActual: index });
    }
  };

  const cerrarVisor = () => setVisor({ abierto: false, producto: null, indiceActual: 0 });

  const siguienteImagen = (e) => {
    e.stopPropagation();
    setVisor((prev) => ({
      ...prev,
      indiceActual: (prev.indiceActual + 1) % prev.producto.images.length,
    }));
  };

  const imagenAnterior = (e) => {
    e.stopPropagation();
    setVisor((prev) => ({
      ...prev,
      indiceActual: (prev.indiceActual - 1 + prev.producto.images.length) % prev.producto.images.length,
    }));
  };

  const getEtiquetaOrientacion = (url, index) => {
    if (!url) return `Foto ${index + 1}`;
    if (url.includes('/FRONT/')) return 'Frente';
    if (url.includes('/BACK/')) return 'Atrás';
    if (url.includes('/LEFT/')) return 'Izquierda';
    if (url.includes('/RIGHT/')) return 'Derecha';
    return `Foto ${index + 1}`;
  };

  const handleToggleActive = (prod) => {
    if (onToggleActive) onToggleActive(prod.product_id, !prod.is_active);
  };

  // Header ordenable reutilizable
  const ThOrdenable = ({ campo, children, className = '' }) => {
    const activo = orden.campo === campo;
    const Icono = !activo ? ChevronsUpDown : orden.direccion === 'asc' ? ChevronUp : ChevronDown;
    return (
      <th className={`px-6 py-3 font-semibold ${className}`}>
        <button
          onClick={() => alternarOrden(campo)}
          className={`flex items-center gap-1 cursor-pointer transition-colors ${activo ? 'text-gray-900' : 'text-gray-600 hover:text-gray-800'
            }`}
        >
          {children}
          <Icono className={`w-3.5 h-3.5 ${activo ? 'text-gray-900' : 'text-gray-400'}`} />
        </button>
      </th>
    );
  };

  return (
    <div className="w-full">
      {/* Barra de herramientas: búsqueda + filtros */}
      <div className="flex flex-col gap-3 p-4 border-b border-gray-100 bg-white">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre, SKU o tag..."
              className="w-full pl-9 pr-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 outline-none text-sm"
            />
          </div>

          <select
            value={filtros.categoria}
            onChange={(e) => setFiltro('categoria', e.target.value)}
            className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 outline-none focus:ring-2 focus:ring-gray-900/10 cursor-pointer"
          >
            <option value="todas">Todas las categorías</option>
            {categorias.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select
            value={filtros.tipo}
            onChange={(e) => setFiltro('tipo', e.target.value)}
            className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 outline-none focus:ring-2 focus:ring-gray-900/10 cursor-pointer"
          >
            <option value="todos">Todos los tipos</option>
            {tipos.map((t) => (
              <option key={t} value={t}>{traducirTipo(t)}</option>
            ))}
          </select>

          <select
            value={filtros.estado}
            onChange={(e) => setFiltro('estado', e.target.value)}
            className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 outline-none focus:ring-2 focus:ring-gray-900/10 cursor-pointer"
          >
            <option value="todos">Todos los estados</option>
            <option value="activos">Solo activos</option>
            <option value="inactivos">Solo inactivos</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs">
          <span className="text-gray-500">
            Mostrando <span className="font-semibold text-gray-700">{productosFiltrados.length}</span> de {productosSinCombos.length}
          </span>
          <button
            onClick={() => setFiltro('estado', 'activos')}
            className="flex items-center gap-1.5 text-green-700 hover:underline cursor-pointer"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> {resumen.activos} activos
          </button>
          <button
            onClick={() => setFiltro('estado', 'inactivos')}
            className="flex items-center gap-1.5 text-gray-500 hover:underline cursor-pointer"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-gray-400" /> {resumen.inactivos} inactivos
          </button>
          {resumen.stockBajo > 0 && (
            <span className="flex items-center gap-1.5 text-yellow-700">
              <AlertTriangle className="w-3.5 h-3.5" /> {resumen.stockBajo} con stock bajo
            </span>
          )}
        </div>
      </div>

      <table className="hidden md:table w-full text-left text-sm">
        <thead className="bg-gray-50 border-b border-gray-200 text-gray-600">
          <tr>
            <th className="px-6 py-3 font-semibold">Producto</th>
            <th className="px-6 py-3 font-semibold">Categoría</th>
            <th className="px-6 py-3 font-semibold">SKU</th>
            <th className="px-6 py-3 font-semibold">Tipo</th>
            <ThOrdenable campo="qty_available_total">Stock</ThOrdenable>
            <ThOrdenable campo="base_price">Precio venta</ThOrdenable>
            <th className="px-6 py-3 font-semibold">Estado</th>
            <th className="px-6 py-3 font-semibold text-right">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {productosFiltrados.map((prod) => {
            const tieneImagenes = prod.images && prod.images.length > 0;
            const imagenPrincipal = tieneImagenes ? prod.images[0] : null;

            return (
              <tr
                key={prod.product_id}
                className={`hover:bg-gray-50/50 transition-colors ${!prod.is_active ? 'opacity-60' : ''}`}
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div
                      onClick={() => abrirVisor(prod)}
                      className={`w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 overflow-hidden border border-gray-200 shrink-0 relative group ${tieneImagenes ? 'cursor-pointer' : ''
                        }`}
                      title={tieneImagenes ? `Ver ${prod.images.length} foto(s)` : 'Sin imagen'}
                    >
                      {imagenPrincipal ? (
                        <>
                          <img
                            src={imagenPrincipal}
                            alt={prod.name}
                            className="w-full h-full object-cover group-hover:opacity-75 transition-opacity"
                          />
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                            <Eye className="w-4 h-4" />
                          </div>
                        </>
                      ) : (
                        <Package className="w-5 h-5" />
                      )}
                    </div>
                    <p className="font-medium text-gray-800">{prod.name}</p>
                  </div>
                </td>

                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    {prod.category_id}
                  </span>
                </td>

                <td className="px-6 py-4 font-mono text-xs text-gray-500">{prod.sku}</td>

                <td className="px-6 py-4">
                  <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-medium">
                    {traducirTipo(prod.product_type)}
                  </span>
                </td>

                <td className="px-6 py-4">
                  <div className={`flex items-center gap-1.5 font-semibold text-sm ${claseStock(prod.qty_available_total)}`}>
                    <Boxes className="w-3.5 h-3.5" />
                    {prod.qty_available_total ?? '—'}
                  </div>
                </td>

                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="text-gray-800 font-medium">S/ {prod.base_price?.toFixed(2)}</span>
                    {['rental', 'both'].includes(prod.product_type) && (
                      <span className="text-xs text-yellow-600 font-medium mt-0.5">
                        Alq: S/ {prod.rental_price_day?.toFixed(2)}/día
                      </span>
                    )}
                  </div>
                </td>

                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${prod.is_active ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-100 text-gray-500 border border-gray-200'
                      }`}
                  >
                    {prod.is_active ? <CircleDot className="w-3 h-3" /> : <CircleSlash className="w-3 h-3" />}
                    {prod.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                </td>

                <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                  <button onClick={() => onEdit(prod)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => onDelete(prod)} className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer">                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            );
          })}

          {productosFiltrados.length === 0 && (
            <tr>
              <td colSpan={8} className="px-6 py-12 text-center text-gray-400 text-sm">
                No hay productos que coincidan con la búsqueda o los filtros seleccionados.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {visor.abierto && visor.producto && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-8 bg-black/70 backdrop-blur-sm"
          onClick={cerrarVisor}
        >
          <div
            className="relative w-full max-w-6xl max-h-[95vh] bg-white rounded-2xl shadow-2xl flex flex-col md:flex-row overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={cerrarVisor}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 p-2 rounded-full transition-colors cursor-pointer z-50"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col-reverse md:flex-row md:w-2/3 p-6 gap-4 bg-white border-b md:border-b-0 md:border-r border-gray-100 overflow-y-auto">
              <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-y-auto custom-scrollbar md:w-24 shrink-0">
                {visor.producto.images.map((img, idx) => (
                  <div
                    key={idx}
                    onMouseEnter={() => setVisor((prev) => ({ ...prev, indiceActual: idx }))}
                    onClick={() => setVisor((prev) => ({ ...prev, indiceActual: idx }))}
                    className={`relative w-16 h-16 md:w-full md:aspect-square rounded-lg border-2 cursor-pointer transition-all overflow-hidden shrink-0 ${idx === visor.indiceActual
                        ? 'border-yellow-400 shadow-md ring-2 ring-yellow-400/20'
                        : 'border-gray-200 hover:border-yellow-300 opacity-70 hover:opacity-100'
                      }`}
                  >
                    <img src={img} className="w-full h-full object-cover bg-gray-50" alt={`Miniatura ${idx}`} />
                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[8px] text-center font-bold py-0.5 uppercase">
                      {getEtiquetaOrientacion(img, idx)}
                    </div>
                  </div>
                ))}
              </div>

              <div className="relative flex-1 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-100 overflow-hidden group min-h-[40vh] md:min-h-0">
                {visor.producto.images.length > 1 && (
                  <button onClick={imagenAnterior} className="absolute left-4 p-2.5 text-gray-800 bg-white/80 hover:bg-white rounded-full shadow-lg backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100 cursor-pointer z-10">
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                )}

                <img
                  src={visor.producto.images[visor.indiceActual]}
                  alt="Vista principal"
                  className="max-w-full max-h-[75vh] object-contain select-none"
                />

                <div className="absolute top-4 left-4 bg-white/90 text-gray-800 text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm border border-gray-200 uppercase tracking-wider backdrop-blur-md">
                  Ángulo: {getEtiquetaOrientacion(visor.producto.images[visor.indiceActual], visor.indiceActual)}
                </div>

                {visor.producto.images.length > 1 && (
                  <button onClick={siguienteImagen} className="absolute right-4 p-2.5 text-gray-800 bg-white/80 hover:bg-white rounded-full shadow-lg backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100 cursor-pointer z-10">
                    <ChevronRight className="w-6 h-6" />
                  </button>
                )}
              </div>
            </div>

            <div className="md:w-1/3 bg-gray-50 p-6 md:p-8 flex flex-col overflow-y-auto">
              <div className="mb-6 pr-8">
                <div className="flex items-center gap-2 flex-wrap mb-3">
                  <span className="inline-block bg-gray-200 text-gray-700 text-[10px] font-bold px-2 py-1 rounded-sm uppercase tracking-wider">
                    {visor.producto.category_id}
                  </span>
                  <span className="inline-block bg-gray-200 text-gray-700 text-[10px] font-bold px-2 py-1 rounded-sm uppercase tracking-wider">
                    {traducirTipo(visor.producto.product_type)}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-sm uppercase tracking-wider ${visor.producto.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'
                      }`}
                  >
                    {visor.producto.is_active ? <CircleDot className="w-2.5 h-2.5" /> : <CircleSlash className="w-2.5 h-2.5" />}
                    {visor.producto.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
                <h2 className="text-2xl font-extrabold text-gray-900 leading-tight mb-2">{visor.producto.name}</h2>
                <div className="flex items-center gap-2 text-sm text-gray-500 font-mono">
                  <Tag className="w-4 h-4" /> SKU: {visor.producto.sku}
                </div>
                <div className={`flex items-center gap-1.5 mt-2 text-sm font-semibold ${claseStock(visor.producto.qty_available_total)}`}>
                  <Boxes className="w-4 h-4" />
                  {visor.producto.qty_available_total ?? '—'} unidades disponibles
                </div>
              </div>

              <div className="bg-white rounded-xl border border-yellow-200 overflow-hidden mb-6 shadow-sm">
                <div className="bg-gradient-to-r from-yellow-400 to-yellow-300 px-4 py-2 text-yellow-900 text-xs font-bold uppercase tracking-wider flex justify-between items-center">
                  <span>Precios Chunchster</span>
                </div>

                <div className="p-4 space-y-4">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-xs text-gray-500 font-semibold uppercase mb-1">Precio de Venta</p>
                      <p className="text-3xl font-extrabold text-gray-900">S/ {visor.producto.base_price?.toFixed(2)}</p>
                    </div>
                  </div>

                  {['rental', 'both'].includes(visor.producto.product_type) && (
                    <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                      <div>
                        <p className="text-xs text-gray-500 font-semibold uppercase mb-1">Alquiler por Día</p>
                        <p className="text-xl font-bold text-yellow-600">S/ {visor.producto.rental_price_day?.toFixed(2)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-400 font-semibold mb-1">Depósito Garantía</p>
                        <p className="text-sm font-medium text-gray-600">S/ {visor.producto.rental_deposit?.toFixed(2)}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-auto space-y-3 pt-6">
                <p className="text-xs text-gray-400 text-center mb-2 uppercase tracking-wide font-semibold">Acciones Administrativas</p>
                <button
                  onClick={() => handleToggleActive(visor.producto)}
                  className={`w-full font-bold py-3 px-4 rounded-xl shadow-sm transition-transform active:scale-95 flex justify-center items-center gap-2 cursor-pointer border ${visor.producto.is_active
                      ? 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                      : 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                    }`}
                >
                  {visor.producto.is_active ? <PowerOff className="w-5 h-5" /> : <Power className="w-5 h-5" />}
                  {visor.producto.is_active ? 'Desactivar Producto' : 'Activar Producto'}
                </button>
                <button
                  onClick={() => {
                    cerrarVisor();
                    onEdit(visor.producto);
                  }}
                  className="w-full bg-gray-900 hover:bg-gray-800 text-white font-bold py-3 px-4 rounded-xl shadow-lg transition-transform active:scale-95 flex justify-center items-center gap-2 cursor-pointer"
                >
                  <Edit2 className="w-5 h-5" /> Editar Detalles
                </button>
                <button
                  onClick={() => {
                    cerrarVisor();
                    onDelete(visor.producto);
                  }}
                  className="w-full bg-white hover:bg-red-50 text-red-600 border border-red-200 font-bold py-3 px-4 rounded-xl transition-colors flex justify-center items-center gap-2 cursor-pointer"
                >
                  <Trash2 className="w-5 h-5" /> Eliminar Producto
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );


}