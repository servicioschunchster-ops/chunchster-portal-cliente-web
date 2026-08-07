import { useState } from 'react';
import { Edit2, Trash2, Package, X, Eye, ChevronLeft, ChevronRight, LayoutGrid, List, Tag, ShoppingCart } from 'lucide-react';

export default function ProductTable({ productos, onEdit, onDelete }) {
  const [modoVista, setModoVista] = useState('resumen'); 
  
  // Actualizamos el estado del visor para guardar TODO el objeto del producto
  const [visor, setVisor] = useState({
    abierto: false,
    producto: null,
    indiceActual: 0
  });

  // Al abrir, pasamos el producto completo
  const abrirVisor = (producto, index = 0) => {
    if (producto.images && producto.images.length > 0) {
      setVisor({ abierto: true, producto, indiceActual: index });
    }
  };

  const cerrarVisor = () => {
    setVisor({ abierto: false, producto: null, indiceActual: 0 });
  };

  const siguienteImagen = (e) => {
    e.stopPropagation();
    setVisor(prev => ({
      ...prev,
      indiceActual: (prev.indiceActual + 1) % prev.producto.images.length
    }));
  };

  const imagenAnterior = (e) => {
    e.stopPropagation();
    setVisor(prev => ({
      ...prev,
      indiceActual: (prev.indiceActual - 1 + prev.producto.images.length) % prev.producto.images.length
    }));
  };

  const getEtiquetaOrientacion = (url, index) => {
    if (!url) return `Foto ${index + 1}`;
    
    // Buscamos la carpeta de orientación dentro de la URL de AWS
    if (url.includes('/FRONT/')) return 'Frente';
    if (url.includes('/BACK/')) return 'Atrás';
    if (url.includes('/LEFT/')) return 'Izquierda';
    if (url.includes('/RIGHT/')) return 'Derecha';
    
    return `Foto ${index + 1}`;
  };

  return (
    <div className="w-full">
      {/* Controles de Vista */}
      <div className="flex justify-end p-4 border-b border-gray-100 bg-white">
        <div className="flex bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setModoVista('resumen')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer ${
              modoVista === 'resumen' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <List className="w-4 h-4" /> Resumen
          </button>
          <button
            onClick={() => setModoVista('detalle')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer ${
              modoVista === 'detalle' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <LayoutGrid className="w-4 h-4" /> Detalle
          </button>
        </div>
      </div>

      {/* VISTA RESUMEN (TABLA CLÁSICA) */}
      {modoVista === 'resumen' && (
        <table className="hidden md:table w-full text-left text-sm">
          <thead className="bg-gray-50 border-b border-gray-200 text-gray-600">
            <tr>
              <th className="px-6 py-4 font-semibold">Producto</th>
              <th className="px-6 py-4 font-semibold">SKU</th>
              <th className="px-6 py-4 font-semibold">Tipo</th>
              <th className="px-6 py-4 font-semibold">Precios (Venta / Alquiler)</th>
              <th className="px-6 py-4 font-semibold text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {productos.map((prod) => {
              const tieneImagenes = prod.images && prod.images.length > 0;
              const imagenPrincipal = tieneImagenes ? prod.images[0] : null;

              return (
                <tr key={prod.product_id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div 
                        onClick={() => abrirVisor(prod)}
                        className={`w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 overflow-hidden border border-gray-200 shrink-0 relative group ${tieneImagenes ? 'cursor-pointer' : ''}`}
                        title={tieneImagenes ? `Ver ${prod.images.length} foto(s)` : "Sin imagen"}
                      >
                        {imagenPrincipal ? (
                          <>
                            <img src={imagenPrincipal} alt={prod.name} className="w-full h-full object-cover group-hover:opacity-75 transition-opacity" />
                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                              <Eye className="w-4 h-4" />
                            </div>
                          </>
                        ) : (
                          <Package className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{prod.name}</p>
                        <p className="text-xs text-gray-500">{prod.category_id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-gray-600">{prod.sku}</td>
                  <td className="px-6 py-4">
                    <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-medium capitalize">
                      {prod.product_type}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-gray-800 font-medium">S/ {prod.base_price?.toFixed(2)}</span>
                      {['rental', 'both'].includes(prod.product_type) && (
                        <span className="text-xs text-yellow-600 font-medium mt-0.5">Alq: S/ {prod.rental_price_day?.toFixed(2)}/día</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button onClick={() => onEdit(prod)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => onDelete(prod.product_id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {/* VISTA DETALLADA (GRID) */}
      {modoVista === 'detalle' && (
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 bg-gray-50">
          {productos.map((prod) => (
            <div key={prod.product_id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow flex flex-col">
              <div className="p-3 bg-gray-50/50 border-b border-gray-100">
                {prod.images && prod.images.length > 0 ? (
                  <div className={`grid gap-2 ${prod.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                    {prod.images.slice(0, 4).map((img, idx) => (
                      <div 
                        key={idx} 
                        onClick={() => abrirVisor(prod, idx)}
                        className={`relative bg-white border border-gray-200 rounded-lg overflow-hidden cursor-pointer group hover:border-yellow-400 ${prod.images.length === 3 && idx === 0 ? 'col-span-2 aspect-[2/1]' : 'aspect-square'}`}
                      >
                        <img src={img} alt={`${prod.name} ángulo ${idx}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        <div className="absolute top-1.5 left-1.5 bg-black/60 text-white text-[9px] font-bold px-1.5 py-0.5 rounded backdrop-blur-sm uppercase tracking-wider">
                          {getEtiquetaOrientacion(img, idx)}
                        </div>
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                          <Eye className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 drop-shadow-md" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="w-full aspect-square flex items-center justify-center bg-white border border-gray-200 rounded-lg text-gray-300">
                    <Package className="w-12 h-12" />
                  </div>
                )}
              </div>
              <div className="p-4 flex flex-col flex-1">
                <div className="mb-4">
                  <span className="text-[10px] font-bold tracking-wider text-gray-400 uppercase">{prod.category_id}</span>
                  <h3 className="font-bold text-gray-900 leading-tight mt-1 line-clamp-2">{prod.name}</h3>
                  <p className="font-mono text-xs text-gray-500 mt-1">{prod.sku}</p>
                </div>
                <div className="mt-auto grid grid-cols-2 gap-2 bg-gray-50 rounded-lg p-3 border border-gray-100">
                  <div>
                    <p className="text-[10px] uppercase text-gray-500 font-semibold">Venta</p>
                    <p className="font-bold text-gray-900 text-sm">S/ {prod.base_price?.toFixed(2)}</p>
                  </div>
                  {['rental', 'both'].includes(prod.product_type) && (
                    <div className="border-l border-gray-200 pl-2">
                      <p className="text-[10px] uppercase text-gray-500 font-semibold">Alquiler</p>
                      <p className="font-bold text-yellow-600 text-sm">S/ {prod.rental_price_day?.toFixed(2)}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL ESTILO E-COMMERCE (TEMU/AMAZON) */}
      {visor.abierto && visor.producto && (
        <div 
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-8 bg-black/70 backdrop-blur-sm"
          onClick={cerrarVisor}
        >
          <div 
            className="relative w-full max-w-6xl max-h-[95vh] bg-white rounded-2xl shadow-2xl flex flex-col md:flex-row overflow-hidden" 
            onClick={e => e.stopPropagation()}
          >
            {/* Botón Cerrar (Esquina superior derecha) */}
            <button 
              onClick={cerrarVisor}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 p-2 rounded-full transition-colors cursor-pointer z-50"
            >
              <X className="w-5 h-5" />
            </button>

            {/* SECCIÓN 1: GALERÍA DE IMÁGENES (Izquierda) */}
            <div className="flex flex-col-reverse md:flex-row md:w-2/3 p-6 gap-4 bg-white border-b md:border-b-0 md:border-r border-gray-100 overflow-y-auto">
              
              {/* Tira de Miniaturas (Vertical en Desktop, Horizontal en Mobile) */}
              <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-y-auto custom-scrollbar md:w-24 shrink-0">
                {visor.producto.images.map((img, idx) => (
                  <div 
                    key={idx}
                    onMouseEnter={() => setVisor(prev => ({ ...prev, indiceActual: idx }))} // Cambia al pasar el mouse (Estilo Amazon)
                    onClick={() => setVisor(prev => ({ ...prev, indiceActual: idx }))}
                    className={`relative w-16 h-16 md:w-full md:aspect-square rounded-lg border-2 cursor-pointer transition-all overflow-hidden shrink-0 ${
                      idx === visor.indiceActual ? 'border-yellow-400 shadow-md ring-2 ring-yellow-400/20' : 'border-gray-200 hover:border-yellow-300 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img} className="w-full h-full object-cover bg-gray-50" alt={`Miniatura ${idx}`} />
                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[8px] text-center font-bold py-0.5 uppercase">
                      {getEtiquetaOrientacion(img, idx)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Imagen Principal Grande */}
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

            {/* SECCIÓN 2: DETALLES DEL PRODUCTO (Derecha) */}
            <div className="md:w-1/3 bg-gray-50 p-6 md:p-8 flex flex-col overflow-y-auto">
              <div className="mb-6 pr-8">
                <span className="inline-block bg-gray-200 text-gray-700 text-[10px] font-bold px-2 py-1 rounded-sm uppercase tracking-wider mb-3">
                  {visor.producto.category_id}
                </span>
                <h2 className="text-2xl font-extrabold text-gray-900 leading-tight mb-2">
                  {visor.producto.name}
                </h2>
                <div className="flex items-center gap-2 text-sm text-gray-500 font-mono">
                  <Tag className="w-4 h-4" /> SKU: {visor.producto.sku}
                </div>
              </div>

              {/* Panel de Precios Estilo E-Commerce */}
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

              {/* Botones de Acción (Admin) */}
              <div className="mt-auto space-y-3 pt-6">
                <p className="text-xs text-gray-400 text-center mb-2 uppercase tracking-wide font-semibold">Acciones Administrativas</p>
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
                    onDelete(visor.producto.product_id);
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