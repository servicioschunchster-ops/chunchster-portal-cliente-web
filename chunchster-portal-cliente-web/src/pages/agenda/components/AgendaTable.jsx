import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Phone, MapPin, Store, StickyNote, CheckCircle, XCircle, Pencil, Eye } from 'lucide-react';
import { traducirEstado, ESTADO_COLOR, traducirTipoOrden } from '../../../utils/Orderhelpers.js';

const formatearFechaCorta = (fechaIso) => {
  if (!fechaIso) return null;
  const fechaLimpia = fechaIso.substring(0, 10);
  const [year, month, day] = fechaLimpia.split('-');
  if (!year || !month || !day) return null;
  const d = new Date(year, month - 1, day, 12, 0, 0);
  return d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' });
};

function PopoverInfo({ abierto, onCerrar, children, align = 'left' }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!abierto) return;
    const handleClickFuera = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onCerrar();
    };
    const handleEscape = (e) => {
      if (e.key === 'Escape') onCerrar();
    };
    document.addEventListener('mousedown', handleClickFuera);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickFuera);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [abierto, onCerrar]);

  if (!abierto) return null;

  return (
    <div
      ref={ref}
      onClick={(e) => e.stopPropagation()}
      className={`absolute z-20 top-full mt-1.5 ${
        align === 'right' ? 'right-0' : 'left-0'
      } w-64 bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-xs text-gray-700 whitespace-normal`}
    >
      {children}
    </div>
  );
}

function FilaPedido({ pedido, onUpdateStatus, onEditDates, onViewDetail }) {
  const esAlquiler = pedido.order_type === 'rental';
  const esDelivery = pedido.delivery_type === 'delivery';
  const isCancelled = pedido.status === 'cancelled';
  const isConfirmed = pedido.status === 'confirmed';
  const isDelivered = pedido.status === 'delivered';
  const cliente = pedido.cliente;

  const [popupAbierto, setPopupAbierto] = useState(null);
  const togglePopup = useCallback(
    (nombre) => setPopupAbierto((actual) => (actual === nombre ? null : nombre)),
    []
  );
  const cerrarPopup = useCallback(() => setPopupAbierto(null), []);

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

  const totalFormateado = useMemo(
    () => Number(pedido.total_amount || 0).toFixed(2),
    [pedido.total_amount]
  );

  const statusClasses = ESTADO_COLOR[pedido.status] || 'bg-gray-100 text-gray-600 border-gray-200';

  const handleConfirmar = useCallback(
    () => onUpdateStatus(pedido.order_id, 'confirmed'),
    [onUpdateStatus, pedido.order_id]
  );
  const handleCancelar = useCallback(
    () => onUpdateStatus(pedido.order_id, 'cancelled'),
    [onUpdateStatus, pedido.order_id]
  );
  const handleEditar = useCallback(() => onEditDates?.(pedido), [onEditDates, pedido]);
  const handleVerDetalle = useCallback(() => onViewDetail?.(pedido), [onViewDetail, pedido]);

  return (
    <tr className={`border-b border-gray-100 last:border-0 hover:bg-gray-50/60 transition-colors ${isCancelled ? 'opacity-60' : ''}`}>
      <td className="py-3 pl-4 pr-3 whitespace-nowrap">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold text-gray-800 bg-gray-100 px-2 py-0.5 rounded">
            {pedido.order_number}
          </span>
          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${statusClasses}`}>
            {traducirEstado(pedido.status)}
          </span>
        </div>
      </td>

      <td className="py-3 px-3 min-w-[160px]">
        <p className="font-semibold text-gray-900 text-sm truncate max-w-[180px]">
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
          <p className="text-xs text-gray-400 font-mono truncate max-w-[180px]">{pedido.customer_id}</p>
        )}
      </td>

      <td className="py-3 px-3 min-w-[150px] relative">
        {esDelivery ? (
          <button
            type="button"
            onClick={() => togglePopup('lugar')}
            className="flex items-center gap-1.5 text-xs text-gray-700 hover:text-yellow-600 transition-colors cursor-pointer"
          >
            <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <span className="truncate max-w-[140px]">{direccionCorta || 'Sin dirección'}</span>
          </button>
        ) : (
          <div className="flex items-center gap-1.5 text-xs text-gray-700">
            <Store className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            Recojo en tienda
          </div>
        )}
        <PopoverInfo abierto={popupAbierto === 'lugar'} onCerrar={cerrarPopup}>
          <p className="font-semibold text-gray-900 mb-1">Dirección de entrega</p>
          <p>{direccionCompleta || 'Sin dirección registrada'}</p>
        </PopoverInfo>
      </td>

      <td className="py-3 px-3 whitespace-nowrap text-xs text-gray-700">
        {esAlquiler ? (
          <span>
            <span className="text-gray-400">Entrega</span> {fechaEntrega || '-'}
            {'  ·  '}
            <span className="text-gray-400">Dev.</span> {fechaDevolucion || '-'}
          </span>
        ) : (fechaEntrega || fechaEntregaReal) ? (
          <span>
            <span className="text-gray-400">{isDelivered ? 'Entregado' : 'Entrega est.'}</span>{' '}
            {isDelivered ? (fechaEntregaReal || fechaEntrega) : fechaEntrega}
          </span>
        ) : (
          <span className="text-gray-300">—</span>
        )}
      </td>

      <td className="py-3 px-3 text-right font-bold text-gray-900 text-sm whitespace-nowrap">
        S/ {totalFormateado}
      </td>

      <td className="py-3 px-3 text-center relative">
        {pedido.notes ? (
          <>
            <button
              type="button"
              onClick={() => togglePopup('nota')}
              className="cursor-pointer"
            >
              <StickyNote className="w-4 h-4 text-yellow-500 inline-block hover:text-yellow-600 transition-colors" />
            </button>
            <PopoverInfo abierto={popupAbierto === 'nota'} onCerrar={cerrarPopup} align="right">
              <p className="font-semibold text-gray-900 mb-1">Nota del pedido</p>
              <p>{pedido.notes}</p>
            </PopoverInfo>
          </>
        ) : (
          <span className="text-gray-200">—</span>
        )}
      </td>

      <td className="py-3 pr-4 pl-3">
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={handleVerDetalle}
            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer"
            title="Ver detalle del pedido"
          >
            <Eye className="w-4 h-4" />
          </button>
          {onEditDates && (
            <button
              onClick={handleEditar}
              className="p-1.5 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded transition-colors cursor-pointer"
              title="Editar fechas"
            >
              <Pencil className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={handleConfirmar}
            disabled={isConfirmed || isCancelled}
            className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors disabled:opacity-30 cursor-pointer"
            title="Confirmar pedido"
          >
            <CheckCircle className="w-4 h-4" />
          </button>
          <button
            onClick={handleCancelar}
            disabled={isCancelled}
            className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-30 cursor-pointer"
            title="Cancelar pedido"
          >
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function AgendaTable({ pedidos, onUpdateStatus, onEditDates, onViewDetail }) {
  if (!pedidos || pedidos.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-gray-100 text-[10px] font-bold uppercase text-gray-400 tracking-wide">
            <th className="py-2.5 pl-4 pr-3 font-bold">Pedido</th>
            <th className="py-2.5 px-3 font-bold">Cliente</th>
            <th className="py-2.5 px-3 font-bold">Lugar</th>
            <th className="py-2.5 px-3 font-bold">Fechas</th>
            <th className="py-2.5 px-3 font-bold text-right">Total</th>
            <th className="py-2.5 px-3 font-bold text-center">Nota</th>
            <th className="py-2.5 pr-4 pl-3 font-bold text-right">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {pedidos.map((pedido) => (
            <FilaPedido
              key={pedido.order_id}
              pedido={pedido}
              onUpdateStatus={onUpdateStatus}
              onEditDates={onEditDates}
              onViewDetail={onViewDetail}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}