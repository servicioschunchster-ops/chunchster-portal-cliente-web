import { fetchAPI } from './api';

// ==========================================
// SERVICIO DE CATÁLOGO
// ==========================================
export class CatalogService {
  constructor(apiClient) {
    this.apiClient = apiClient;
    this.basePath = '/catalog';
  }

  async getCatalog(params = {}) {
    // Si hay tags, se deben procesar como query params, no como body
    const query = new URLSearchParams(params).toString();
    const endpoint = query ? `${this.basePath}?${query}` : this.basePath;
    
    return await this.apiClient(endpoint, { method: 'GET' });
  }

  async getProductDetails(productId) {
    return await this.apiClient(`${this.basePath}/${productId}`, { method: 'GET' });
  }

  async createProduct(productData) {
    return await this.apiClient(this.basePath, {
      method: 'POST',
      body: JSON.stringify(productData),
    });
  }

  async updateProduct(productId, updateData) {
    return await this.apiClient(`${this.basePath}/${productId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  }

  async deleteProduct(productId) {
    return await this.apiClient(`${this.basePath}/${productId}`, { method: 'DELETE' });
  }

  async uploadProductImage(productId, imageData) {
    return await this.apiClient(`${this.basePath}/${productId}/images`, {
      method: 'POST',
      body: JSON.stringify(imageData),
    });
  }
}

// ==========================================
// SERVICIO DE INVENTARIO
// ==========================================
export class InventoryService {
  constructor(apiClient) {
    this.apiClient = apiClient;
    this.basePath = '/inventory';
  }

  async getInventory(params = {}) {
    const query = new URLSearchParams(params).toString();
    const endpoint = query ? `${this.basePath}?${query}` : this.basePath;
    
    return await this.apiClient(endpoint, { method: 'GET' });
  }

  async updateInventoryVariant(variantKey, productId, data) {
    return await this.apiClient(`${this.basePath}/${variantKey}?product_id=${productId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }
}

// ==========================================
// INSTANCIAS (Exportación para el uso en componentes)
// ==========================================
export const catalogService = new CatalogService(fetchAPI);
export const inventoryService = new InventoryService(fetchAPI);