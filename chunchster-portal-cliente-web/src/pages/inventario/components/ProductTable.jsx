import { useState } from 'react';
import { Edit2, Trash2, Package, X, Eye } from 'lucide-react';

export default function ProductTable({ productos, onEdit, onDelete }) {
  // Estado para controlar la imagen que se está viendo en grande
  const [imagenGrande, setImagenGrande] = useState(null);

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
            const imagenUrl = prod.images && prod.images.length > 0 ? prod.images[0] : null;

            return (
              <tr key={prod.product_id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    {/* Miniatura con botón para ampliar */}
                    <div 
                      onClick={() => imagenUrl && setImagenGrande(imagenUrl)}
                      className={`w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 overflow-hidden border border-gray-200 shrink-0 relative group ${imagenUrl ? 'cursor-pointer' : ''}`}
                      title={imagenUrl ? "Haz clic para ampliar" : "Sin imagen"}
                    >
                      {imagenUrl ? (
                        <>
                          <img src={imagenUrl} alt={prod.name} className="w-full h-full object-cover group-hover:opacity-75 transition-opacity" />
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
                      <span className="text-xs text-chunchster font-medium mt-0.5">Alq: S/ {prod.rental_price_day?.toFixed(2)}/día</span>
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

      {/* MODAL / VISOR DE IMAGEN GRANDE (LIGHTBOX) */}
      {imagenGrande && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative max-w-4xl max-h-[90vh] bg-transparent flex flex-col items-center">
            <button 
              onClick={() => setImagenGrande(null)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 p-2 rounded-full bg-black/50 hover:bg-black/80 transition-colors cursor-pointer"
              title="Cerrar"
            >
              <X className="w-6 h-6" />
            </button>
            <img 
              src={imagenGrande} 
              alt="Vista previa ampliada" 
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl border border-white/10" 
            />
          </div>
        </div>
      )}
    </>
  );
}