import { useMemo, useCallback } from 'react';
import {
  User,
  Phone,
  MapPin,
  Store,
  StickyNote,
  CheckCircle,
  XCircle,
  Pencil,
} from 'lucide-react';
import { traducirEstado, ESTADO_COLOR, traducirTipoOrden } from '../../../utils/Orderhelpers.js';

// Formateador de fecha fuera del componente: no se re-crea en cada render.
const formatearFechaCorta = (fechaIso) => {
  if (!fechaIso) return null;

  const fechaLimpia = fechaIso.substring(0, 10);
  const [year, month, day] = fechaLimpia.split('-');
  if (!year || !month || !day) return null;

  // Fecha en zona horaria LOCAL al mediodía para evitar saltos por UTC offset
  const d = new Date(year, month - 1, day, 12, 0, 0);
  return d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' });
};

export default function AgendaCard({ pedido, onUpdateStatus, onEditDates }) {
  const esAlquiler = pedido.order_type === 'rental';
  const esDelivery = pedido.delivery_type === 'delivery';
  const isCancelled = pedido.status === 'cancelled';
  const isConfirmed = pedido.status === 'confirmed';
  const isDelivered = pedido.status === 'delivered';

  const cliente = pedido.cliente; // adjuntado en Agenda.jsx a partir de /customers

  // --- Fechas (aplican tanto a alquiler como a venta con delivery) ---
  const fechaEntrega = useMemo(
    () => formatearFechaCorta(pedido.estimated_delivery_date || pedido.rental_start),
    [pedido.estimated_delivery_date, pedido.rental_start]
  );
  const fechaEntregaReal = useMemo(
    () => formatearFechaCorta(pedido.actual_delivery_date),
    [pedido.actual_delivery_date]
  );
  const fechaDevolucion = useMemo(
    () => formatearFechaCorta(pedido.rental_return_date_actual || pedido.rental_end),
    [pedido.rental_return_date_actual, pedido.rental_end]
  );

  const totalFormateado = useMemo(
    () => Number(pedido.total_amount || 0).toFixed(2),
    [pedido.total_amount]
  );

  const statusClasses = ESTADO_COLOR[pedido.status] || 'bg-gray-100 text-gray-600 border-gray-200';
  const statusLabel = traducirEstado(pedido.status);

  // --- Dirección compacta para delivery ---
  const direccionCorta = useMemo(() => {
    const dir = pedido.delivery_address;
    if (!dir) return null;
    return [dir.district, dir.city].filter(Boolean).join(', ');
  }, [pedido.delivery_address]);

  const direccionCompleta = useMemo(() => {
    const dir = pedido.delivery_address;
    if (!dir) return '';
    return [dir.street, dir.district, dir.city].filter(Boolean).join(', ');
  }, [pedido.delivery_address]);

  const handleConfirmar = useCallback(
    () => onUpdateStatus(pedido.order_id, 'confirmed'),
    [onUpdateStatus, pedido.order_id]
  );
  const handleCancelar = useCallback(
    () => onUpdateStatus(pedido.order_id, 'cancelled'),
    [onUpdateStatus, pedido.order_id]
  );
  const handleEditar = useCallback(() => onEditDates?.(pedido), [onEditDates, pedido]);

  return (
    <article
      className={`bg-white p-4 rounded-xl border ${
        isCancelled ? 'border-red-200 opacity-75' : 'border-gray-200'
      } shadow-sm hover:shadow-md transition-shadow relative flex flex-col justify-between h-full`}
    >
      <div
        className={`absolute left-0 top-0 bottom-0 w-1 ${
          esAlquiler ? 'bg-yellow-400' : 'bg-blue-500'
        } rounded-l-xl`}
      />

      <div className="pl-2 space-y-3">
        {/* Cabecera: N° pedido, estado, tipo y total */}
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-mono font-bold text-gray-800 bg-gray-100 px-2 py-0.5 rounded">
                {pedido.order_number}
              </span>
              <span
                className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${statusClasses}`}
              >
                {statusLabel}
              </span>
            </div>
            <span className="text-[10px] font-semibold uppercase text-gray-400 tracking-wide">
              {traducirTipoOrden(pedido.order_type)}
            </span>
          </div>
          <span className="text-base font-bold text-gray-900">S/ {totalFormateado}</span>
        </div>

        {/* Cliente: nombre + teléfono (dato real, no el UUID) */}
        <div className="flex items-start gap-2 text-sm text-gray-700">
          <User className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 truncate">
              {cliente?.name || 'Cliente sin datos'}
            </p>
            {cliente?.phone_e164 ? (
              <a
                href={`tel:${cliente.phone_e164}`}
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-yellow-600 transition-colors"
              >
                <Phone className="w-3 h-3" /> {cliente.phone_e164}
              </a>
            ) : (
              <p className="text-xs text-gray-400 font-mono truncate">{pedido.customer_id}</p>
            )}
          </div>
        </div>

        {/* Lugar: dirección de entrega o recojo en tienda */}
        <div className="flex items-center gap-2 text-sm">
          {esDelivery ? (
            <div className="flex items-start gap-2 text-gray-700" title={direccionCompleta || undefined}>
              <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
              <span className="text-xs leading-snug">{direccionCorta || 'Dirección no registrada'}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-gray-700">
              <Store className="w-4 h-4 text-gray-400" />
              <span className="text-xs">Recojo en tienda</span>
            </div>
          )}
        </div>

        {/* Fechas: entrega/devolución para alquiler, entrega para venta */}
        {esAlquiler ? (
          <div className="bg-gray-50 rounded-lg p-2.5 flex items-center justify-between border border-gray-100 group">
            <div className="flex gap-4">
              <div>
                <p className="text-[10px] uppercase text-gray-400 font-bold">Entrega</p>
                <p className="font-semibold text-gray-900 text-sm">{fechaEntrega || '-'}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase text-gray-400 font-bold">Devolución</p>
                <p className="font-semibold text-gray-900 text-sm">{fechaDevolucion || '-'}</p>
              </div>
            </div>
            {onEditDates && (
              <button
                onClick={handleEditar}
                className="p-1.5 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded transition-colors opacity-0 group-hover:opacity-100"
                title="Editar fechas"
              >
                <Pencil className="w-4 h-4" />
              </button>
            )}
          </div>
        ) : (
          (fechaEntrega || fechaEntregaReal) && (
            <div className="bg-gray-50 rounded-lg p-2.5 flex items-center justify-between border border-gray-100 group">
              <div>
                <p className="text-[10px] uppercase text-gray-400 font-bold">
                  {isDelivered ? 'Entregado' : 'Entrega estimada'}
                </p>
                <p className="font-semibold text-gray-900 text-sm">
                  {isDelivered ? (fechaEntregaReal || fechaEntrega) : fechaEntrega}
                </p>
              </div>
              {onEditDates && (
                <button
                  onClick={handleEditar}
                  className="p-1.5 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded transition-colors opacity-0 group-hover:opacity-100"
                  title="Editar fecha de entrega"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              )}
            </div>
          )
        )}

        {/* Nota del pedido, si existe */}
        {pedido.notes && (
          <div className="flex items-start gap-2 text-xs text-gray-500 bg-yellow-50/60 border border-yellow-100 rounded-lg px-2.5 py-1.5">
            <StickyNote className="w-3.5 h-3.5 text-yellow-500 mt-0.5 shrink-0" />
            <span className="line-clamp-2">{pedido.notes}</span>
          </div>
        )}
      </div>

      <div className="pl-2 pt-4 mt-auto flex justify-end gap-2 border-t border-gray-50">
        <button
          onClick={handleConfirmar}
          disabled={isConfirmed || isCancelled}
          className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-30 cursor-pointer"
          title="Confirmar pedido"
        >
          <CheckCircle className="w-5 h-5" />
        </button>
        <button
          onClick={handleCancelar}
          disabled={isCancelled}
          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30 cursor-pointer"
          title="Cancelar pedido"
        >
          <XCircle className="w-5 h-5" />
        </button>
      </div>
    </article>
  );
}