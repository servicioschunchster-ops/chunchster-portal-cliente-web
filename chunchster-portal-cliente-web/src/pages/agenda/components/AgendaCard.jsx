import { Calendar, Clock, User, CheckCircle, XCircle, Package } from 'lucide-react';

export default function AgendaCard({ pedido, onUpdateStatus }) {
  const esAlquiler = pedido.order_type === 'rental';
  const isCancelled = pedido.status === 'cancelled';
  const isConfirmed = pedido.status === 'confirmed';

  // Asignación dinámica de colores según el estado oficial de la API
  const getStatusColor = (status) => {
    switch (status) {
      case 'cancelled': return 'bg-red-100 text-red-700 border-red-200';
      case 'confirmed': 
      case 'paid': 
      case 'delivered': return 'bg-green-100 text-green-700 border-green-200';
      case 'draft':
      case 'preparing':
      case 'shipped':
      case 'returned': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <article className={`bg-white p-5 rounded-xl border ${isCancelled ? 'border-red-200 opacity-75' : 'border-gray-200'} shadow-sm hover:shadow-md transition-all relative overflow-hidden flex flex-col justify-between`}>
      {/* Barra lateral indicadora de tipo de orden */}
      <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${esAlquiler ? 'bg-yellow-400' : 'bg-gray-900'}`}></div>
      
      <div>
        <div className="flex justify-between items-start mb-4">
          <span className="bg-gray-50 text-gray-700 text-xs font-bold px-2.5 py-1 rounded border border-gray-200 font-mono tracking-wide">
            {pedido.order_number || 'BORRADOR'}
          </span>
          <span className="text-lg font-bold text-gray-900">
            S/ {Number(pedido.total_amount || 0).toFixed(2)}
          </span>
        </div>
        
        <div className="space-y-2.5 text-sm text-gray-600 my-4">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-gray-400" />
            <span className="truncate">Cliente ID: <strong className="text-gray-900">{pedido.customer_id}</strong></span>
          </div>
          
          {esAlquiler ? (
            <>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span>Entrega: <strong className="text-gray-900">{pedido.rental_start || 'N/A'}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <span>Devolución: <strong className="text-gray-900">{pedido.rental_end || 'N/A'}</strong></span>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-gray-400" />
              <span>Tipo: <strong className="text-gray-900">Venta</strong></span>
            </div>
          )}
        </div>
      </div>

      <div className="pt-4 border-t border-gray-100 flex justify-between items-center mt-2">
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase border ${getStatusColor(pedido.status)}`}>
          {pedido.status}
        </span>

        <div className="flex gap-2">
          <button 
            onClick={() => onUpdateStatus(pedido.order_id, 'confirmed')} 
            disabled={isConfirmed || isCancelled}
            className="p-1.5 text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            title="Confirmar Orden"
          >
            <CheckCircle className="w-5 h-5" />
          </button>
          <button 
            onClick={() => onUpdateStatus(pedido.order_id, 'cancelled')} 
            disabled={isCancelled}
            className="p-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            title="Cancelar Orden"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>
      </div>
    </article>
  );
}