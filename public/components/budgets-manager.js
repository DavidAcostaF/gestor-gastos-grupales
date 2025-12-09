/**
 * Budgets Manager Web Component
 * Custom element for managing budgets CRUD operations with Shadow DOM
 */
import { apiRequest, showToast } from '../js/api.js';
import { checkAuth } from '../js/auth.js';

class BudgetsManager extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.allBudgets = [];
    this.allGroups = [];
  }

  connectedCallback() {
    checkAuth();
    this.render();
    this.loadData();
  }

  async loadData() {
    await this.loadGroups();
    await this.loadBudgets();
  }

  async loadGroups() {
    try {
      const response = await apiRequest('/api/v1/groups');
      if (response.success) {
        this.allGroups = response.data;
        this.populateGroupSelect();
      }
    } catch (error) {
      console.error('Error loading groups:', error);
    }
  }

  populateGroupSelect() {
    const select = this.shadowRoot.querySelector('#budget-group');
    const options = this.allGroups.map(g => `<option value="${g._id}">${g.name}</option>`).join('');
    select.innerHTML = `<option value="">Seleccionar grupo</option>` + options;
  }

  async loadBudgets() {
    try {
      const response = await apiRequest('/api/v1/budgets');
      if (response.success) {
        this.allBudgets = response.data;
        this.renderBudgets();
      }
    } catch (error) {
      showToast('Error al cargar presupuestos', 'error');
    }
  }

  renderBudgets() {
    const tbody = this.shadowRoot.querySelector('#budgets-table');

    if (this.allBudgets.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6">
            <div class="empty-state">
              <i class="fas fa-piggy-bank"></i>
              <h3>No hay presupuestos</h3>
              <p>Crea tu primer presupuesto para controlar gastos</p>
              <button class="btn btn-primary mt-2" id="empty-create-btn">
                <i class="fas fa-plus"></i> Nuevo Presupuesto
              </button>
            </div>
          </td>
        </tr>
      `;
      const emptyBtn = this.shadowRoot.querySelector('#empty-create-btn');
      if (emptyBtn) emptyBtn.addEventListener('click', () => this.openModal('create'));
      return;
    }

    tbody.innerHTML = this.allBudgets.map(budget => {
      const group = this.allGroups.find(g => g._id === budget.groupId);
      const spent = budget.spent || 0;
      const limit = budget.limit || 0;
      const percentage = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
      const progressColor = percentage >= 90 ? '#ef4444' : percentage >= 70 ? '#f59e0b' : '#10b981';

      return `
        <tr>
          <td><strong>${group ? group.name : '-'}</strong></td>
          <td>${budget.category || '-'}</td>
          <td>${this.formatCurrency(limit)}</td>
          <td>${this.formatCurrency(spent)}</td>
          <td>
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <div style="flex: 1; height: 8px; background: var(--border-color); border-radius: 4px; overflow: hidden;">
                <div style="width: ${percentage}%; height: 100%; background: ${progressColor};"></div>
              </div>
              <span style="font-size: 0.8rem; color: var(--text-secondary);">${percentage.toFixed(0)}%</span>
            </div>
          </td>
          <td>
            <div class="flex" style="gap: 0.5rem;">
              <button class="btn btn-sm btn-ghost edit-btn" data-id="${budget._id}" title="Editar">
                <i class="fas fa-edit"></i>
              </button>
              <button class="btn btn-sm btn-ghost delete-btn" data-id="${budget._id}" title="Eliminar">
                <i class="fas fa-trash" style="color: var(--danger-color);"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    this.shadowRoot.querySelectorAll('.edit-btn').forEach(btn => {
      btn.addEventListener('click', () => this.openModal('edit', btn.dataset.id));
    });
    this.shadowRoot.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', () => this.openDeleteModal(btn.dataset.id));
    });
  }

  filterBudgets() {
    const searchTerm = this.shadowRoot.querySelector('#search-input').value.toLowerCase();
    const filtered = this.allBudgets.filter(budget => {
      const group = this.allGroups.find(g => g._id === budget.groupId);
      return (budget.category && budget.category.toLowerCase().includes(searchTerm)) ||
        (group && group.name.toLowerCase().includes(searchTerm));
    });
    const original = this.allBudgets;
    this.allBudgets = filtered;
    this.renderBudgets();
    this.allBudgets = original;
  }

  openModal(mode, budgetId = null) {
    const modal = this.shadowRoot.querySelector('#budget-modal');
    const title = this.shadowRoot.querySelector('#modal-title');
    const form = this.shadowRoot.querySelector('#budget-form');

    form.reset();
    this.shadowRoot.querySelector('#budget-id').value = '';

    if (mode === 'create') {
      title.textContent = 'Nuevo Presupuesto';
    } else {
      title.textContent = 'Editar Presupuesto';
      const budget = this.allBudgets.find(b => b._id === budgetId);
      if (budget) {
        this.shadowRoot.querySelector('#budget-id').value = budget._id;
        this.shadowRoot.querySelector('#budget-group').value = budget.groupId || '';
        this.shadowRoot.querySelector('#budget-category').value = budget.category || '';
        this.shadowRoot.querySelector('#budget-limit').value = budget.limit || '';
      }
    }

    modal.classList.add('active');
  }

  closeModal() {
    this.shadowRoot.querySelector('#budget-modal').classList.remove('active');
  }

  async saveBudget() {
    const id = this.shadowRoot.querySelector('#budget-id').value;
    const groupId = this.shadowRoot.querySelector('#budget-group').value;
    const category = this.shadowRoot.querySelector('#budget-category').value;
    const limit = parseFloat(this.shadowRoot.querySelector('#budget-limit').value);

    if (!groupId || !category || !limit) {
      showToast('Completa los campos obligatorios', 'error');
      return;
    }

    const data = { groupId, category, limit };

    const btn = this.shadowRoot.querySelector('#save-btn');
    btn.disabled = true;

    try {
      let response;
      if (id) {
        response = await apiRequest(`/api/v1/budgets/${id}`, 'PATCH', data);
      } else {
        response = await apiRequest('/api/v1/budgets', 'POST', data);
      }

      if (response.success) {
        showToast(id ? 'Presupuesto actualizado' : 'Presupuesto creado', 'success');
        this.closeModal();
        this.loadBudgets();
      } else {
        showToast(response.message || 'Error al guardar', 'error');
      }
    } catch (error) {
      showToast('Error al guardar presupuesto', 'error');
    } finally {
      btn.disabled = false;
    }
  }

  openDeleteModal(budgetId) {
    this.shadowRoot.querySelector('#delete-budget-id').value = budgetId;
    this.shadowRoot.querySelector('#delete-modal').classList.add('active');
  }

  closeDeleteModal() {
    this.shadowRoot.querySelector('#delete-modal').classList.remove('active');
  }

  async confirmDelete() {
    const id = this.shadowRoot.querySelector('#delete-budget-id').value;

    try {
      const response = await apiRequest(`/api/v1/budgets/${id}`, 'DELETE');
      if (response.success) {
        showToast('Presupuesto eliminado', 'success');
        this.closeDeleteModal();
        this.loadBudgets();
      } else {
        showToast('Error al eliminar', 'error');
      }
    } catch (error) {
      showToast('Error al eliminar presupuesto', 'error');
    }
  }

  formatCurrency(amount) {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount || 0);
  }

  render() {
    this.shadowRoot.innerHTML = `
      <link rel="stylesheet" href="/css/styles.css">
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
      <main class="main-content">
        <header class="main-header">
          <div class="header-left">
            <button class="menu-toggle" id="menu-toggle-btn">
              <i class="fas fa-bars"></i>
            </button>
            <h1 class="page-title">Presupuestos</h1>
          </div>
          <div class="header-right">
            <button class="btn btn-primary" id="new-budget-btn">
              <i class="fas fa-plus"></i>
              Nuevo Presupuesto
            </button>
          </div>
        </header>

        <div class="main-container">
          <div class="table-container">
            <div class="table-header">
              <h3 class="table-title">Todos los Presupuestos</h3>
              <div class="table-actions">
                <input type="text" class="form-input" placeholder="Buscar..." id="search-input" style="width: 200px;">
              </div>
            </div>
            <div class="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>Grupo</th>
                    <th>Categoría</th>
                    <th>Límite</th>
                    <th>Gastado</th>
                    <th>Progreso</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody id="budgets-table">
                  <tr>
                    <td colspan="6" class="text-center">
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

      <!-- Modal Create/Edit Budget -->
      <div class="modal-overlay" id="budget-modal">
        <div class="modal">
          <div class="modal-header">
            <h3 class="modal-title" id="modal-title">Nuevo Presupuesto</h3>
            <button class="modal-close" id="modal-close-btn">&times;</button>
          </div>
          <div class="modal-body">
            <form id="budget-form">
              <input type="hidden" id="budget-id">
              
              <div class="form-group">
                <label for="budget-group" class="form-label">Grupo *</label>
                <select id="budget-group" class="form-select" required>
                  <option value="">Seleccionar grupo</option>
                </select>
              </div>

              <div class="form-group">
                <label for="budget-category" class="form-label">Categoría *</label>
                <input type="text" id="budget-category" class="form-input" placeholder="Ej: Alimentación" required>
              </div>

              <div class="form-group">
                <label for="budget-limit" class="form-label">Límite de gasto *</label>
                <input type="number" id="budget-limit" class="form-input" placeholder="0.00" step="0.01" min="0" required>
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
            <p>¿Estás seguro de que deseas eliminar este presupuesto?</p>
            <input type="hidden" id="delete-budget-id">
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
    this.shadowRoot.querySelector('#new-budget-btn').addEventListener('click', () => this.openModal('create'));
    this.shadowRoot.querySelector('#search-input').addEventListener('keyup', () => this.filterBudgets());
    this.shadowRoot.querySelector('#modal-close-btn').addEventListener('click', () => this.closeModal());
    this.shadowRoot.querySelector('#cancel-btn').addEventListener('click', () => this.closeModal());
    this.shadowRoot.querySelector('#save-btn').addEventListener('click', () => this.saveBudget());
    this.shadowRoot.querySelector('#delete-close-btn').addEventListener('click', () => this.closeDeleteModal());
    this.shadowRoot.querySelector('#delete-cancel-btn').addEventListener('click', () => this.closeDeleteModal());
    this.shadowRoot.querySelector('#confirm-delete-btn').addEventListener('click', () => this.confirmDelete());
  }
}

customElements.define('budgets-manager', BudgetsManager);

export { BudgetsManager };
