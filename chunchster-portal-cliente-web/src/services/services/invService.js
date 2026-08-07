import { fetchAPI } from './api';

// ==========================================
// SERVICIO DE CATÁLOGO
// Endpoints según API_DOCUMENTACION v1.2 — sección "Catálogo (Products)"
// ==========================================
export class CatalogService {
  constructor(apiClient) {
    this.apiClient = apiClient;
    this.basePath = '/catalog';
  }

  /**
   * GET /catalog
   * Query params soportados por la API: category_id, product_type, sort_by, limit, offset, search
   */
  async getCatalog(params = {}) {
    const query = new URLSearchParams(params).toString();
    const endpoint = query ? `${this.basePath}?${query}` : this.basePath;

    return await this.apiClient(endpoint, { method: 'GET' });
  }

  /**
   * GET /catalog (búsqueda multi-tag)
   * La API espera el arreglo "tags" en el body del GET (OR search, case-insensitive,
   * match igual o substring). Se puede combinar con los query params normales
   * (ej. search, category_id, product_type).
   */
  async searchByTags(tags = [], params = {}) {
    const query = new URLSearchParams(params).toString();
    const endpoint = query ? `${this.basePath}?${query}` : this.basePath;

    return await this.apiClient(endpoint, {
      method: 'GET',
      body: JSON.stringify({ tags }),
    });
  }

  /** GET /catalog/{product_id} — incluye inventario por variante */
  async getProductDetails(productId) {
    return await this.apiClient(`${this.basePath}/${productId}`, { method: 'GET' });
  }

  /**
   * POST /catalog
   * Payload completo soportado por la API:
   * { name, description, product_type, base_price, rental_price_day, rental_deposit,
   *   category_id, sku, attributes, tags, default_variant, initial_stock }
   * El servicio hace passthrough del objeto tal cual lo arma el formulario/caller,
   * así que basta con enviar solo los campos que aplican según product_type.
   */
  async createProduct(productData) {
    return await this.apiClient(this.basePath, {
      method: 'POST',
      body: JSON.stringify(productData),
    });
  }

  /** PUT /catalog/{product_id} — todos los campos del body son opcionales */
  async updateProduct(productId, updateData) {
    return await this.apiClient(`${this.basePath}/${productId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  }

  /** DELETE /catalog/{product_id} — soft delete (is_active: false) */
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
// Endpoints según API_DOCUMENTACION v1.2 — sección "Inventario (Inventory)"
// ==========================================
export class InventoryService {
  constructor(apiClient) {
    this.apiClient = apiClient;
    this.basePath = '/inventory';
  }

  /** GET /inventory — filtros opcionales: product_id, low_stock, sort_by */
  async getInventory(params = {}) {
    const query = new URLSearchParams(params).toString();
    const endpoint = query ? `${this.basePath}?${query}` : this.basePath;

    return await this.apiClient(endpoint, { method: 'GET' });
  }

  /** Atajo: inventario de un producto puntual (usa el filtro product_id) */
  async getByProduct(productId) {
    return this.getInventory({ product_id: productId });
  }

  /** Atajo: solo variantes con stock bajo */
  async getLowStock() {
    return this.getInventory({ low_stock: true });
  }

  /**
   * PUT /inventory/{variant_key}?product_id=...
   * Body: { qty_available, restock_alert?, reason? }
   */
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