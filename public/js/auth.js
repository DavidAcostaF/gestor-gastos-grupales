// Auth Functions - ES Module
import { apiRequest, getInitials } from './api.js';

/**
 * Inicia sesión con email y password
 * @param {string} email - El email del usuario
 * @param {string} password - La contraseña del usuario
 * @returns {Promise<object>} - El resultado del login
 */
export async function login(email, password) {
  try {
    const response = await apiRequest('/api/v1/auth/login', 'POST', { email, password });

    if (response.success && response.token) {
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      return { success: true, user: response.user };
    }

    return { success: false, message: response.message || 'Error al iniciar sesión' };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, message: 'Error de conexión' };
  }
}

/**
 * Registra un nuevo usuario
 * @param {string} name - El nombre del usuario
 * @param {string} email - El email del usuario
 * @param {string} password - La contraseña del usuario
 * @returns {Promise<object>} - El resultado del registro
 */
export async function register(name, email, password) {
  try {
    const response = await apiRequest('/api/v1/users', 'POST', { name, email, password });

    if (response.success) {
      return { success: true, message: 'Usuario creado exitosamente' };
    }

    return { success: false, message: response.message || 'Error al registrar' };
  } catch (error) {
    console.error('Register error:', error);
    return { success: false, message: 'Error de conexión' };
  }
}

/**
 * Cierra la sesión del usuario
 */
export function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/index.html';
}

/**
 * Verifica si el usuario está autenticado
 * @returns {boolean} - true si está autenticado
 */
export function isAuthenticated() {
  const token = localStorage.getItem('token');
  return !!token;
}

/**
 * Obtiene el usuario actual del localStorage
 * @returns {object|null} - El usuario actual o null
 */
export function getCurrentUser() {
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;

  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

/**
 * Verifica la autenticación y redirige si no está autenticado
 */
export function checkAuth() {
  if (!isAuthenticated()) {
    window.location.href = '/index.html';
  }
}

/**
 * Carga la información del usuario en el sidebar
 */
export function loadUserInfo() {
  const user = getCurrentUser();

  if (user) {
    const avatarEl = document.getElementById('user-avatar');
    const nameEl = document.getElementById('user-name');
    const emailEl = document.getElementById('user-email');

    if (avatarEl) {
      avatarEl.textContent = getInitials(user.name);
    }
    if (nameEl) {
      nameEl.textContent = user.name || 'Usuario';
    }
    if (emailEl) {
      emailEl.textContent = user.email || '';
    }
  }
}
