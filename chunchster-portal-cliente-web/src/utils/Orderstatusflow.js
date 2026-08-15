/**
 * Máquina de estados de un pedido.
 *
 * Orden estricto en el grupo "pre-envío": una vez que el pedido avanza a un
 * estado, no se puede retroceder a uno anterior (la API también lo valida
 * así — antes el front dejaba elegir estados hacia atrás y la API los
 * rechazaba con error).
 *
 *   draft → confirmed → paid → preparing → shipped → delivered
 *                                                         │
 *                                               (alquiler) ▼
 *                                                      returned
 *
 * Desde draft, o desde cualquier estado del grupo pre-envío, se puede
 * cancelar. Desde cualquier punto del grupo pre-envío se puede saltar
 * directo a delivered (no hace falta pasar por todos los pasos
 * intermedios), pero nunca retroceder a un estado anterior del grupo.
 */

const GRUPO_PRE_ENVIO = ['confirmed', 'paid', 'preparing', 'shipped'];

const FLUJO_VENTA = ['draft', ...GRUPO_PRE_ENVIO, 'delivered'];
const FLUJO_ALQUILER = ['draft', ...GRUPO_PRE_ENVIO, 'delivered', 'returned'];

export function siguientesEstadosValidos(estadoActual, orderType) {
  const esAlquiler = orderType === 'rental';

  if (estadoActual === 'draft') {
    return ['confirmed', 'cancelled'];
  }

  const indiceActual = GRUPO_PRE_ENVIO.indexOf(estadoActual);
  if (indiceActual !== -1) {
    // Solo los estados del grupo que están DESPUÉS del actual — nunca hacia atrás.
    const siguientesDelGrupo = GRUPO_PRE_ENVIO.slice(indiceActual + 1);
    return [...siguientesDelGrupo, 'delivered', 'cancelled'];
  }

  if (estadoActual === 'delivered') {
    return esAlquiler ? ['returned'] : [];
  }

  // returned y cancelled son terminales
  return [];
}

/**
 * Posición del estado dentro del flujo (para mostrar progreso en la UI,
 * ej. "Paso 3 de 6"). Devuelve null para estados fuera del flujo lineal
 * (cancelled), ya que no tiene una posición fija.
 */
export function posicionEnFlujo(estadoActual, orderType) {
  const flujo = orderType === 'rental' ? FLUJO_ALQUILER : FLUJO_VENTA;
  const indice = flujo.indexOf(estadoActual);
  if (indice === -1) return null;
  return { paso: indice + 1, total: flujo.length };
}