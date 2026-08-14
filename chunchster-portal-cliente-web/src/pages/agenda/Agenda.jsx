import { useState, useEffect, useMemo } from 'react';
import { agendaService } from '../../services/agendaService';
import { customerService } from '../../services/customerService';
import { Loader2, Plus, Search, CalendarClock, ShoppingBag, AlertCircle } from 'lucide-react';
import OrderModal from './components/OrderModal';
import AgendaTable from './components/AgendaTable';
import AgendaStats from './components/AgendaStats';
import EditDatesModal from './components/EditDatesModal';
import { traducirEstado, ESTADOS_ORDEN } from '../../utils/Orderhelpers.js';

// Normaliza la respuesta de GET /customers sin importar qué forma exacta
// devuelva el backend (data.customers, data.items, o un array plano).
const extraerListaClientes = (customersRes) => {
  const d = customersRes?.data;
  if (Array.isArray(d)) return d;
  return d?.customers || d?.items || [];
};

export default function Agenda() {
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  const [busqueda, setBusqueda] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('todos'); // 'todos', 'rental', 'sale'
  const [filtroEstado, setFiltroEstado] = useState('todos');

  // Estados para Modales
  const [modalNuevoAbierto, setModalNuevoAbierto] = useState(false);
  const [modalFechasAbierto, setModalFechasAbierto] = useState(false);
  const [pedidoEditando, setPedidoEditando] = useState(null);

  useEffect(() => {
    cargarPedidos();
  }, []);

  const cargarPedidos = async () => {
    setCargando(true);
    setError(null);
    try {
      const ordersRes = await agendaService.getAllOrders();
      const orders = ordersRes.data?.orders || [];

      const clientesPorId = await resolverClientesDeOrdenes(orders);

      // Adjuntamos el cliente completo a cada pedido para que la card tenga
      // nombre, teléfono, etc. sin volver a golpear la API en el render.
      const pedidosConCliente = orders.map((o) => ({
        ...o,
        cliente: clientesPorId.get(o.customer_id) || null,
      }));

      setPedidos(pedidosConCliente);
    } catch (err) {
      console.error('Error al cargar pedidos', err);
      setError('No se pudieron cargar los pedidos. Intenta de nuevo.');
    } finally {
      setCargando(false);
    }
  };

  /**
   * Intenta resolver los clientes con GET /customers (1 sola llamada).
   * Si ese endpoint falla (403 - MissingAuthenticationTokenException,
   * indicando que la ruta de colección no está desplegada en API Gateway),
   * cae a resolver solo los customer_id que aparecen en los pedidos vía
   * GET /customers/{id}, que sí funciona. Evita romper toda la agenda por
   * un endpoint que no está disponible.
   */
  const resolverClientesDeOrdenes = async (orders) => {
    try {
      const customersRes = await customerService.getAllCustomers();
      const clientes = extraerListaClientes(customersRes);
      if (clientes.length > 0) {
        return new Map(clientes.map((c) => [c.customer_id, c]));
      }
    } catch (err) {
      console.warn('GET /customers (lista) no disponible, se resuelve por ID individual:', err);
    }

    const idsUnicos = [...new Set(orders.map((o) => o.customer_id).filter(Boolean))];
    // silent: true porque aquí un 404 es un caso esperado (customer_id
    // huérfano de un pedido viejo/de prueba), no un error real de la app.
    const resultados = await Promise.allSettled(
      idsUnicos.map((id) => customerService.getCustomerById(id, { silent: true }))
    );

    const mapa = new Map();
    resultados.forEach((r, i) => {
      if (r.status === 'fulfilled' && r.value?.data) {
        mapa.set(idsUnicos[i], r.value.data);
      }
    });
    return mapa;
  };

  const cambiarEstadoOrden = async (orderId, nuevoEstado) => {
    const anterior = pedidos;
    try {
      setPedidos((prev) => prev.map((p) => (p.order_id === orderId ? { ...p, status: nuevoEstado } : p)));
      await agendaService.updateOrderStatus(orderId, nuevoEstado);
    } catch (err) {
      alert('Error al actualizar el estado.');
      setPedidos(anterior); // Rollback
    }
  };

  const abrirModalEdicionFechas = (pedido) => {
    setPedidoEditando(pedido);
    setModalFechasAbierto(true);
  };

  // ------------------------------------------
  // Filtrado + búsqueda (ahora también por nombre/teléfono del cliente)
  // ------------------------------------------
  const pedidosFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return pedidos.filter((p) => {
      const pasaTipo = filtroTipo === 'todos' || p.order_type === filtroTipo;
      const pasaEstado = filtroEstado === 'todos' || p.status === filtroEstado;
      const pasaBusqueda =
        !q ||
        p.order_number?.toLowerCase().includes(q) ||
        p.notes?.toLowerCase().includes(q) ||
        p.cliente?.name?.toLowerCase().includes(q) ||
        p.cliente?.phone_e164?.toLowerCase().includes(q) ||
        p.customer_id?.toLowerCase().includes(q);
      return pasaTipo && pasaEstado && pasaBusqueda;
    });
  }, [pedidos, busqueda, filtroTipo, filtroEstado]);

  const alquileres = pedidosFiltrados.filter((p) => p.order_type === 'rental');
  const ventas = pedidosFiltrados.filter((p) => p.order_type === 'sale');

  const estadosPresentes = useMemo(() => {
    const unicos = new Set(pedidos.map((p) => p.status).filter(Boolean));
    return ESTADOS_ORDEN.filter((e) => unicos.has(e));
  }, [pedidos]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">Panel de Agendamientos</h1>
          <p className="text-sm text-gray-500 mt-1">Monitorea y gestiona reservas y alquileres.</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button
            onClick={() => setModalNuevoAbierto(true)}
            className="flex items-center justify-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-colors w-full md:w-auto cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Nueva Reserva
          </button>
        </div>
      </header>

      {/* Dashboard: KPIs + distribución por estado, sobre lo que está filtrado */}
      {!cargando && <AgendaStats pedidos={pedidosFiltrados} />}

      {/* Buscador + filtro de estado */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por N° de pedido, cliente, teléfono o nota..."
            className="w-full pl-9 pr-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400/40 focus:border-yellow-400 outline-none text-sm"
          />
        </div>
        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
          className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 outline-none focus:ring-2 focus:ring-yellow-400/40 cursor-pointer"
        >
          <option value="todos">Todos los estados</option>
          {estadosPresentes.map((estado) => (
            <option key={estado} value={estado}>{traducirEstado(estado)}</option>
          ))}
        </select>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-2 border-b border-gray-200 pb-px">
          <button onClick={() => setFiltroTipo('todos')} className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors cursor-pointer ${filtroTipo === 'todos' ? 'bg-white border-t border-l border-r border-gray-200 text-gray-900 shadow-sm relative top-px' : 'text-gray-500 hover:bg-gray-50'}`}>Todas</button>
          <button onClick={() => setFiltroTipo('rental')} className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors cursor-pointer ${filtroTipo === 'rental' ? 'bg-white border-t border-l border-r border-gray-200 text-yellow-600 shadow-sm relative top-px' : 'text-gray-500 hover:bg-gray-50'}`}>Alquileres</button>
          <button onClick={() => setFiltroTipo('sale')} className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors cursor-pointer ${filtroTipo === 'sale' ? 'bg-white border-t border-l border-r border-gray-200 text-blue-600 shadow-sm relative top-px' : 'text-gray-500 hover:bg-gray-50'}`}>Ventas</button>
        </div>
        <p className="text-xs text-gray-500">
          Mostrando <span className="font-semibold text-gray-700">{pedidosFiltrados.length}</span> de {pedidos.length} pedido(s)
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 text-red-600 p-4 rounded-lg text-sm border border-red-200">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {cargando ? (
        <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-yellow-500" /></div>
      ) : (
        <div className="space-y-8">

          {/* SECCIÓN ALQUILERES */}
          {alquileres.length > 0 && (
            <section>
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-4 border-b border-gray-100 pb-2">
                <CalendarClock className="w-5 h-5 text-yellow-500" /> Alquileres Activos
                <span className="text-xs font-normal text-gray-400">({alquileres.length})</span>
              </h2>
              <AgendaTable pedidos={alquileres} onUpdateStatus={cambiarEstadoOrden} onEditDates={abrirModalEdicionFechas} />
            </section>
          )}

          {/* SECCIÓN VENTAS */}
          {ventas.length > 0 && (
            <section>
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-4 border-b border-gray-100 pb-2">
                <ShoppingBag className="w-5 h-5 text-blue-500" /> Ventas Directas
                <span className="text-xs font-normal text-gray-400">({ventas.length})</span>
              </h2>
              <AgendaTable pedidos={ventas} onUpdateStatus={cambiarEstadoOrden} onEditDates={abrirModalEdicionFechas} />
            </section>
          )}

          {alquileres.length === 0 && ventas.length === 0 && (
            <p className="text-center text-gray-400 py-10">No hay pedidos que coincidan con la búsqueda o los filtros.</p>
          )}
        </div>
      )}

      {/* Modales */}
      <OrderModal isOpen={modalNuevoAbierto} onClose={() => setModalNuevoAbierto(false)} onOrderCreated={cargarPedidos} />
      <EditDatesModal isOpen={modalFechasAbierto} onClose={() => setModalFechasAbierto(false)} pedido={pedidoEditando} onDatesUpdated={cargarPedidos} />
    </div>
  );
}