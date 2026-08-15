import { X, HelpCircle, ArrowRight } from 'lucide-react';
import { traducirEstado, ESTADO_COLOR } from '../../../utils/Orderhelpers.js';
import { siguientesEstadosValidos } from '../../../utils/Orderstatusflow.js';

// Descripción de cada estado, en lenguaje simple para quien use el panel.
// Si algún texto no calza con la realidad del negocio, se ajusta solo aquí.
const ESTADO_DESCRIPCION = {
  draft: 'El pedido se creó pero todavía no se confirmó nada con el cliente.',
  confirmed: 'El cliente confirmó el pedido (fecha, producto, entrega).',
  paid: 'Se registró el pago (total o parcial) del pedido.',
  preparing: 'El producto se está alistando para la entrega.',
  shipped: 'El producto ya salió hacia el cliente (o está listo para recojo).',
  delivered: 'El cliente ya recibió el producto.',
  returned: 'El cliente devolvió la prenda alquilada. Cierra el ciclo del alquiler.',
  cancelled: 'El pedido se canceló. No admite más cambios.',
};

const ORDEN_ESTADOS = ['draft', 'confirmed', 'paid', 'preparing', 'shipped', 'delivered', 'returned', 'cancelled'];

export default function GuiaEstados({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" onClick={onClose}>
      <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm"></div>
      <div
        className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50">
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-yellow-500" /> Guía de estados del pedido
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500 p-1 rounded-lg cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4">
          {ORDEN_ESTADOS.map((estado) => {
            const statusClasses = ESTADO_COLOR[estado] || 'bg-gray-100 text-gray-600 border-gray-200';
            const siguientesAlquiler = siguientesEstadosValidos(estado, 'rental');
            const siguientesVenta = siguientesEstadosValidos(estado, 'sale');

            return (
              <div key={estado} className="border border-gray-100 rounded-lg p-3">
                <span className={`inline-block text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${statusClasses}`}>
                  {traducirEstado(estado)}
                </span>
                <p className="text-sm text-gray-600 mt-1.5">{ESTADO_DESCRIPCION[estado]}</p>

                <div className="mt-2 text-xs text-gray-500 space-y-1">
                  <TransicionesLinea label="Alquiler" estados={siguientesAlquiler} />
                  <TransicionesLinea label="Venta" estados={siguientesVenta} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function TransicionesLinea({ label, estados }) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <span className="font-semibold text-gray-700">{label}:</span>
      {estados.length === 0 ? (
        <span className="italic text-gray-400">sin más acciones</span>
      ) : (
        estados.map((e, i) => (
          <span key={e} className="flex items-center gap-1.5">
            {i > 0 && <ArrowRight className="w-3 h-3 text-gray-300" />}
            {traducirEstado(e)}
          </span>
        ))
      )}
    </div>
  );
}