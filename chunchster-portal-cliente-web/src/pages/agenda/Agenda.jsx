import { useState, useEffect } from 'react';
import { agendaService } from '../../services/agendaService';
import { Calendar as CalendarIcon, Loader2, Plus, Search, CheckCircle, XCircle, User, Clock } from 'lucide-react';
import OrderModal from './components/OrderModal';

export default function Agenda() {
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  const [searchId, setSearchId] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);

  useEffect(() => {
    const savedOrders = localStorage.getItem('chunchster_orders');
    if (savedOrders) {
      try { setPedidos(JSON.parse(savedOrders)); } catch (e) { console.error(e); }
    }
  }, []);

  const guardarEnHistorialLocal = (nuevaOrden) => {
    setPedidos(prev => {
      const filtrados = prev.filter(p => p.order_id !== nuevaOrden.order_id);
      const actualizados = [nuevaOrden, ...filtrados];
      localStorage.setItem('chunchster_orders', JSON.stringify(actualizados));
      return actualizados;
    });
  };

  const buscarOrdenPorId = async (e) => {
    e.preventDefault();
    if (!searchId.trim()) return;
    try {
      setCargando(true);
      setError(null);
      const response = await agendaService.getOrderById(searchId.trim());
      const ordenEncontrada = response.data?.order || response.data;
      if (ordenEncontrada) {
        guardarEnHistorialLocal(ordenEncontrada);
        setSearchId('');
      }
    } catch (err) {
      setError('No se encontró ninguna orden con ese ID en AWS.');
    } finally {
      setCargando(false);
    }
  };

  const cambiarEstadoOrden = async (orderId, nuevoEstado) => {
    try {
      await agendaService.updateOrderStatus(orderId, nuevoEstado);
      setPedidos(prev => {
        const actualizados = prev.map(p => p.order_id === orderId ? { ...p, status: nuevoEstado } : p);
        localStorage.setItem('chunchster_orders', JSON.stringify(actualizados));
        return actualizados;
      });
    } catch (err) {
      alert('No se pudo actualizar el estado.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Panel de Agendamientos</h1>
          <p className="text-sm text-gray-500">Monitorea y gestiona las reservas y alquileres activos.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <form onSubmit={buscarOrdenPorId} className="flex gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Buscar Order ID..." 
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-gray-300 rounded-lg text-sm outline-none"
              />
            </div>
            <button type="submit" className="bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-900 cursor-pointer">
              Buscar
            </button>
          </form>

          <button 
            onClick={() => setModalAbierto(true)}
            className="flex items-center justify-center gap-2 bg-chunchster-yellow hover:bg-yellow-500 text-gray-900 px-4 py-2 rounded-lg text-sm font-bold cursor-pointer whitespace-nowrap shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Reserva</span>
          </button>
        </div>
      </div>

      {cargando && (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-chunchster-yellow" />
        </div>
      )}

      {error && <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm border border-red-200">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {pedidos.map((pedido) => {
          const esAlquiler = pedido.order_type === 'rental';
          return (
            <div key={pedido.order_id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden flex flex-col justify-between">
              <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${esAlquiler ? 'bg-chunchster-yellow' : 'bg-chunchster'}`}></div>
              <div>
                <div className="flex justify-between items-start mb-3">
                  <span className="bg-gray-100 text-gray-800 text-xs font-bold px-2.5 py-1 rounded-md font-mono">{pedido.order_number || 'ORDEN'}</span>
                  <span className="text-lg font-bold text-gray-800">S/ {pedido.total_amount?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="space-y-2 text-sm text-gray-600 my-4">
                  <div className="flex items-center gap-2"><User className="w-4 h-4 text-gray-400" /><span>Cliente: <strong className="text-gray-800">{pedido.customer_id}</strong></span></div>
                  {esAlquiler && (
                    <>
                      <div className="flex items-center gap-2"><CalendarIcon className="w-4 h-4 text-gray-400" /><span>Entrega: <strong className="text-gray-800">{pedido.rental_start || 'N/A'}</strong></span></div>
                      <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-gray-400" /><span>Devolución: <strong className="text-gray-800">{pedido.rental_end || 'N/A'}</strong></span></div>
                    </>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full uppercase bg-yellow-100 text-yellow-700">{pedido.status}</span>
                <div className="flex gap-2">
                  <button onClick={() => cambiarEstadoOrden(pedido.order_id, 'confirmed')} className="p-1.5 text-green-600 bg-green-50 hover:bg-green-100 rounded-lg cursor-pointer" title="Confirmar"><CheckCircle className="w-4 h-4" /></button>
                  <button onClick={() => cambiarEstadoOrden(pedido.order_id, 'cancelled')} className="p-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg cursor-pointer" title="Cancelar"><XCircle className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          );
        })}

        {pedidos.length === 0 && (
          <div className="col-span-full py-16 text-center bg-white rounded-xl border border-gray-200">
            <CalendarIcon className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">No hay reservas recientes en la bandeja. Haz clic en "Nueva Reserva".</p>
          </div>
        )}
      </div>

      {/* Modal Separado e Independiente */}
      <OrderModal 
        isOpen={modalAbierto} 
        onClose={() => setModalAbierto(false)} 
        onOrderCreated={(nova) => guardarEnHistorialLocal(nova)} 
      />
    </div>
  );
}