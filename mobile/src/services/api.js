import { API_URL } from '../config';

const TIMEOUT_MS = 15000;
const NETWORK_ERROR_MESSAGE = 'No se pudo conectar con el servidor';

// El token vive en memoria: AuthContext lo asigna al iniciar sesión o al recuperar
// la sesión guardada, para no leer SecureStore (asíncrono) en cada petición.
let authToken = null;

// Función que se ejecuta cuando el backend responde 401 a una petición con token
// (sesión expirada o token inválido). La registra AuthContext para cerrar sesión.
let unauthorizedHandler = null;

export function setAuthToken(token) {
  authToken = token || null;
}

export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = handler;
}

function buildError(message, status, data = null) {
  const error = new Error(message);
  error.status = status;
  error.data = data;
  return error;
}

function parseJson(text) {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/**
 * Cliente HTTP centralizado para comunicarse con el backend NestJS.
 * Misma lógica que frontend/src/services/api.js, adaptada a React Native.
 * Los errores lanzados tienen err.message (el de la API; si es lista, el primero)
 * y err.status (código HTTP, o 0 si no hubo respuesta del servidor).
 */
async function request(endpoint, { method = 'GET', body, headers: extraHeaders } = {}) {
  if (!API_URL) {
    throw buildError('La app no tiene configurada la URL del servidor', 0);
  }

  const token = authToken;

  const headers = {
    Accept: 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extraHeaders,
  };

  const config = { method, headers };

  if (body !== undefined && body !== null) {
    headers['Content-Type'] = 'application/json';
    config.body = JSON.stringify(body);
  }

  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  // Si el servidor no responde en TIMEOUT_MS, se corta la petición.
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
  config.signal = controller.signal;

  let response;
  let text;
  try {
    response = await fetch(`${API_URL}${cleanEndpoint}`, config);
    text = await response.text();
  } catch {
    // Sin conexión, servidor apagado, URL inalcanzable o timeout.
    throw buildError(NETWORK_ERROR_MESSAGE, 0);
  } finally {
    clearTimeout(timeoutId);
  }

  // 204 o respuesta sin cuerpo (ej. POST /favorites/:id) → null.
  const data = parseJson(text);

  if (!response.ok) {
    // Solo si se envió token: un 401 del login (credenciales malas) no debe cerrar sesión.
    // Si el token cambió mientras tanto (otra sesión), la respuesta vieja se ignora.
    if (response.status === 401 && token && token === authToken && unauthorizedHandler) {
      unauthorizedHandler();
    }

    const errorMessage =
      (data && (Array.isArray(data.message) ? data.message[0] : data.message)) ||
      `Error del servidor (${response.status})`;

    throw buildError(errorMessage, response.status, data);
  }

  return data;
}

const api = {
  get: (endpoint, options = {}) => request(endpoint, { ...options, method: 'GET' }),

  post: (endpoint, body, options = {}) =>
    request(endpoint, { ...options, method: 'POST', body }),

  patch: (endpoint, body, options = {}) =>
    request(endpoint, { ...options, method: 'PATCH', body }),

  delete: (endpoint, options = {}) => request(endpoint, { ...options, method: 'DELETE' }),
};

export default api;
