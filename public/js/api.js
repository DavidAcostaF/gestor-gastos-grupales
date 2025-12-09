// API Configuration - ES Module
const API_BASE_URL = window.location.origin;

/**
 * Realiza una petición a la API
 * @param {string} endpoint - El endpoint de la API
 * @param {string} method - El método HTTP (GET, POST, PATCH, DELETE)
 * @param {object} data - Los datos a enviar (opcional)
 * @returns {Promise<object>} - La respuesta de la API
 */
export async function apiRequest(endpoint, method = 'GET', data = null) {
  const token = localStorage.getItem('token');

  const headers = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    method,
    headers,
  };

  if (data && (method === 'POST' || method === 'PATCH' || method === 'PUT')) {
    config.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    // Manejar respuestas sin cuerpo (204 No Content) o contenidos no JSON
    const contentType = response.headers.get('content-type') || '';
    let result = null;

    if (response.status === 204 || !contentType.includes('application/json')) {
      // Devuelve un resultado básico indicando éxito según el status
      result = { success: response.status >= 200 && response.status < 300 };
    } else {
      try {
        result = await response.json();
      } catch (err) {
        // Si falla el parseo JSON, devolver un objeto básico
        result = { success: response.status >= 200 && response.status < 300 };
      }
    }

    // Si el token expiró o es inválido
    if (response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/index.html';
      return { success: false, message: 'Sesión expirada' };
    }

    return result;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

/**
 * Muestra una notificación toast
 * @param {string} message - El mensaje a mostrar
 * @param {string} type - El tipo de notificación (success, error, warning, info)
 */
export function showToast(message, type = 'info') {
  const container = document.querySelector('toast-container');
  if (container && container.show) {
    container.show(message, type);
  }
}

/**
 * Formatea una fecha a formato legible
 * @param {string} dateString - La fecha en formato ISO
 * @returns {string} - La fecha formateada
 */
export function formatDateLocale(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
}

/**
 * Formatea un monto a moneda
 * @param {number} amount - El monto a formatear
 * @param {string} currency - El código de moneda (default: MXN)
 * @returns {string} - El monto formateado
 */
export function formatMoney(amount, currency = 'MXN') {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: currency
  }).format(amount || 0);
}

/**
 * Obtiene las iniciales de un nombre
 * @param {string} name - El nombre completo
 * @returns {string} - Las iniciales (máximo 2 caracteres)
 */
export function getInitials(name) {
  if (!name) return 'U';
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
}

/**
 * Debounce function para limitar llamadas frecuentes
 * @param {function} func - La función a ejecutar
 * @param {number} wait - El tiempo de espera en ms
 * @returns {function} - La función con debounce
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Valida un email
 * @param {string} email - El email a validar
 * @returns {boolean} - true si es válido
 */
export function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

/**
 * Escapa HTML para prevenir XSS
 * @param {string} text - El texto a escapar
 * @returns {string} - El texto escapado
 */
export function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Formatea una fecha corta
 * @param {string} dateString - La fecha en formato ISO 
 * @returns {string} - La fecha formateada
 */
export function formatDate(dateString) {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}
