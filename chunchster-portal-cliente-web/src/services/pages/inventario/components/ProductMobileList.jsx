import { Edit2, Trash2, Package } from 'lucide-react';

export default function ProductMobileList({ productos, onEdit, onDelete }) {
  return (
    <div className="block md:hidden divide-y divide-gray-100">
      {productos.map((prod) => {
        const imagenUrl = prod.images && prod.images.length > 0 ? prod.images[0] : null;

        return (
          <div key={prod.product_id} className="p-4 space-y-3">
            <div className="flex justify-between items-start gap-3">
              <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 overflow-hidden border border-gray-200 shrink-0">
                {imagenUrl ? (
                  <img src={imagenUrl} alt={prod.name} className="w-full h-full object-cover" />
                ) : (
                  <Package className="w-6 h-6" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-800">{prod.name}</h3>
                <p className="text-xs text-gray-500 font-mono mt-0.5">SKU: {prod.sku}</p>
              </div>
              <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium shrink-0">Activo</span>
            </div>
            
            <div className="flex justify-between text-sm pt-1">
              <span className="text-gray-500">Precio Venta:</span>
              <span className="font-medium">S/ {prod.base_price?.toFixed(2)}</span>
            </div>
            {['rental', 'both'].includes(prod.product_type) && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Alquiler/Día:</span>
                <span className="font-medium text-chunchster">S/ {prod.rental_price_day?.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => onEdit(prod)} className="p-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100">
                <Edit2 className="w-4 h-4" />
              </button>
              <button onClick={() => onDelete(prod.product_id)} className="p-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}