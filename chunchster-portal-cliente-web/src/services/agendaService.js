import { fetchAPI } from './api';

export const agendaService = {
  // ==========================================
  // MÓDULO DE PEDIDOS PRINCIPAL (Orders)
  // ==========================================

  // Crear un nuevo pedido/agendamiento (POST /orders)
  createOrder: async (orderData) => {
    return await fetchAPI('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  },

  // Obtener detalles completos de un pedido (GET /orders/{order_id})
  getOrderDetails: async (orderId) => {
    return await fetchAPI(`/orders/${orderId}`, { method: 'GET' });
  },

  // Alias compatible para obtener orden por ID
  getOrderById: async (orderId) => {
    return await fetchAPI(`/orders/${orderId}`, { method: 'GET' });
  },

  // Actualizar fechas operativas y datos generales (PATCH /orders/{order_id})
  updateOrderDates: async (orderId, updateData) => {
    return await fetchAPI(`/orders/${orderId}`, {
      method: 'PATCH',
      body: JSON.stringify(updateData),
    });
  },

  // Cambiar el estado del pedido (PATCH /orders/{order_id})
  updateOrderStatus: async (orderId, status, notes) => {
    return await fetchAPI(`/orders/${orderId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, notes }),
    });
  },

  // ==========================================
  // ÍTEMS DEL PEDIDO (Order Items)
  // ==========================================

  // Listar todos los ítems de un pedido (GET /orders/{order_id}/items)
  getOrderItems: async (orderId) => {
    return await fetchAPI(`/orders/${orderId}/items`, { method: 'GET' });
  },

  // Agregar un nuevo ítem a un pedido existente (POST /orders/{order_id}/items)
  addOrderItem: async (orderId, itemData) => {
    return await fetchAPI(`/orders/${orderId}/items`, {
      method: 'POST',
      body: JSON.stringify(itemData),
    });
  },

  // Actualizar cantidad o precio de un ítem (PUT /orders/{order_id}/items/{item_id})
  updateOrderItem: async (orderId, itemId, updateData) => {
    return await fetchAPI(`/orders/${orderId}/items/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  },

  // Eliminar un ítem de un pedido (DELETE /orders/{order_id}/items/{item_id})
  deleteOrderItem: async (orderId, itemId) => {
    return await fetchAPI(`/orders/${orderId}/items/${itemId}`, { method: 'DELETE' });
  },

  // ==========================================
  // TRANSACCIONES / PAGOS (Transactions)
  // ==========================================

  // Registrar un pago externo o en efectivo (POST /orders/{order_id}/transactions)
  createTransaction: async (orderId, transactionData) => {
    return await fetchAPI(`/orders/${orderId}/transactions`, {
      method: 'POST',
      body: JSON.stringify(transactionData),
    });
  },

  // Listar todas las transacciones de un pedido (GET /orders/{order_id}/transactions)
  getTransactions: async (orderId) => {
    return await fetchAPI(`/orders/${orderId}/transactions`, { method: 'GET' });
  },
};