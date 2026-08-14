import { useState, useEffect } from 'react';
import { X, Loader2, Calendar, AlertCircle } from 'lucide-react';
import { agendaService } from '../../../services/agendaService';
import { traducirTipoOrden } from '../../../utils/Orderhelpers.js';

export default function EditDatesModal({ isOpen, onClose, pedido, onDatesUpdated }) {
  const [guardando, setGuardando] = useState(false);
  const [errorValidacion, setErrorValidacion] = useState(null);
  const [fechas, setFechas] = useState({
    estimated_delivery_date: '',
    rental_return_date_actual: '',
  });

  const esAlquiler = pedido?.order_type === 'rental';

  useEffect(() => {
    if (isOpen && pedido) {
      setErrorValidacion(null);
      setFechas({
        estimated_delivery_date: pedido.estimated_delivery_date?.substring(0, 10) || pedido.rental_start?.substring(0, 10) || '',
        rental_return_date_actual: pedido.rental_return_date_actual?.substring(0, 10) || pedido.rental_end?.substring(0, 10) || '',
      });
    }
  }, [isOpen, pedido]);

  if (!isOpen || !pedido) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorValidacion(null);

    if (esAlquiler && fechas.rental_return_date_actual && fechas.estimated_delivery_date) {
      if (new Date(fechas.rental_return_date_actual) < new Date(fechas.estimated_delivery_date)) {
        setErrorValidacion('La fecha de devolución no puede ser anterior a la de entrega.');
        return;
      }
    }

    setGuardando(true);
    try {
      const payload = {
        estimated_delivery_date: new Date(fechas.estimated_delivery_date).toISOString(),
      };
      if (esAlquiler) {
        payload.rental_return_date_actual = new Date(fechas.rental_return_date_actual).toISOString();
      }

      await agendaService.updateOrderOperationalData(pedido.order_id, payload);
      onDatesUpdated();
      onClose();
    } catch (err) {
      alert('Error al actualizar las fechas en el servidor.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-0">
      <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50">
          <div>
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-yellow-500" /> Editar Fechas
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {pedido.order_number} · {traducirTipoOrden(pedido.order_type)}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500 p-1 rounded-lg cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Fecha de Entrega</label>
            <input
              type="date"
              value={fechas.estimated_delivery_date}
              onChange={(e) => setFechas((prev) => ({ ...prev, estimated_delivery_date: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-yellow-400"
              required
            />
          </div>

          {esAlquiler && (
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Fecha de Devolución</label>
              <input
                type="date"
                value={fechas.rental_return_date_actual}
                onChange={(e) => setFechas((prev) => ({ ...prev, rental_return_date_actual: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-yellow-400"
                required
              />
            </div>
          )}

          {errorValidacion && (
            <p className="flex items-center gap-1.5 text-xs text-red-600">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {errorValidacion}
            </p>
          )}

          <button
            type="submit"
            disabled={guardando}
            className="w-full py-2.5 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold rounded-lg text-sm flex justify-center items-center gap-2 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {guardando ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Guardar Cambios'}
          </button>
        </form>
      </div>
    </div>
  );
}