import { Calendar, Clock, User, CheckCircle, XCircle } from 'lucide-react';

export default function AgendaCard({ pedido, onUpdateStatus }) {
  const esAlquiler = pedido.order_type === 'rental';

  return (
    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between">
      <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${esAlquiler ? 'bg-chunchster-yellow' : 'bg-chunchster'}`}></div>
      
      <div>
        <div className="flex justify-between items-start mb-3">
          <span className="bg-gray-100 text-gray-800 text-xs font-bold px-2.5 py-1 rounded-md uppercase tracking-wider font-mono">
            {pedido.order_number || 'ORDEN'}
          </span>
          <span className="text-lg font-bold text-gray-800">
            S/ {pedido.total_amount?.toFixed(2) || '0.00'}
          </span>
        </div>
        
        <div className="space-y-2 text-sm text-gray-600 my-4">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-gray-400" />
            <span>Cliente ID: <span className="font-medium text-gray-800">{pedido.customer_id}</span></span>
          </div>
          {esAlquiler && (
            <>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span>Entrega: <span className="font-medium text-gray-800">{pedido.rental_start || 'N/A'}</span></span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <span>Devolución: <span className="font-medium text-gray-800">{pedido.rental_end || 'N/A'}</span></span>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full uppercase ${
          pedido.status === 'confirmed' ? 'bg-green-100 text-green-700' : 
          pedido.status === 'paid' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'
        }`}>
          {pedido.status}
        </span>

        <div className="flex gap-2">
          <button 
            onClick={() => onUpdateStatus(pedido.order_id, 'confirmed')} 
            className="p-1.5 text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition-colors cursor-pointer"
            title="Confirmar"
          >
            <CheckCircle className="w-4 h-4" />
          </button>
          <button 
            onClick={() => onUpdateStatus(pedido.order_id, 'cancelled')} 
            className="p-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors cursor-pointer"
            title="Cancelar"
          >
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}