// ==========================================
// Helpers de presentación para pedidos (Orders)
// Fuente de verdad única para traducir/colorear status
// en toda la sección de Agenda (Agenda.jsx, AgendaCard.jsx, etc.)
// ==========================================

export const ESTADO_LABEL = {
  draft: 'Borrador',
  confirmed: 'Confirmado',
  paid: 'Pagado',
  preparing: 'En preparación',
  shipped: 'Enviado',
  delivered: 'Entregado',
  returned: 'Devuelto',
  cancelled: 'Cancelado',
};

export const traducirEstado = (estado) => ESTADO_LABEL[estado] || estado;

// Clases Tailwind para el badge de estado (bg + texto + borde)
export const ESTADO_COLOR = {
  draft: 'bg-gray-100 text-gray-600 border-gray-200',
  confirmed: 'bg-blue-50 text-blue-700 border-blue-200',
  paid: 'bg-green-50 text-green-700 border-green-200',
  preparing: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  shipped: 'bg-purple-50 text-purple-700 border-purple-200',
  delivered: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  returned: 'bg-slate-100 text-slate-600 border-slate-200',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
};

// Orden lógico del ciclo de vida, útil para selects de "siguiente estado"
export const ESTADOS_ORDEN = [
  'draft', 'confirmed', 'paid', 'preparing', 'shipped', 'delivered', 'returned', 'cancelled',
];

export const FULFILLMENT_LABEL = {
  pending_delivery: 'Pendiente de entrega',
  in_possession: 'En posesión del cliente',
  completed: 'Completado',
  delayed: 'Retrasado',
};

export const traducirFulfillment = (estado) => FULFILLMENT_LABEL[estado] || estado;

export const DEPOSITO_LABEL = {
  not_applicable: 'No aplica',
  pending: 'Pendiente',
  held: 'Retenido',
  retained: 'Retenido en garantía',
  refunded: 'Reembolsado',
};

export const traducirDeposito = (estado) => DEPOSITO_LABEL[estado] || estado;

export const TIPO_ORDEN_LABEL = {
  sale: 'Venta',
  rental: 'Alquiler',
};

export const traducirTipoOrden = (tipo) => TIPO_ORDEN_LABEL[tipo] || tipo;