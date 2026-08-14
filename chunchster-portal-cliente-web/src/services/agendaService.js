import { fetchAPI } from './api';
import { customerService } from './customerService';

export const agendaService = {
  // ==========================================
  // MÓDULO DE PEDIDOS PRINCIPAL (Orders)
  // ==========================================

  /**
   * Listar pedidos del tenant con filtros opcionales (GET /orders).
   * @param {Object} params - Parámetros de query opcionales.
   * @param {string} params.status - 'draft', 'confirmed', 'paid', 'preparing', 'shipped', 'delivered', 'returned', 'cancelled'.
   * @param {string} params.order_type - 'sale' | 'rental'.
   * @param {string} params.customer_id - ID del cliente.
   * @param {string} params.fulfillment_status - 'pending_delivery', 'in_possession', 'completed', 'delayed'.
   * @param {number} params.limit - Default 50, max 100.
   * @param {number} params.offset - Para paginación.
   */
  getAllOrders: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `/orders?${queryString}` : '/orders';
    return await fetchAPI(url, { method: 'GET' });
  },

  /**
   * Crear un nuevo pedido (POST /orders).
   * @param {Object} orderData - Requiere customer_id, order_type, delivery_type e items. Para alquiler requiere rental_start y rental_end.
   */
  createOrder: async (orderData) => {
    return await fetchAPI('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  },

  /**
   * Obtener detalles completos de un pedido incluyendo sus ítems (GET /orders/{order_id}).
   */
  getOrderDetails: async (orderId) => {
    return await fetchAPI(`/orders/${orderId}`, { method: 'GET' });
  },

  /**
   * Alias compatible para obtener orden por ID.
   */
  getOrderById: async (orderId) => {
    return await fetchAPI(`/orders/${orderId}`, { method: 'GET' });
  },

  /**
   * Obtener un pedido completo (order + items) junto con los datos del cliente
   * asociado, en una sola llamada. Útil para la vista de detalle de pedido,
   * ya que GET /orders/{order_id} solo trae customer_id, no el nombre/teléfono.
   *
   * @param {string} orderId
   * @returns {Promise<{order: Object, items: Array, customer: Object|null}>}
   */
  getOrderWithCustomer: async (orderId) => {
    const response = await agendaService.getOrderDetails(orderId);
    const order = response?.data?.order ?? null;
    const items = response?.data?.items ?? [];

    let customer = null;
    if (order?.customer_id) {
      try {
        const customerResponse = await customerService.getCustomerById(order.customer_id);
        customer = customerResponse?.data ?? null;
      } catch (err) {
        // No bloqueamos el detalle del pedido si falla la búsqueda del cliente
        console.error('No se pudo obtener el cliente del pedido', err);
      }
    }

    return { order, items, customer };
  },

  /**
   * Actualizar campos operativos del pedido (PATCH /orders/{order_id}).
   * @param {string} orderId - ID del pedido.
   * @param {Object} updateData - Campos opcionales: fulfillment_status, deposit_status, fechas estimadas/reales de entrega y retorno, notas.
   */
  updateOrderOperationalData: async (orderId, updateData) => {
    return await fetchAPI(`/orders/${orderId}`, {
      method: 'PATCH',
      body: JSON.stringify(updateData),
    });
  },

  /**
   * Actualizar el estado del ciclo de vida del pedido (PATCH /orders/{order_id}/status).
   * @param {string} orderId - ID del pedido.
   * @param {string} status - Obligatorio: 'draft', 'confirmed', 'paid', 'preparing', 'shipped', 'delivered', 'returned', 'cancelled'.
   */
  // Cambiar el estado del pedido usando el endpoint principal (Workaround API)
  // Cambiar el estado del pedido (Workaround para el Error 500)
  updateOrderStatus: async (orderId, status) => {
    // Enviamos estrictamente el campo 'status'. Si enviamos 'notes' vacío,
    // la Lambda de AWS actual podría estar crasheando.
    return await fetchAPI(`/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: status }),
    });
  },

  // ==========================================
  // ÍTEMS DEL PEDIDO (Order Items)
  // ==========================================

  /**
   * Listar todos los ítems de un pedido (GET /orders/{order_id}/items).
   */
  getOrderItems: async (orderId) => {
    return await fetchAPI(`/orders/${orderId}/items`, { method: 'GET' });
  },

  /**
   * Agregar un nuevo ítem a un pedido existente (POST /orders/{order_id}/items).
   * @param {Object} itemData - Requiere product_id, inventory_id, variant_key, quantity y unit_price.
   */
  addOrderItem: async (orderId, itemData) => {
    return await fetchAPI(`/orders/${orderId}/items`, {
      method: 'POST',
      body: JSON.stringify(itemData),
    });
  },

  /**
   * Actualizar cantidad o precio de un ítem (PUT /orders/{order_id}/items/{item_id}).
   * @param {Object} updateData - Al menos un campo requerido: quantity o unit_price.
   */
  updateOrderItem: async (orderId, itemId, updateData) => {
    return await fetchAPI(`/orders/${orderId}/items/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  },

  /**
   * Eliminar un ítem de un pedido (DELETE /orders/{order_id}/items/{item_id}).
   */
  deleteOrderItem: async (orderId, itemId) => {
    return await fetchAPI(`/orders/${orderId}/items/${itemId}`, { method: 'DELETE' });
  },

  // ==========================================
  // TRANSACCIONES / PAGOS (Order Transactions)
  // ==========================================

  /**
   * Registrar un pago manual asociado a un pedido (POST /orders/{order_id}/transactions).
   * @param {Object} transactionData - Requiere method (cash, transfer, card...), purpose (full_payment, deposit...), amount y transacted_at.
   */
  createTransaction: async (orderId, transactionData) => {
    return await fetchAPI(`/orders/${orderId}/transactions`, {
      method: 'POST',
      body: JSON.stringify(transactionData),
    });
  },

  /**
   * Listar todas las transacciones registradas de un pedido (GET /orders/{order_id}/transactions).
   */
  getTransactions: async (orderId) => {
    return await fetchAPI(`/orders/${orderId}/transactions`, { method: 'GET' });
  },
};