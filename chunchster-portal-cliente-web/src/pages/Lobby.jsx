import { Link } from 'react-router-dom';
import { Package, Calendar, ArrowRight, TrendingUp, Clock, AlertCircle, Sparkles } from 'lucide-react';

export default function Lobby() {
  return (
    <div className="space-y-8">
      {/* Banner de Bienvenida */}
      <div className="bg-gradient-to-r from-chunchster to-chunchster-hover rounded-2xl p-6 md:p-8 text-white shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full text-xs font-medium mb-3 backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5 text-chunchster-yellow" />
            <span>Panel Operativo Activo</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold">¡Bienvenido de vuelta, Admin!</h1>
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

      {/* Tarjetas de Métricas Principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Métrica 1 */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Productos Activos</p>
            <p className="text-3xl font-extrabold text-gray-800 mt-1">124</p>
            <span className="text-xs text-green-600 font-semibold flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3" /> +12% este mes
            </span>
          </div>
          <div className="w-14 h-14 bg-chunchster/10 rounded-2xl flex items-center justify-center text-chunchster">
            <Package className="w-7 h-7" strokeWidth={2.2} />
          </div>
        </div>

        {/* Métrica 2 */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Citas / Entregas Hoy</p>
            <p className="text-3xl font-extrabold text-gray-800 mt-1">8</p>
            <span className="text-xs text-chunchster-yellow font-semibold flex items-center gap-1 mt-1">
              <Clock className="w-3 h-3" /> 3 pendientes
            </span>
          </div>
          <div className="w-14 h-14 bg-yellow-50 rounded-2xl flex items-center justify-center text-chunchster-yellow">
            <Calendar className="w-7 h-7" strokeWidth={2.2} />
          </div>
        </div>

        {/* Métrica 3 (Simulando indicador visual de utilidad) */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Alquileres Activos</p>
            <p className="text-3xl font-extrabold text-gray-800 mt-1">19</p>
            <span className="text-xs text-blue-600 font-semibold flex items-center gap-1 mt-1">
              En curso
            </span>
          </div>
          <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
            <TrendingUp className="w-7 h-7" strokeWidth={2.2} />
          </div>
        </div>

        {/* Métrica 4 (Alertas) */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Stock Bajo</p>
            <p className="text-3xl font-extrabold text-red-600 mt-1">2</p>
            <span className="text-xs text-red-500 font-semibold flex items-center gap-1 mt-1">
              Requiere atención
            </span>
          </div>
          <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center text-red-500">
            <AlertCircle className="w-7 h-7" strokeWidth={2.2} />
          </div>
        </div>

      </div>

      {/* Sección de Accesos Rápidos y Actividad */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Accesos Rápidos (Ocupa 2 columnas) */}
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
        </div>

        {/* Tarjeta de Estado Rápido (Ocupa 1 columna) */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-800 mb-2">Estado del Sistema</h2>
            <p className="text-xs text-gray-500 mb-4">Conectado correctamente con los servicios de AWS.</p>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">API Gateway</span>
                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded-full">Operativo</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Base de Datos</span>
                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded-full">DynamoDB OK</span>
              </div>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-gray-100 text-xs text-gray-400 text-center">
            Chunchster Panel v1.0
          </div>
        </div>

      </div>
    </div>
  );
}