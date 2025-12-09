/**
 * Users Manager Web Component
 * Custom element for managing users CRUD operations with Shadow DOM
 */
import { apiRequest, showToast, formatDate, getInitials } from '../js/api.js';
import { checkAuth } from '../js/auth.js';

class UsersManager extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.allUsers = [];
  }

  connectedCallback() {
    checkAuth();
    this.render();
    this.loadUsers();
  }

  async loadUsers() {
    try {
      const response = await apiRequest('/api/v1/users');
      if (response.success) {
        this.allUsers = response.data;
        this.renderUsers();
      }
    } catch (error) {
      showToast('Error al cargar usuarios', 'error');
    }
  }

  renderUsers() {
    const tbody = this.shadowRoot.querySelector('#users-table');

    if (this.allUsers.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5">
            <div class="empty-state">
              <i class="fas fa-users"></i>
              <h3>No hay usuarios</h3>
              <p>Crea el primer usuario para comenzar</p>
              <button class="btn btn-primary mt-2" id="empty-create-btn">
                <i class="fas fa-user-plus"></i> Nuevo Usuario
              </button>
            </div>
          </td>
        </tr>
      `;
      const emptyBtn = this.shadowRoot.querySelector('#empty-create-btn');
      if (emptyBtn) emptyBtn.addEventListener('click', () => this.openModal('create'));
      return;
    }

    tbody.innerHTML = this.allUsers.map(user => `
      <tr>
        <td>
          <div class="flex" style="align-items: center; gap: 0.75rem;">
            <div class="user-avatar" style="width: 40px; height: 40px; font-size: 0.9rem;">
              ${getInitials(user.name)}
            </div>
            <strong>${user.name}</strong>
          </div>
        </td>
        <td>${user.email}</td>
        <td>
          <span class="badge ${user.status === 'active' ? 'badge-success' : 'badge-warning'}">
            ${user.status === 'active' ? 'Activo' : 'Inactivo'}
          </span>
        </td>
        <td>${formatDate(user.createdAt)}</td>
        <td>
          <div class="flex" style="gap: 0.5rem;">
            <button class="btn btn-sm btn-ghost edit-btn" data-id="${user._id}" title="Editar">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn btn-sm btn-ghost delete-btn" data-id="${user._id}" title="Eliminar">
              <i class="fas fa-trash" style="color: var(--danger-color);"></i>
            </button>
          </div>
        </td>
      </tr>
    `).join('');

    this.shadowRoot.querySelectorAll('.edit-btn').forEach(btn => {
      btn.addEventListener('click', () => this.openModal('edit', btn.dataset.id));
    });
    this.shadowRoot.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', () => this.openDeleteModal(btn.dataset.id));
    });
  }

  filterUsers() {
    const searchTerm = this.shadowRoot.querySelector('#search-input').value.toLowerCase();
    const status = this.shadowRoot.querySelector('#filter-status').value;

    let filtered = this.allUsers;

    if (status) {
      filtered = filtered.filter(user => user.status === status);
    }

    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(searchTerm) ||
        user.email.toLowerCase().includes(searchTerm)
      );
    }

    const original = this.allUsers;
    this.allUsers = filtered;
    this.renderUsers();
    this.allUsers = original;
  }

  openModal(mode, userId = null) {
    const modal = this.shadowRoot.querySelector('#user-modal');
    const title = this.shadowRoot.querySelector('#modal-title');
    const form = this.shadowRoot.querySelector('#user-form');
    const passwordInput = this.shadowRoot.querySelector('#user-password');
    const passwordHelp = this.shadowRoot.querySelector('#password-help');

    form.reset();
    this.shadowRoot.querySelector('#user-id').value = '';

    if (mode === 'create') {
      title.textContent = 'Nuevo Usuario';
      passwordInput.required = true;
      passwordHelp.textContent = 'Mínimo 6 caracteres';
    } else {
      title.textContent = 'Editar Usuario';
      passwordInput.required = false;
      passwordHelp.textContent = 'Dejar vacío para mantener la contraseña actual';

      const user = this.allUsers.find(u => u._id === userId);
      if (user) {
        this.shadowRoot.querySelector('#user-id').value = user._id;
        this.shadowRoot.querySelector('#user-name-input').value = user.name;
        this.shadowRoot.querySelector('#user-email-input').value = user.email;
        this.shadowRoot.querySelector('#user-status').value = user.status || 'active';
      }
    }

    modal.classList.add('active');
  }

  closeModal() {
    this.shadowRoot.querySelector('#user-modal').classList.remove('active');
  }

  async saveUser() {
    const id = this.shadowRoot.querySelector('#user-id').value;
    const name = this.shadowRoot.querySelector('#user-name-input').value;
    const email = this.shadowRoot.querySelector('#user-email-input').value;
    const password = this.shadowRoot.querySelector('#user-password').value;
    const status = this.shadowRoot.querySelector('#user-status').value;

    if (!name || !email) {
      showToast('Nombre y email son obligatorios', 'error');
      return;
    }

    if (!id && !password) {
      showToast('La contraseña es obligatoria para nuevos usuarios', 'error');
      return;
    }

    if (password && password.length < 6) {
      showToast('La contraseña debe tener al menos 6 caracteres', 'error');
      return;
    }

    const data = { name, email, status };
    if (password) {
      data.password = password;
    }

    const btn = this.shadowRoot.querySelector('#save-btn');
    btn.disabled = true;

    try {
      let response;
      if (id) {
        response = await apiRequest(`/api/v1/users/${id}`, 'PATCH', data);
      } else {
        response = await apiRequest('/api/v1/users', 'POST', data);
      }

      if (response.success) {
        showToast(id ? 'Usuario actualizado' : 'Usuario creado', 'success');
        this.closeModal();
        this.loadUsers();
      } else {
        showToast(response.message || 'Error al guardar', 'error');
      }
    } catch (error) {
      showToast('Error al guardar usuario', 'error');
    } finally {
      btn.disabled = false;
    }
  }

  openDeleteModal(userId) {
    this.shadowRoot.querySelector('#delete-user-id').value = userId;
    this.shadowRoot.querySelector('#delete-modal').classList.add('active');
  }

  closeDeleteModal() {
    this.shadowRoot.querySelector('#delete-modal').classList.remove('active');
  }

  async confirmDelete() {
    const id = this.shadowRoot.querySelector('#delete-user-id').value;

    try {
      const response = await apiRequest(`/api/v1/users/${id}`, 'DELETE');
      if (response.success) {
        showToast('Usuario eliminado', 'success');
        this.closeDeleteModal();
        this.loadUsers();
      } else {
        showToast('Error al eliminar', 'error');
      }
    } catch (error) {
      showToast('Error al eliminar usuario', 'error');
    }
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          flex: 1 1 auto;
          min-height: 100vh;
          background: #fafafa;
          overflow-x: hidden;
        }
        .main-content {
          margin: 0;
          padding: 0;
          width: 100%;
          min-height: 100vh;
        }
      </style>
      <link rel="stylesheet" href="/css/styles.css">
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
      <main class="main-content">
        <header class="main-header">
          <div class="header-left">
            <button class="menu-toggle" id="menu-toggle-btn">
              <i class="fas fa-bars"></i>
            </button>
            <h1 class="page-title">Usuarios</h1>
          </div>
          <div class="header-right">
            <button class="btn btn-primary" id="new-user-btn">
              <i class="fas fa-user-plus"></i>
              Nuevo Usuario
            </button>
          </div>
        </header>

        <div class="main-container">
          <div class="table-container">
            <div class="table-header">
              <h3 class="table-title">Todos los Usuarios</h3>
              <div class="table-actions">
                <select class="form-select" id="filter-status" style="width: 150px;">
                  <option value="">Todos</option>
                  <option value="active">Activos</option>
                  <option value="inactive">Inactivos</option>
                </select>
                <input type="text" class="form-input" placeholder="Buscar..." id="search-input" style="width: 180px;">
              </div>
            </div>
            <div class="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>Usuario</th>
                    <th>Email</th>
                    <th>Estado</th>
                    <th>Registrado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody id="users-table">
                  <tr>
                    <td colspan="5" class="text-center">
                      <div class="loading">
                        <div class="spinner"></div>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      <!-- Modal Create/Edit User -->
      <div class="modal-overlay" id="user-modal">
        <div class="modal">
          <div class="modal-header">
            <h3 class="modal-title" id="modal-title">Nuevo Usuario</h3>
            <button class="modal-close" id="modal-close-btn">&times;</button>
          </div>
          <div class="modal-body">
            <form id="user-form">
              <input type="hidden" id="user-id">
              
              <div class="form-group">
                <label for="user-name-input" class="form-label">Nombre completo *</label>
                <input type="text" id="user-name-input" class="form-input" placeholder="Juan Pérez" required>
              </div>

              <div class="form-group">
                <label for="user-email-input" class="form-label">Correo electrónico *</label>
                <input type="email" id="user-email-input" class="form-input" placeholder="correo@ejemplo.com" required>
              </div>

              <div class="form-group" id="password-group">
                <label for="user-password" class="form-label">Contraseña *</label>
                <input type="password" id="user-password" class="form-input" placeholder="Mínimo 6 caracteres" minlength="6">
                <p class="form-help" id="password-help">Mínimo 6 caracteres</p>
              </div>

              <div class="form-group">
                <label for="user-status" class="form-label">Estado</label>
                <select id="user-status" class="form-select">
                  <option value="active">Activo</option>
                  <option value="inactive">Inactivo</option>
                </select>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button class="btn btn-ghost" id="cancel-btn">Cancelar</button>
            <button class="btn btn-primary" id="save-btn">
              <i class="fas fa-save"></i>
              Guardar
            </button>
          </div>
        </div>
      </div>

      <!-- Modal Confirm Delete -->
      <div class="modal-overlay" id="delete-modal">
        <div class="modal" style="max-width: 400px;">
          <div class="modal-header">
            <h3 class="modal-title">Confirmar eliminación</h3>
            <button class="modal-close" id="delete-close-btn">&times;</button>
          </div>
          <div class="modal-body">
            <p>¿Estás seguro de que deseas eliminar este usuario? Esta acción no se puede deshacer.</p>
            <input type="hidden" id="delete-user-id">
          </div>
          <div class="modal-footer">
            <button class="btn btn-ghost" id="delete-cancel-btn">Cancelar</button>
            <button class="btn btn-danger" id="confirm-delete-btn">
              <i class="fas fa-trash"></i>
              Eliminar
            </button>
          </div>
        </div>
      </div>
    `;

    // Attach event listeners
    this.shadowRoot.querySelector('#menu-toggle-btn').addEventListener('click', () => window.toggleSidebar());
    this.shadowRoot.querySelector('#new-user-btn').addEventListener('click', () => this.openModal('create'));
    this.shadowRoot.querySelector('#search-input').addEventListener('keyup', () => this.filterUsers());
    this.shadowRoot.querySelector('#filter-status').addEventListener('change', () => this.filterUsers());
    this.shadowRoot.querySelector('#modal-close-btn').addEventListener('click', () => this.closeModal());
    this.shadowRoot.querySelector('#cancel-btn').addEventListener('click', () => this.closeModal());
    this.shadowRoot.querySelector('#save-btn').addEventListener('click', () => this.saveUser());
    this.shadowRoot.querySelector('#delete-close-btn').addEventListener('click', () => this.closeDeleteModal());
    this.shadowRoot.querySelector('#delete-cancel-btn').addEventListener('click', () => this.closeDeleteModal());
    this.shadowRoot.querySelector('#confirm-delete-btn').addEventListener('click', () => this.confirmDelete());
  }
}

customElements.define('users-manager', UsersManager);

export { UsersManager };
