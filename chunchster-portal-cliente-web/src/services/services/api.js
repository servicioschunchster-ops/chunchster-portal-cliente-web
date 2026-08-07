// Leemos las variables de entorno configuradas en Vite
const API_URL = import.meta.env.VITE_API_BASE_URL;
const API_KEY = import.meta.env.VITE_API_KEY;
const TENANT_ID = import.meta.env.VITE_TENANT_ID;

/**
 * Cliente base para consumir la API de AWS.
 * Inyecta automáticamente los headers requeridos.
 */
export const fetchAPI = async (endpoint, options = {}) => {
  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'x-tenant-id': TENANT_ID,
        ...options.headers,
      },
    });

    const data = await response.json();

    // La API de AWS devuelve "success: false" si hay un error controlado
    if (!data.success) {
      throw new Error(data.error || 'Error desconocido en la API');
    }

    return data;
  } catch (error) {
    console.error(`Error en llamada a API [${endpoint}]:`, error);
    throw error;
  }
};