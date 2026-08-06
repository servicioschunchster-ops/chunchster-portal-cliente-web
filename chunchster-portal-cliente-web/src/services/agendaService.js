import { fetchAPI } from './api';

export const agendaService = {
  // ==========================================
  // MÓDULO DE PEDIDOS PRINCIPAL (Orders)
  // ==========================================

  /**
   * Listar pedidos del tenant con filtros opcionales (GET /orders)[cite: 1].
   * @param {Object} params - Parámetros de query opcionales[cite: 1].
   * @param {string} params.status - 'draft', 'confirmed', 'paid', 'preparing', 'shipped', 'delivered', 'returned', 'cancelled'[cite: 1].
   * @param {string} params.order_type - 'sale' | 'rental'[cite: 1].
   * @param {string} params.customer_id - ID del cliente[cite: 1].
   * @param {string} params.fulfillment_status - 'pending_delivery', 'in_possession', 'completed', 'delayed'[cite: 1].
   * @param {number} params.limit - Default 50, max 100[cite: 1].
   * @param {number} params.offset - Para paginación[cite: 1].
   */
  getAllOrders: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `/orders?${queryString}` : '/orders';
    return await fetchAPI(url, { method: 'GET' });
  },

  /**
   * Crear un nuevo pedido (POST /orders)[cite: 1].
   * @param {Object} orderData - Requiere customer_id, order_type, delivery_type e items. Para alquiler requiere rental_start y rental_end[cite: 1].
   */
  createOrder: async (orderData) => {
    return await fetchAPI('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  },

  /**
   * Obtener detalles completos de un pedido incluyendo sus ítems (GET /orders/{order_id})[cite: 1].
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
   * Actualizar campos operativos del pedido (PATCH /orders/{order_id})[cite: 1].
   * @param {string} orderId - ID del pedido[cite: 1].
   * @param {Object} updateData - Campos opcionales: fulfillment_status, deposit_status, fechas estimadas/reales de entrega y retorno, notas[cite: 1].
   */
  updateOrderOperationalData: async (orderId, updateData) => {
    return await fetchAPI(`/orders/${orderId}`, {
      method: 'PATCH',
      body: JSON.stringify(updateData),
    });
  },

  /**
   * Actualizar el estado del ciclo de vida del pedido (PATCH /orders/{order_id}/status)[cite: 1].
   * @param {string} orderId - ID del pedido[cite: 1].
   * @param {string} status - Obligatorio: 'draft', 'confirmed', 'paid', 'preparing', 'shipped', 'delivered', 'returned', 'cancelled'[cite: 1].
   * @param {string} [notes] - Notas opcionales sobre el cambio de estado[cite: 1].
   */
 // Cambiar el estado del pedido usando el endpoint principal (Workaround API)
  // Cambiar el estado del pedido (Workaround para el Error 500)
  updateOrderStatus: async (orderId, status) => {
    // Enviamos estrictamente el campo 'status'. Si enviamos 'notes' vacío, 
    // la Lambda de AWS actual podría estar crasheando[cite: 1].
    return await fetchAPI(`/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: status }),
    });
  },

  // ==========================================
  // ÍTEMS DEL PEDIDO (Order Items)
  // ==========================================

  /**
   * Listar todos los ítems de un pedido (GET /orders/{order_id}/items)[cite: 1].
   */
  getOrderItems: async (orderId) => {
    return await fetchAPI(`/orders/${orderId}/items`, { method: 'GET' });
  },

  /**
   * Agregar un nuevo ítem a un pedido existente (POST /orders/{order_id}/items)[cite: 1].
   * @param {Object} itemData - Requiere product_id, inventory_id, variant_key, quantity y unit_price[cite: 1].
   */
  addOrderItem: async (orderId, itemData) => {
    return await fetchAPI(`/orders/${orderId}/items`, {
      method: 'POST',
      body: JSON.stringify(itemData),
    });
  },

  /**
   * Actualizar cantidad o precio de un ítem (PUT /orders/{order_id}/items/{item_id})[cite: 1].
   * @param {Object} updateData - Al menos un campo requerido: quantity o unit_price[cite: 1].
   */
  updateOrderItem: async (orderId, itemId, updateData) => {
    return await fetchAPI(`/orders/${orderId}/items/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  },

  /**
   * Eliminar un ítem de un pedido (DELETE /orders/{order_id}/items/{item_id})[cite: 1].
   */
  deleteOrderItem: async (orderId, itemId) => {
    return await fetchAPI(`/orders/${orderId}/items/${itemId}`, { method: 'DELETE' });
  },

  // ==========================================
  // TRANSACCIONES / PAGOS (Order Transactions)
  // ==========================================

  /**
   * Registrar un pago manual asociado a un pedido (POST /orders/{order_id}/transactions)[cite: 1].
   * @param {Object} transactionData - Requiere method (cash, transfer, card...), purpose (full_payment, deposit...), amount y transacted_at[cite: 1].
   */
  createTransaction: async (orderId, transactionData) => {
    return await fetchAPI(`/orders/${orderId}/transactions`, {
      method: 'POST',
      body: JSON.stringify(transactionData),
    });
  },

  /**
   * Listar todas las transacciones registradas de un pedido (GET /orders/{order_id}/transactions)[cite: 1].
   */
  getTransactions: async (orderId) => {
    return await fetchAPI(`/orders/${orderId}/transactions`, { method: 'GET' });
  }
};