import { useState, useEffect } from 'react';
import { X, Loader2, Package, MapPin, Store } from 'lucide-react';
import { agendaService } from '../../../services/agendaService';
import { catalogService } from '../../../services/invService';
import { traducirEstado, ESTADO_COLOR } from '../../../utils/Orderhelpers.js';

export default function OrderDetailModal({ isOpen, onClose, orderId }) {
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  const [orden, setOrden] = useState(null);
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (isOpen && orderId) {
      cargarDetalle();
    }
  }, [isOpen, orderId]);

  const cargarDetalle = async () => {
    setCargando(true);
    setError(null);
    try {
      const res = await agendaService.getOrderDetails(orderId);
      const ordenData = res?.data?.order ?? null;
      const itemsData = res?.data?.items ?? [];

      // El product_name del pedido suele venir genérico ("Producto"),
      // así que resolvemos el nombre real consultando el catálogo por item.
      const itemsConProducto = await Promise.all(
        itemsData.map(async (item) => {
          try {
            const prodRes = await catalogService.getProductDetails(item.product_id);
            const producto = prodRes?.data?.product ?? prodRes?.data ?? null;
            return { ...item, producto };
          } catch (err) {
            return { ...item, producto: null };
          }
        })
      );

      setOrden(ordenData);
      setItems(itemsConProducto);
    } catch (err) {
      console.error('Error al cargar el detalle del pedido', err);
      setError('No se pudo cargar el detalle del pedido.');
    } finally {
      setCargando(false);
    }
  };

  if (!isOpen) return null;

  const statusClasses = orden ? (ESTADO_COLOR[orden.status] || 'bg-gray-100 text-gray-600 border-gray-200') : '';

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl max-h-[85vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              {orden ? orden.order_number : 'Detalle del pedido'}
            </h3>
            {orden && (
              <span className={`inline-block mt-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${statusClasses}`}>
                {traducirEstado(orden.status)}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4">
          {cargando && (
            <div className="flex justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-yellow-500" />
            </div>
          )}

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-200">
              {error}
            </div>
          )}

          {!cargando && !error && orden && (
            <>
              <div className="flex items-start gap-2 text-sm text-gray-600">
                {orden.delivery_type === 'delivery' ? (
                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                ) : (
                  <Store className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                )}
                <span>
                  {orden.delivery_type === 'delivery'
                    ? [orden.delivery_address?.street, orden.delivery_address?.district, orden.delivery_address?.city].filter(Boolean).join(', ') || 'Sin dirección'
                    : 'Recojo en tienda'}
                </span>
              </div>

              {orden.notes && (
                <p className="text-sm text-gray-500 bg-gray-50 border border-gray-100 rounded-lg p-3">
                  {orden.notes}
                </p>
              )}

              <div>
                <p className="text-xs font-bold uppercase text-gray-400 mb-2">Productos</p>
                <div className="space-y-2">
                  {items.map((item) => (
                    <div
                      key={item.item_id}
                      className="flex items-center gap-3 border border-gray-100 rounded-lg p-3"
                    >
                      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-200 shrink-0">
                        {item.producto?.images?.[0] ? (
                          <img src={item.producto.images[0]} alt={item.producto?.name} className="w-full h-full object-cover" />
                        ) : (
                          <Package className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">
                          {item.producto?.name || item.product_name || 'Producto sin nombre'}
                        </p>
                        <p className="text-xs text-gray-400">
                          {item.quantity} x S/ {Number(item.unit_price || 0).toFixed(2)}
                        </p>
                      </div>
                      <p className="text-sm font-bold text-gray-900 whitespace-nowrap">
                        S/ {Number((item.unit_price || 0) * (item.quantity || 0)).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                <span className="text-sm font-semibold text-gray-600">Total</span>
                <span className="text-lg font-bold text-gray-900">S/ {Number(orden.total_amount || 0).toFixed(2)}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}