import { Package, Edit2, Trash2, CircleDot, CircleSlash, Boxes } from 'lucide-react';

export default function PackageTable({ paquetes, onEdit, onDelete }) {
  if (paquetes.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center text-gray-400 text-sm">
        No hay paquetes creados todavía.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="bg-gray-50 border-b border-gray-200 text-gray-600">
          <tr>
            <th className="px-6 py-3 font-semibold">Paquete</th>
            <th className="px-6 py-3 font-semibold">Categoría</th>
            <th className="px-6 py-3 font-semibold">SKU</th>
            <th className="px-6 py-3 font-semibold">Tipo</th>
            <th className="px-6 py-3 font-semibold">Disponibles</th>
            <th className="px-6 py-3 font-semibold">Precio</th>
            <th className="px-6 py-3 font-semibold">Estado</th>
            <th className="px-6 py-3 font-semibold text-right">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {paquetes.map((p) => (
            <tr key={p.product_id} className={`hover:bg-gray-50/50 transition-colors ${!p.is_active ? 'opacity-60' : ''}`}>
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500 border border-indigo-100 shrink-0">
                    <Package className="w-5 h-5" />
                  </div>
                  <p className="font-medium text-gray-800">{p.name}</p>
                </div>
              </td>
              <td className="px-6 py-4">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  {p.category_id}
                </span>
              </td>
              <td className="px-6 py-4 font-mono text-xs text-gray-500">{p.sku}</td>
              <td className="px-6 py-4">
                <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-medium">
                  {p.product_type === 'sale' ? 'Venta' : p.product_type === 'rental' ? 'Alquiler' : 'Venta y Alquiler'}
                </span>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-1.5 font-semibold text-sm text-gray-700">
                  <Boxes className="w-3.5 h-3.5" />
                  {p.qty_available_total ?? p.package_available_qty ?? '—'}
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="flex flex-col">
                  {p.base_price != null && (
                    <span className="text-gray-800 font-medium">S/ {Number(p.base_price).toFixed(2)}</span>
                  )}
                  {p.rental_price_day != null && (
                    <span className="text-xs text-indigo-600 font-medium mt-0.5">
                      Alq: S/ {Number(p.rental_price_day).toFixed(2)}/día
                    </span>
                  )}
                </div>
              </td>
              <td className="px-6 py-4">
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    p.is_active ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-100 text-gray-500 border border-gray-200'
                  }`}
                >
                  {p.is_active ? <CircleDot className="w-3 h-3" /> : <CircleSlash className="w-3 h-3" />}
                  {p.is_active ? 'Activo' : 'Inactivo'}
                </span>
              </td>
              <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                <button onClick={() => onEdit(p)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => onDelete(p)} className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer">
                  <Trash2 className="w-4 h-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}