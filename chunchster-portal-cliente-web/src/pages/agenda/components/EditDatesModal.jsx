import { useState, useEffect } from 'react';
import { X, Loader2, Calendar } from 'lucide-react';
import { agendaService } from '../../../services/agendaService';

export default function EditDatesModal({ isOpen, onClose, pedido, onDatesUpdated }) {
  const [guardando, setGuardando] = useState(false);
  const [fechas, setFechas] = useState({
    estimated_delivery_date: '',
    rental_return_date_actual: ''
  });

  useEffect(() => {
    if (isOpen && pedido) {
      // Cargar las fechas actuales del pedido. Si no tiene las operativas, usamos las base.
      setFechas({
        estimated_delivery_date: pedido.estimated_delivery_date?.substring(0, 10) || pedido.rental_start?.substring(0, 10) || '',
        rental_return_date_actual: pedido.rental_return_date_actual?.substring(0, 10) || pedido.rental_end?.substring(0, 10) || ''
      });
    }
  }, [isOpen, pedido]);

  if (!isOpen || !pedido) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGuardando(true);
    try {
      // Usamos el endpoint PATCH /v1/orders/{order_id} que permite actualizar fechas operativas[cite: 1]
      await agendaService.updateOrderOperationalData(pedido.order_id, {
        estimated_delivery_date: new Date(fechas.estimated_delivery_date).toISOString(),
        rental_return_date_actual: new Date(fechas.rental_return_date_actual).toISOString()
      });
      onDatesUpdated(); // Refrescar la lista de pedidos
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
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-yellow-500" /> Editar Fechas
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500 p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Fecha de Entrega</label>
            <input 
              type="date" 
              value={fechas.estimated_delivery_date} 
              onChange={(e) => setFechas({...fechas, estimated_delivery_date: e.target.value})} 
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-yellow-400" 
              required 
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Fecha de Devolución</label>
            <input 
              type="date" 
              value={fechas.rental_return_date_actual} 
              onChange={(e) => setFechas({...fechas, rental_return_date_actual: e.target.value})} 
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-yellow-400" 
              required 
            />
          </div>

          <button 
            type="submit" 
            disabled={guardando} 
            className="w-full py-2.5 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold rounded-lg text-sm flex justify-center items-center gap-2 transition-colors disabled:opacity-50"
          >
            {guardando ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Guardar Cambios'}
          </button>
        </form>
      </div>
    </div>
  );
}