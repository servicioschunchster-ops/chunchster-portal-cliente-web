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

  /** GET /customers/{customer_id} */
  async getCustomerById(customerId) {
    return await this.apiClient(`${this.basePath}/${customerId}`, { method: 'GET' });
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