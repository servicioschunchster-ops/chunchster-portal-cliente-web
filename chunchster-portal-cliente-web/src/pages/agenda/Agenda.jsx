import { useState, useEffect, useCallback } from 'react';
import { agendaService } from '../../services/agendaService';
import { Calendar as CalendarIcon, Loader2, Plus, Search, CheckCircle, XCircle, User, Clock, AlertCircle } from 'lucide-react';
import OrderModal from './components/OrderModal';

export default function Agenda() {
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  const [searchId, setSearchId] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);

  // Carga inicial sincronizada
  useEffect(() => {
    cargarPedidos();
  }, []);

  const cargarPedidos = async () => {
    setCargando(true);
    try {
      // 1. Intentamos traer todos los pedidos del backend si el endpoint existe
      const response = await agendaService.getAllOrders();
      if (response.data && response.data.orders) {
        setPedidos(response.data.orders);
        localStorage.setItem('chunchster_orders', JSON.stringify(response.data.orders));
        return;
      }
    } catch (err) {
      console.warn("El endpoint getAllOrders no devolvió datos, usando caché local.");
    } finally {
      // 2. Fallback: Si falla o no hay datos, leemos el historial local
      const savedOrders = localStorage.getItem('chunchster_orders');
      if (savedOrders) {
        try { 
          setPedidos(JSON.parse(savedOrders)); 
        } catch (e) { 
          console.error("Error parseando localStorage", e); 
        }
      }
      setCargando(false);
    }
  };

  // Memoizamos la función para evitar re-renderizados innecesarios
  const guardarEnHistorialLocal = useCallback((nuevaOrden) => {
    setPedidos(prev => {
      const filtrados = prev.filter(p => p.order_id !== nuevaOrden.order_id);
      const actualizados = [nuevaOrden, ...filtrados];
      localStorage.setItem('chunchster_orders', JSON.stringify(actualizados));
      return actualizados;
    });
  }, []);

  const buscarOrdenPorId = async (e) => {
    e.preventDefault();
    const idLimpio = searchId.trim();
    if (!idLimpio) return;
    
    try {
      setCargando(true);
      setError(null);
      
      const response = await agendaService.getOrderById(idLimpio);
      const ordenEncontrada = response.data?.order || response.data;
      
      if (ordenEncontrada) {
        guardarEnHistorialLocal(ordenEncontrada);
        setSearchId('');
      } else {
        setError('Orden no encontrada en la base de datos.');
      }
    } catch (err) {
      setError('No se encontró ninguna orden con ese ID en AWS.');
      setTimeout(() => setError(null), 4000); // El error desaparece solo
    } finally {
      setCargando(false);
    }
  };

  const cambiarEstadoOrden = async (orderId, nuevoEstado) => {
    try {
      // Optimizamos la UI cambiando el estado localmente primero (Optimistic UI)
      setPedidos(prev => prev.map(p => 
        p.order_id === orderId ? { ...p, status: nuevoEstado } : p
      ));
      
      await agendaService.updateOrderStatus(orderId, nuevoEstado);
      
      // Actualizamos caché
      const updatedOrders = pedidos.map(p => p.order_id === orderId ? { ...p, status: nuevoEstado } : p);
      localStorage.setItem('chunchster_orders', JSON.stringify(updatedOrders));
      
    } catch (err) {
      // Si falla en backend, recargamos la lista real para evitar inconsistencias
      alert('Error de conexión al actualizar el estado en la nube.');
      cargarPedidos();
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* HEADER Y BUSCADOR */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Panel de Agendamientos</h1>
          <p className="text-sm text-gray-500 mt-1">Monitorea y gestiona reservas y alquileres activos.</p>
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
                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-chunchster-yellow focus:border-transparent outline-none transition-all"
              />
            </div>
            <button 
              type="submit" 
              disabled={cargando || !searchId.trim()}
              className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
            >
              Buscar
            </button>
          </form>

          <button 
            onClick={() => setModalAbierto(true)}
            className="flex items-center justify-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Reserva</span>
          </button>
        </div>
      </header>

      {/* FEEDBACK DE CARGA Y ERRORES */}
      {cargando && (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 bg-red-50 text-red-700 p-4 rounded-lg text-sm border border-red-200 animate-in fade-in">
          <AlertCircle className="w-5 h-5" />
          <p>{error}</p>
        </div>
      )}

      {/* GRID DE RESULTADOS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {pedidos.map((pedido) => {
          const esAlquiler = pedido.order_type === 'rental';
          const isCancelled = pedido.status === 'cancelled';
          const isConfirmed = pedido.status === 'confirmed';

          return (
            <article 
              key={pedido.order_id} 
              className={`bg-white p-5 rounded-xl border ${isCancelled ? 'border-red-200 opacity-75' : 'border-gray-200'} shadow-sm relative overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow`}
            >
              <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${esAlquiler ? 'bg-yellow-400' : 'bg-gray-900'}`}></div>
              
              <div>
                <div className="flex justify-between items-start mb-3">
                  <span className="bg-gray-100 text-gray-700 text-xs font-bold px-2 py-1 rounded font-mono border border-gray-200">
                    {pedido.order_number || 'BORRADOR'}
                  </span>
                  <span className="text-lg font-bold text-gray-900">
                    S/ {Number(pedido.total_amount || 0).toFixed(2)}
                  </span>
                </div>
                
                <div className="space-y-2.5 text-sm text-gray-600 my-5">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="truncate">Cliente: <strong className="text-gray-900">{pedido.customer_id}</strong></span>
                  </div>
                  
                  {esAlquiler && (
                    <>
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="w-4 h-4 text-gray-400" />
                        <span>Entrega: <strong className="text-gray-900">{pedido.rental_start || 'N/A'}</strong></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span>Retorno: <strong className="text-gray-900">{pedido.rental_end || 'N/A'}</strong></span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-between items-center mt-2">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase ${
                  isCancelled ? 'bg-red-100 text-red-700' : 
                  isConfirmed ? 'bg-green-100 text-green-700' : 
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {pedido.status}
                </span>
                
                <div className="flex gap-2">
                  <button 
                    onClick={() => cambiarEstadoOrden(pedido.order_id, 'confirmed')} 
                    disabled={isConfirmed || isCancelled}
                    className="p-1.5 text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed" 
                    title="Confirmar"
                  >
                    <CheckCircle className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => cambiarEstadoOrden(pedido.order_id, 'cancelled')} 
                    disabled={isCancelled}
                    className="p-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed" 
                    title="Cancelar"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </article>
          );
        })}

        {!cargando && pedidos.length === 0 && (
          <div className="col-span-full py-16 text-center bg-gray-50 rounded-xl border border-gray-200 border-dashed">
            <CalendarIcon className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium text-sm">No hay reservas recientes. Empieza creando una nueva.</p>
          </div>
        )}
      </div>

      <OrderModal 
        isOpen={modalAbierto} 
        onClose={() => setModalAbierto(false)} 
        onOrderCreated={(nova) => guardarEnHistorialLocal(nova)} 
      />
    </div>
  );
}