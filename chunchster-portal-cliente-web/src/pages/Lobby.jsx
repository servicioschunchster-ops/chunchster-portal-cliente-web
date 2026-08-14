import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Package, Calendar, ArrowRight, TrendingUp, AlertCircle, Sparkles, Loader2, Truck, RotateCcw } from 'lucide-react';
import { agendaService } from '../services/agendaService';
import { catalogService, inventoryService } from '../services/invService';

const hoyISO = () => new Date().toISOString().substring(0, 10);

const formatearFechaCorta = (fechaIso) => {
  if (!fechaIso) return null;
  const limpia = fechaIso.substring(0, 10);
  const [y, m, d] = limpia.split('-');
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d, 12, 0, 0).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' });
};

/**
 * A partir de un pedido, determina el próximo evento operativo relevante
 * (una entrega o una devolución) que todavía no pasó.
 */
const proximoEventoDelPedido = (pedido) => {
  if (pedido.status === 'cancelled') return null;

  const hoy = hoyISO();
  const eventos = [];

  const fechaEntrega = (pedido.estimated_delivery_date || pedido.rental_start || '').substring(0, 10);
  if (fechaEntrega && fechaEntrega >= hoy && pedido.status !== 'delivered') {
    eventos.push({ tipo: 'entrega', fecha: fechaEntrega });
  }

  if (pedido.order_type === 'rental') {
    const fechaDevolucion = (pedido.rental_return_date_actual || pedido.rental_end || '').substring(0, 10);
    if (fechaDevolucion && fechaDevolucion >= hoy && pedido.status !== 'returned') {
      eventos.push({ tipo: 'devolucion', fecha: fechaDevolucion });
    }
  }

  if (eventos.length === 0) return null;
  eventos.sort((a, b) => a.fecha.localeCompare(b.fecha));
  return { ...eventos[0], pedido };
};

/**
 * Igual que proximoEventoDelPedido, pero sin filtrar por fecha futura —
 * se usa como fallback histórico cuando no hay eventos próximos, así el
 * panel nunca se queda vacío sin aportar nada.
 */
const ultimoEventoDelPedido = (pedido) => {
  if (pedido.status === 'cancelled') return null;

  const eventos = [];

  const fechaEntrega = (pedido.actual_delivery_date || pedido.estimated_delivery_date || pedido.rental_start || '').substring(0, 10);
  if (fechaEntrega) {
    eventos.push({ tipo: 'entrega', fecha: fechaEntrega, esReal: Boolean(pedido.actual_delivery_date) });
  }

  if (pedido.order_type === 'rental') {
    const fechaDevolucion = (pedido.rental_return_date_actual || pedido.rental_end || '').substring(0, 10);
    if (fechaDevolucion) {
      eventos.push({ tipo: 'devolucion', fecha: fechaDevolucion, esReal: Boolean(pedido.rental_return_date_actual) });
    }
  }

  if (eventos.length === 0) return null;
  eventos.sort((a, b) => b.fecha.localeCompare(a.fecha)); // más reciente primero
  return { ...eventos[0], pedido };
};

/**
 * A partir de un item de inventario con stock bajo y su producto ya
 * resuelto del catálogo, arma el texto: nombre + variante (talla/color)
 * si tiene variant_attrs, o el variant_key si no es el genérico DEFAULT.
 */
const describirVariante = (item, producto) => {
  const atributos = item.variant_attrs
    ? Object.values(item.variant_attrs).filter(Boolean).join(' · ')
    : null;
  const detalle = atributos || (item.variant_key && item.variant_key !== 'DEFAULT' ? item.variant_key : null);

  return detalle ? `${producto.name} (${detalle})` : producto.name;
};

export default function Lobby() {
  const [pedidos, setPedidos] = useState([]);
  const [productos, setProductos] = useState([]);
  const [stockBajo, setStockBajo] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setCargando(true);
    setError(null);
    try {
      const [ordersRes, catalogRes, lowStockRes] = await Promise.allSettled([
        agendaService.getAllOrders(),
        catalogService.getCatalog(),
        inventoryService.getLowStock(),
      ]);

      if (ordersRes.status === 'fulfilled') {
        setPedidos(ordersRes.value.data?.orders || []);
      } else {
        console.error('Error al cargar pedidos', ordersRes.reason);
        setError('No se pudieron cargar algunos datos del panel.');
      }

      if (catalogRes.status === 'fulfilled') {
        setProductos(catalogRes.value.data?.products || []);
      } else {
        console.error('Error al cargar catálogo', catalogRes.reason);
      }

      if (lowStockRes.status === 'fulfilled') {
        setStockBajo(lowStockRes.value.data?.inventory || []);
      } else {
        console.error('Error al cargar stock bajo', lowStockRes.reason);
      }
    } finally {
      setCargando(false);
    }
  };

  // ------------------------------------------
  // KPIs y lookups derivados
  // ------------------------------------------
  const productosPorId = useMemo(
    () => new Map(productos.map((p) => [p.product_id, p])),
    [productos]
  );

  const productosActivos = useMemo(
    () => productos.filter((p) => p.is_active !== false).length,
    [productos]
  );

  const alquileresActivos = useMemo(
    () => pedidos.filter((p) => p.order_type === 'rental' && !['cancelled', 'returned', 'draft'].includes(p.status)).length,
    [pedidos]
  );

  // Solo contamos/mostramos items de stock bajo cuyo producto SÍ existe en
  // el catálogo activo. Los "huérfanos" (product_id que ya no está en
  // /catalog — soft-deleted o data de prueba suelta) se descartan, igual
  // que el criterio que ya usa la página de Inventario.
  const stockBajoValido = useMemo(
    () => stockBajo
      .map((item) => ({ item, producto: productosPorId.get(item.product_id) }))
      .filter(({ producto }) => Boolean(producto)),
    [stockBajo, productosPorId]
  );

  const proximosEventos = useMemo(() => {
    return pedidos
      .map(proximoEventoDelPedido)
      .filter(Boolean)
      .sort((a, b) => a.fecha.localeCompare(b.fecha))
      .slice(0, 5);
  }, [pedidos]);

  // Fallback: si no hay nada próximo, mostramos los últimos movimientos
  // históricos como mini resumen (mejor que un panel vacío).
  const ultimosEventos = useMemo(() => {
    if (proximosEventos.length > 0) return [];
    return pedidos
      .map(ultimoEventoDelPedido)
      .filter(Boolean)
      .sort((a, b) => b.fecha.localeCompare(a.fecha))
      .slice(0, 5);
  }, [pedidos, proximosEventos.length]);

  const eventosHoy = useMemo(
    () => proximosEventos.filter((e) => e.fecha === hoyISO()).length,
    [proximosEventos]
  );

  const pedidosPendientes = useMemo(
    () => pedidos.filter((p) => p.status === 'draft').length,
    [pedidos]
  );

  const eventosAMostrar = proximosEventos.length > 0 ? proximosEventos : ultimosEventos;

  if (cargando) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Banner de Bienvenida */}
      <div className="bg-gradient-to-r from-chunchster to-chunchster-hover rounded-2xl p-6 md:p-8 text-white shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full text-xs font-medium mb-3 backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5 text-chunchster-yellow" />
            <span>Panel Operativo Activo</span>
          </div>
          <h1 className="font-display text-2xl md:text-3xl font-bold">¡Bienvenido de vuelta, Admin!</h1>
          <p className="text-white/80 text-sm mt-1">Aquí tienes el pulso general de tu inventario y las reservas de hoy.</p>
        </div>
        <div className="flex gap-3">
          <Link to="/inventario" className="bg-white text-gray-900 hover:bg-gray-100 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm">
            Nuevo Producto
          </Link>
          <Link to="/agenda" className="bg-chunchster-yellow text-gray-900 hover:bg-yellow-400 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors shadow-sm">
            Ver Agenda
          </Link>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 text-red-600 p-4 rounded-lg text-sm border border-red-200">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {/* Tarjetas de Métricas Principales — 100% data real */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Productos Activos</p>
            <p className="text-3xl font-extrabold text-gray-800 mt-1">{productosActivos}</p>
            <span className="text-xs text-gray-400 font-semibold mt-1 block">de {productos.length} en catálogo</span>
          </div>
          <div className="w-14 h-14 bg-chunchster/10 rounded-2xl flex items-center justify-center text-chunchster">
            <Package className="w-7 h-7" strokeWidth={2.2} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Entregas / Devoluciones Hoy</p>
            <p className="text-3xl font-extrabold text-gray-800 mt-1">{eventosHoy}</p>
            <span className="text-xs text-chunchster-yellow font-semibold flex items-center gap-1 mt-1">
              {pedidosPendientes > 0 ? `${pedidosPendientes} borrador(es) sin confirmar` : 'Todo confirmado'}
            </span>
          </div>
          <div className="w-14 h-14 bg-yellow-50 rounded-2xl flex items-center justify-center text-chunchster-yellow">
            <Calendar className="w-7 h-7" strokeWidth={2.2} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Alquileres Activos</p>
            <p className="text-3xl font-extrabold text-gray-800 mt-1">{alquileresActivos}</p>
            <span className="text-xs text-blue-600 font-semibold flex items-center gap-1 mt-1">
              En curso
            </span>
          </div>
          <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
            <TrendingUp className="w-7 h-7" strokeWidth={2.2} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Stock Bajo</p>
            <p className={`text-3xl font-extrabold mt-1 ${stockBajoValido.length > 0 ? 'text-red-600' : 'text-gray-800'}`}>
              {stockBajoValido.length}
            </p>
            <span className={`text-xs font-semibold flex items-center gap-1 mt-1 ${stockBajoValido.length > 0 ? 'text-red-500' : 'text-gray-400'}`}>
              {stockBajoValido.length > 0 ? 'Requiere atención' : 'Sin alertas'}
            </span>
          </div>
          <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center text-red-500">
            <AlertCircle className="w-7 h-7" strokeWidth={2.2} />
          </div>
        </div>

      </div>

      {/* Accesos Rápidos + Próximas Entregas/Devoluciones (o Últimos Movimientos) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-base font-bold text-gray-800 mb-4">Accesos Directos</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link to="/inventario" className="p-4 bg-gray-50 hover:bg-chunchster/5 border border-gray-200 hover:border-chunchster rounded-xl transition-all flex justify-between items-center group">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white rounded-lg shadow-sm text-chunchster">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-800">Inventario</p>
                  <p className="text-xs text-gray-500">Gestiona catálogo y precios</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-chunchster transition-colors" />
            </Link>

            <Link to="/agenda" className="p-4 bg-gray-50 hover:bg-yellow-50 border border-gray-200 hover:border-chunchster-yellow rounded-xl transition-all flex justify-between items-center group">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white rounded-lg shadow-sm text-chunchster-yellow">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-800">Panel de Agenda</p>
                  <p className="text-xs text-gray-500">Revisa reservas y alquileres</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-chunchster-yellow transition-colors" />
            </Link>
          </div>

          {stockBajoValido.length > 0 && (
            <div className="mt-4 p-4 bg-red-50 border border-red-100 rounded-xl">
              <p className="text-xs font-bold text-red-700 uppercase tracking-wide mb-2">Productos con stock bajo</p>
              <ul className="space-y-1">
                {stockBajoValido.slice(0, 4).map(({ item, producto }) => (
                  <li key={item.inventory_id} className="text-sm text-red-800 flex justify-between gap-2">
                    <span className="truncate">{describirVariante(item, producto)}</span>
                    <span className="font-mono font-semibold shrink-0">{item.qty_available ?? '—'} disp.</span>
                  </li>
                ))}
              </ul>
              {stockBajoValido.length > 4 && (
                <Link to="/inventario" className="block text-xs text-red-600 font-semibold mt-2 hover:underline">
                  +{stockBajoValido.length - 4} más — ver inventario →
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Próximas entregas / devoluciones — con fallback histórico */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
          <h2 className="text-base font-bold text-gray-800 mb-1">
            {proximosEventos.length > 0 ? 'Próximas Entregas y Devoluciones' : 'Últimos Movimientos'}
          </h2>
          {proximosEventos.length === 0 && ultimosEventos.length > 0 && (
            <p className="text-xs text-gray-400 mb-3">No hay eventos próximos — esto es lo último que pasó.</p>
          )}

          {eventosAMostrar.length === 0 ? (
            <p className="text-sm text-gray-400 flex-1 flex items-center justify-center text-center py-6">
              Aún no hay pedidos con fechas registradas.
            </p>
          ) : (
            <div className="space-y-3 flex-1">
              {eventosAMostrar.map(({ tipo, fecha, pedido, esReal }) => (
                <Link
                  key={`${pedido.order_id}-${tipo}`}
                  to="/agenda"
                  className="flex items-center justify-between gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`p-1.5 rounded-lg shrink-0 ${tipo === 'entrega' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                      {tipo === 'entrega' ? <Truck className="w-3.5 h-3.5" /> : <RotateCcw className="w-3.5 h-3.5" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{pedido.order_number}</p>
                      <p className="text-xs text-gray-500">
                        {tipo === 'entrega' ? 'Entrega' : 'Devolución'}
                        {esReal === false && proximosEventos.length === 0 ? ' (estimada)' : ''}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-gray-700 whitespace-nowrap">{formatearFechaCorta(fecha)}</span>
                </Link>
              ))}
            </div>
          )}

          <Link to="/agenda" className="mt-4 pt-4 border-t border-gray-100 text-xs text-center text-chunchster-yellow font-bold hover:underline">
            Ver toda la agenda →
          </Link>
        </div>

      </div>
    </div>
  );
}