import { User, CheckCircle, XCircle, Package, Pencil } from 'lucide-react';

export default function AgendaCard({ pedido, onUpdateStatus, onEditDates }) {
  const esAlquiler = pedido.order_type === 'rental';
  const isCancelled = pedido.status === 'cancelled';
  const isConfirmed = pedido.status === 'confirmed';

  const formatearFechaCorta = (fechaIso) => {
    if (!fechaIso) return '-';
    const d = new Date(fechaIso);
    if (fechaIso.length <= 10) d.setMinutes(d.getMinutes() + d.getTimezoneOffset());
    return d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'cancelled': return 'bg-red-100 text-red-700';
      case 'confirmed': 
      case 'paid': 
      case 'delivered': return 'bg-green-100 text-green-700';
      case 'draft':
      case 'preparing': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <article className={`bg-white p-4 rounded-xl border ${isCancelled ? 'border-red-200 opacity-75' : 'border-gray-200'} shadow-sm hover:shadow-md transition-shadow relative flex flex-col justify-between h-full`}>
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${esAlquiler ? 'bg-yellow-400' : 'bg-blue-500'} rounded-l-xl`}></div>
      
      <div className="pl-2">
        <div className="flex justify-between items-start mb-3">
          <div>
            <span className="text-xs font-mono font-bold text-gray-800 bg-gray-100 px-2 py-0.5 rounded">{pedido.order_number}</span>
            <span className={`ml-2 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${getStatusColor(pedido.status)}`}>
              {pedido.status}
            </span>
          </div>
          <span className="text-base font-bold text-gray-900">S/ {Number(pedido.total_amount || 0).toFixed(2)}</span>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
          <User className="w-4 h-4 text-gray-400" />
          <strong className="text-gray-900 truncate">{pedido.customer_id}</strong>
        </div>
        
        {/* Bloque de Fechas / Tipo con Botón de Edición */}
        {esAlquiler ? (
          <div className="bg-gray-50 rounded-lg p-2.5 flex items-center justify-between border border-gray-100 group">
             <div className="flex gap-4">
               <div>
                 <p className="text-[10px] uppercase text-gray-400 font-bold">Entrega</p>
                 <p className="font-semibold text-gray-900 text-sm">{formatearFechaCorta(pedido.estimated_delivery_date || pedido.rental_start)}</p>
               </div>
               <div>
                 <p className="text-[10px] uppercase text-gray-400 font-bold">Devolución</p>
                 <p className="font-semibold text-gray-900 text-sm">{formatearFechaCorta(pedido.rental_return_date_actual || pedido.rental_end)}</p>
               </div>
             </div>
             {/* Botón para editar fechas */}
             <button 
               onClick={() => onEditDates(pedido)}
               className="p-1.5 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded transition-colors opacity-0 group-hover:opacity-100"
               title="Editar fechas"
             >
               <Pencil className="w-4 h-4" />
             </button>
          </div>
        ) : (
          <div className="bg-blue-50 rounded-lg p-2.5 flex items-center gap-2 border border-blue-100">
            <Package className="w-4 h-4 text-blue-500" />
            <span className="font-semibold text-blue-900 text-sm">Venta Directa</span>
          </div>
        )}
      </div>

      <div className="pl-2 pt-4 mt-auto flex justify-end gap-2 border-t border-gray-50">
        <button 
          onClick={() => onUpdateStatus(pedido.order_id, 'confirmed')} 
          disabled={isConfirmed || isCancelled}
          className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-30"
        >
          <CheckCircle className="w-5 h-5" />
        </button>
        <button 
          onClick={() => onUpdateStatus(pedido.order_id, 'cancelled')} 
          disabled={isCancelled}
          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30"
        >
          <XCircle className="w-5 h-5" />
        </button>
      </div>
    </article>
  );
}