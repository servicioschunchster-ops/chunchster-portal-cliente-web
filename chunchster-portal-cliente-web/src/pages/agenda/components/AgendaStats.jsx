import { useMemo } from 'react';
import { Package, CheckCircle2, FileEdit, DollarSign } from 'lucide-react';
import { traducirEstado, ESTADOS_ORDEN } from '../../../utils/Orderhelpers.js';

// Colores sólidos para la barra de distribución (distintos de ESTADO_COLOR,
// que son tonos "suaves" pensados para el badge de la card, no para una barra).
const COLOR_BARRA = {
  draft: 'bg-gray-300',
  confirmed: 'bg-blue-400',
  paid: 'bg-green-400',
  preparing: 'bg-yellow-400',
  shipped: 'bg-purple-400',
  delivered: 'bg-emerald-500',
  returned: 'bg-slate-400',
  cancelled: 'bg-red-400',
};

function KpiCard({ icon: Icon, label, value, colorClasses, hint }) {
  return (
    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-start gap-3">
      <div className={`p-2 rounded-lg shrink-0 ${colorClasses}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0">
        <p className="text-xl font-bold text-gray-900 leading-tight truncate">{value}</p>
        <p className="text-xs text-gray-500">{label}</p>
        {hint && <p className="text-[10px] text-yellow-600 font-semibold mt-0.5">{hint}</p>}
      </div>
    </div>
  );
}

/**
 * Resumen ejecutivo de la agenda: se calcula sobre la lista que le pases
 * (normalmente `pedidosFiltrados`, para que respete la búsqueda/filtros
 * activos) en vez de una llamada aparte a la API.
 */
export default function AgendaStats({ pedidos }) {
  const stats = useMemo(() => {
    const total = pedidos.length;
    const borradores = pedidos.filter((p) => p.status === 'draft').length;
    const confirmadosOPagados = pedidos.filter((p) => ['confirmed', 'paid'].includes(p.status)).length;

    // "Ingresos en cartera": todo lo que no es borrador ni cancelado. No es
    // el total facturado, es una referencia rápida de cuánto hay comprometido.
    const ingresos = pedidos
      .filter((p) => p.status !== 'cancelled' && p.status !== 'draft')
      .reduce((sum, p) => sum + Number(p.total_amount || 0), 0);

    const porEstado = ESTADOS_ORDEN.map((estado) => ({
      estado,
      cantidad: pedidos.filter((p) => p.status === estado).length,
    })).filter((e) => e.cantidad > 0);

    return { total, borradores, confirmadosOPagados, ingresos, porEstado };
  }, [pedidos]);

  if (stats.total === 0) return null;

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          icon={Package}
          label="Pedidos"
          value={stats.total}
          colorClasses="text-gray-700 bg-gray-100"
        />
        <KpiCard
          icon={CheckCircle2}
          label="Confirmados / Pagados"
          value={stats.confirmadosOPagados}
          colorClasses="text-green-700 bg-green-50"
        />
        <KpiCard
          icon={FileEdit}
          label="Borradores"
          value={stats.borradores}
          colorClasses="text-yellow-700 bg-yellow-50"
          hint={stats.borradores > 0 ? 'Requieren seguimiento' : null}
        />
        <KpiCard
          icon={DollarSign}
          label="Ingresos en cartera"
          value={`S/ ${stats.ingresos.toFixed(2)}`}
          colorClasses="text-blue-700 bg-blue-50"
        />
      </div>

      {/* Distribución por estado */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">
          Distribución por estado
        </p>
        <div className="flex w-full h-3 rounded-full overflow-hidden bg-gray-100">
          {stats.porEstado.map(({ estado, cantidad }) => (
            <div
              key={estado}
              className={`${COLOR_BARRA[estado] || 'bg-gray-300'} transition-all`}
              style={{ width: `${(cantidad / stats.total) * 100}%` }}
              title={`${traducirEstado(estado)}: ${cantidad}`}
            />
          ))}
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3">
          {stats.porEstado.map(({ estado, cantidad }) => (
            <div key={estado} className="flex items-center gap-1.5 text-xs text-gray-600">
              <span className={`w-2.5 h-2.5 rounded-full ${COLOR_BARRA[estado] || 'bg-gray-300'}`} />
              {traducirEstado(estado)} <span className="font-semibold text-gray-800">({cantidad})</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}