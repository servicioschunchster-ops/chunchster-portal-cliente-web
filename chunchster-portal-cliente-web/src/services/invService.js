import { fetchAPI } from './api';

export const invService = {
  // ==========================================
  // MÓDULO DE CATÁLOGO (Products)
  // ==========================================

  // Listar todos los productos activos (GET /catalog)
  // Puede recibir query params opcionales y tags en el body para búsquedas avanzadas
  getCatalog: async (params = {}, bodyTags = null) => {
    const query = new URLSearchParams(params).toString();
    const endpoint = query ? `/catalog?${query}` : '/catalog';
    
    const options = { method: 'GET' };
    if (bodyTags) {
      options.body = JSON.stringify({ tags: bodyTags });
    }
    
    return await fetchAPI(endpoint, options);
  },

  // Obtener detalles completos de un producto incluyendo inventario (GET /catalog/{product_id})
  getProductDetails: async (productId) => {
    return await fetchAPI(`/catalog/${productId}`, { method: 'GET' });
  },

  // Crear un nuevo producto (POST /catalog)
  createProduct: async (productData) => {
    return await fetchAPI('/catalog', {
      method: 'POST',
      body: JSON.stringify(productData),
    });
  },

  // Actualizar un producto existente (PUT /catalog/{product_id})
  updateProduct: async (productId, updateData) => {
    return await fetchAPI(`/catalog/${productId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  },

  // Desactivar un producto / Soft delete (DELETE /catalog/{product_id})
  deleteProduct: async (productId) => {
    return await fetchAPI(`/catalog/${productId}`, { method: 'DELETE' });
  },

  // ==========================================
  // MÓDULO DE INVENTARIO (Stock)
  // ==========================================

  // Listar todo el inventario/stock del tenant (GET /inventory)
  getInventory: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const endpoint = query ? `/inventory?${query}` : '/inventory';
    
    return await fetchAPI(endpoint, { method: 'GET' });
  },
  // Subir imagen de un producto (POST /catalog/{product_id}/images)
  uploadProductImage: async (productId, imageData) => {
    return await fetchAPI(`/catalog/${productId}/images`, {
      method: 'POST',
      body: JSON.stringify(imageData),
    });
  },

  // Actualizar cantidad disponible de una variante (PUT /inventory/{variant_key})
  updateInventoryVariant: async (variantKey, productId, data) => {
    // productId es requerido como query param
    return await fetchAPI(`/inventory/${variantKey}?product_id=${productId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }
};