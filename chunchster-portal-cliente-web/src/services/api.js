// Leemos las variables de entorno configuradas en Vite
const API_URL = import.meta.env.VITE_API_BASE_URL;
const API_KEY = import.meta.env.VITE_API_KEY;
const TENANT_ID = import.meta.env.VITE_TENANT_ID;

/**
 * Cliente base para consumir la API de AWS.
 * Inyecta automáticamente los headers requeridos.
 *
 * @param {string} endpoint
 * @param {Object} options - Opciones estándar de fetch (method, body, headers...)
 *   más un flag propio opcional:
 * @param {boolean} [options.silent] - Si es true, no hace console.error cuando
 *   la llamada falla (usa console.debug en su lugar). Pensado para casos donde
 *   el caller YA espera que la llamada pueda fallar como parte normal del flujo
 *   (ej. "verificar si este customer_id existe"), y no queremos ensuciar la
 *   consola con algo que no es un bug. No cambia el comportamiento default.
 */
export const fetchAPI = async (endpoint, options = {}) => {
  const { silent, ...fetchOptions } = options;

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...fetchOptions,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'x-tenant-id': TENANT_ID,
        ...fetchOptions.headers,
      },
    });

    const data = await response.json();

    // La API de AWS devuelve "success: false" si hay un error controlado
    if (!data.success) {
      throw new Error(data.error || 'Error desconocido en la API');
    }

    return data;
  } catch (error) {
    if (silent) {
      console.debug(`[esperado] Error en llamada a API [${endpoint}]:`, error.message);
    } else {
      console.error(`Error en llamada a API [${endpoint}]:`, error);
    }
    throw error;
  }
};