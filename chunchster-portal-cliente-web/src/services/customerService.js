import { fetchAPI } from './api';

// ==========================================
// SERVICIO DE CLIENTES (Customers)
// ==========================================
export class CustomerService {
  constructor(apiClient) {
    this.apiClient = apiClient;
    this.basePath = '/customers';
  }

  /**
   * GET /customers
   * Lista de clientes del tenant. Filtros opcionales según convención de la API
   * (ej. search, tags, limit, offset) — ajusta según lo que confirme el backend.
   */
  async getAllCustomers(params = {}) {
    const query = new URLSearchParams(params).toString();
    const endpoint = query ? `${this.basePath}?${query}` : this.basePath;
    return await this.apiClient(endpoint, { method: 'GET' });
  }

  /**
   * GET /customers/{customer_id}
   * @param {string} customerId
   * @param {Object} [options] - Pasa { silent: true } cuando un 404 es un
   *   resultado esperado del flujo (ej. resolver clientes en lote y algunos
   *   IDs no existen) y no quieres que ensucie la consola como error real.
   */
  async getCustomerById(customerId, options = {}) {
    return await this.apiClient(`${this.basePath}/${customerId}`, { method: 'GET', ...options });
  }

  /**
   * POST /customers
   * Payload típico: { name, phone_e164, tags? }
   */
  async createCustomer(customerData) {
    return await this.apiClient(this.basePath, {
      method: 'POST',
      body: JSON.stringify(customerData),
    });
  }

  /** PUT /customers/{customer_id} — campos opcionales */
  async updateCustomer(customerId, updateData) {
    return await this.apiClient(`${this.basePath}/${customerId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  }
}

export const customerService = new CustomerService(fetchAPI);