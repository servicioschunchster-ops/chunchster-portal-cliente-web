import { useState, useEffect, useCallback } from 'react';
import { agendaService } from '../../services/agendaService';
import { Loader2, Plus, Search, CalendarClock, ShoppingBag } from 'lucide-react';
import OrderModal from './components/OrderModal';
import AgendaCard from './components/AgendaCard';
import EditDatesModal from './components/EditDatesModal';

export default function Agenda() {
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [searchId, setSearchId] = useState('');
  
  // Estados para Modales
  const [modalNuevoAbierto, setModalNuevoAbierto] = useState(false);
  const [modalFechasAbierto, setModalFechasAbierto] = useState(false);
  const [pedidoEditando, setPedidoEditando] = useState(null);
  
  const [filtroTipo, setFiltroTipo] = useState('todos'); // 'todos', 'rental', 'sale'

  useEffect(() => {
    cargarPedidos();
  }, []);

  const cargarPedidos = async () => {
    setCargando(true);
    try {
      const response = await agendaService.getAllOrders();
      if (response.data?.orders) {
        setPedidos(response.data.orders);
      }
    } catch (err) {
      console.error("Error al cargar pedidos");
    } finally {
      setCargando(false);
    }
  };

  const cambiarEstadoOrden = async (orderId, nuevoEstado) => {
    try {
      setPedidos(prev => prev.map(p => p.order_id === orderId ? { ...p, status: nuevoEstado } : p));
      await agendaService.updateOrderStatus(orderId, nuevoEstado);
    } catch (err) {
      alert('Error al actualizar el estado.');
      cargarPedidos(); // Rollback
    }
  };

  const abrirModalEdicionFechas = (pedido) => {
    setPedidoEditando(pedido);
    setModalFechasAbierto(true);
  };

  // Lógica de Agrupación de Pedidos
  const alquileres = pedidos.filter(p => p.order_type === 'rental' && (filtroTipo === 'todos' || filtroTipo === 'rental'));
  const ventas = pedidos.filter(p => p.order_type === 'sale' && (filtroTipo === 'todos' || filtroTipo === 'sale'));

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Panel de Agendamientos</h1>
          <p className="text-sm text-gray-500 mt-1">Monitorea y gestiona reservas y alquileres.</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button 
            onClick={() => setModalNuevoAbierto(true)}
            className="flex items-center justify-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-colors w-full md:w-auto"
          >
            <Plus className="w-4 h-4" /> Nueva Reserva
          </button>
        </div>
      </header>

      <div className="flex gap-2 border-b border-gray-200 pb-px">
        <button onClick={() => setFiltroTipo('todos')} className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors ${filtroTipo === 'todos' ? 'bg-white border-t border-l border-r border-gray-200 text-gray-900 shadow-sm relative top-px' : 'text-gray-500 hover:bg-gray-50'}`}>Todas</button>
        <button onClick={() => setFiltroTipo('rental')} className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors ${filtroTipo === 'rental' ? 'bg-white border-t border-l border-r border-gray-200 text-yellow-600 shadow-sm relative top-px' : 'text-gray-500 hover:bg-gray-50'}`}>Alquileres</button>
        <button onClick={() => setFiltroTipo('sale')} className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors ${filtroTipo === 'sale' ? 'bg-white border-t border-l border-r border-gray-200 text-blue-600 shadow-sm relative top-px' : 'text-gray-500 hover:bg-gray-50'}`}>Ventas</button>
      </div>

      {cargando ? (
        <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-yellow-500" /></div>
      ) : (
        <div className="space-y-8">
          
          {/* SECCIÓN ALQUILERES */}
          {alquileres.length > 0 && (
            <section>
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-4 border-b border-gray-100 pb-2">
                <CalendarClock className="w-5 h-5 text-yellow-500" /> Alquileres Activos
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {alquileres.map((pedido) => (
                  <AgendaCard key={pedido.order_id} pedido={pedido} onUpdateStatus={cambiarEstadoOrden} onEditDates={abrirModalEdicionFechas} />
                ))}
              </div>
            </section>
          )}

          {/* SECCIÓN VENTAS */}
          {ventas.length > 0 && (
            <section>
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-4 border-b border-gray-100 pb-2">
                <ShoppingBag className="w-5 h-5 text-blue-500" /> Ventas Directas
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {ventas.map((pedido) => (
                  <AgendaCard key={pedido.order_id} pedido={pedido} onUpdateStatus={cambiarEstadoOrden} />
                ))}
              </div>
            </section>
          )}

          {alquileres.length === 0 && ventas.length === 0 && (
             <p className="text-center text-gray-400 py-10">No hay órdenes para mostrar.</p>
          )}
        </div>
      )}

      {/* Modales */}
      <OrderModal isOpen={modalNuevoAbierto} onClose={() => setModalNuevoAbierto(false)} onOrderCreated={cargarPedidos} />
      <EditDatesModal isOpen={modalFechasAbierto} onClose={() => setModalFechasAbierto(false)} pedido={pedidoEditando} onDatesUpdated={cargarPedidos} />
    </div>
  );
}