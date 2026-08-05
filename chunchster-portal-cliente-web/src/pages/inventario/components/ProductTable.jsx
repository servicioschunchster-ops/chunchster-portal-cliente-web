import { useState } from 'react';
import { Edit2, Trash2, Package, X, Eye, ChevronLeft, ChevronRight } from 'lucide-react';

export default function ProductTable({ productos, onEdit, onDelete }) {
  // Estado para controlar el carrusel de imágenes
  const [visor, setVisor] = useState({
    abierto: false,
    imagenes: [],
    indiceActual: 0
  });

  const abrirVisor = (imagenes) => {
    if (imagenes && imagenes.length > 0) {
      setVisor({ abierto: true, imagenes, indiceActual: 0 });
    }
  };

  const cerrarVisor = () => {
    setVisor({ abierto: false, imagenes: [], indiceActual: 0 });
  };

  const siguienteImagen = (e) => {
    e.stopPropagation(); // Evita que el clic cierre el modal
    setVisor(prev => ({
      ...prev,
      indiceActual: (prev.indiceActual + 1) % prev.imagenes.length
    }));
  };

  const imagenAnterior = (e) => {
    e.stopPropagation();
    setVisor(prev => ({
      ...prev,
      indiceActual: (prev.indiceActual - 1 + prev.imagenes.length) % prev.imagenes.length
    }));
  };

  return (
    <>
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
                    {/* Miniatura con botón para abrir carrusel */}
                    <div 
                      onClick={() => abrirVisor(prod.images)}
                      className={`w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 overflow-hidden border border-gray-200 shrink-0 relative group ${tieneImagenes ? 'cursor-pointer' : ''}`}
                      title={tieneImagenes ? `Ver ${prod.images.length} foto(s)` : "Sin imagen"}
                    >
                      {imagenPrincipal ? (
                        <>
                          <img src={imagenPrincipal} alt={prod.name} className="w-full h-full object-cover group-hover:opacity-75 transition-opacity" />
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                            <Eye className="w-4 h-4" />
                          </div>
                          {/* Indicador de cantidad de fotos si hay más de 1 */}
                          {prod.images.length > 1 && (
                            <span className="absolute bottom-0.5 right-0.5 bg-black/70 text-white text-[9px] font-bold px-1 rounded-sm">
                              +{prod.images.length - 1}
                            </span>
                          )}
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
                  <button onClick={() => onEdit(prod)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer" title="Editar">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => onDelete(prod.product_id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer" title="Eliminar">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            );
          })}
          {productos.length === 0 && (
            <tr>
              <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                <Package className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <p>No se encontraron productos en el inventario.</p>
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* MODAL / VISOR CARRUSEL DE IMÁGENES (LIGHTBOX) */}
      {visor.abierto && (
        <div 
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
          onClick={cerrarVisor}
        >
          <div className="relative max-w-5xl w-full max-h-[90vh] bg-transparent flex flex-col items-center" onClick={e => e.stopPropagation()}>
            
            {/* Botón Cerrar */}
            <button 
              onClick={cerrarVisor}
              className="absolute -top-12 right-0 md:-right-12 md:top-0 text-white/70 hover:text-white p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors cursor-pointer z-50"
              title="Cerrar visor"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Contenedor principal de la imagen con flechas */}
            <div className="relative w-full flex items-center justify-center group">
              
              {/* Botón Anterior (solo si hay más de 1 imagen) */}
              {visor.imagenes.length > 1 && (
                <button 
                  onClick={imagenAnterior}
                  className="absolute left-2 md:-left-16 p-3 text-white bg-black/50 hover:bg-white/20 rounded-full backdrop-blur-md transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100 cursor-pointer z-50"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
              )}

              {/* Imagen actual */}
              <img 
                src={visor.imagenes[visor.indiceActual]} 
                alt={`Imagen ${visor.indiceActual + 1}`} 
                className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl transition-opacity duration-300 select-none" 
              />

              {/* Botón Siguiente (solo si hay más de 1 imagen) */}
              {visor.imagenes.length > 1 && (
                <button 
                  onClick={siguienteImagen}
                  className="absolute right-2 md:-right-16 p-3 text-white bg-black/50 hover:bg-white/20 rounded-full backdrop-blur-md transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100 cursor-pointer z-50"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              )}
            </div>

            {/* Indicador de posición (ej. "2 / 4") */}
            {visor.imagenes.length > 1 && (
              <div className="absolute -bottom-10 bg-black/50 text-white text-sm font-medium px-4 py-1.5 rounded-full backdrop-blur-md">
                {visor.indiceActual + 1} / {visor.imagenes.length}
              </div>
            )}
            
          </div>
        </div>
      )}
    </>
  );
}