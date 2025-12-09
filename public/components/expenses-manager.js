/**
 * Expenses Manager Web Component
 * Custom element for managing expenses CRUD operations with Shadow DOM
 */
import { apiRequest, showToast, formatDate, getInitials } from '../js/api.js';
import { checkAuth, getCurrentUser } from '../js/auth.js';

class ExpensesManager extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.allExpenses = [];
    this.allGroups = [];
    this.allBudgets = [];
    this.allUsers = [];
  }

  connectedCallback() {
    checkAuth();
    this.render();
    this.loadData();
  }

  async loadData() {
    await Promise.all([this.loadGroups(), this.loadBudgets(), this.loadUsers()]);
    await this.loadExpenses();
  }

  async loadUsers() {
    try {
      const response = await apiRequest('/api/v1/users');
      if (response.success) {
        this.allUsers = response.data;
      }
    } catch (error) {
      console.error('Error loading users:', error);
    }
  }

  async loadBudgets() {
    try {
      const response = await apiRequest('/api/v1/budgets');
      if (response.success) {
        this.allBudgets = response.data;
      }
    } catch (error) {
      console.error('Error loading budgets:', error);
    }
  }

  loadBudgetsForGroup() {
    const groupId = this.shadowRoot.querySelector('#expense-group').value;
    const budgetSelect = this.shadowRoot.querySelector('#expense-budget');

    if (!groupId) {
      budgetSelect.innerHTML = '<option value="">Sin presupuesto</option>';
      return;
    }

    const groupBudgets = this.allBudgets.filter(b => b.groupId === groupId);
    budgetSelect.innerHTML = '<option value="">Sin presupuesto</option>' +
      groupBudgets.map(b => `<option value="${b._id}">${b.category || 'General'} - ${this.formatCurrency(b.limit)}</option>`).join('');
  }

  async loadGroups() {
    try {
      const response = await apiRequest('/api/v1/groups');
      if (response.success) {
        this.allGroups = response.data;
        this.populateGroupSelects();
      }
    } catch (error) {
      console.error('Error loading groups:', error);
    }
  }

  populateGroupSelects() {
    const filterSelect = this.shadowRoot.querySelector('#filter-group');
    const formSelect = this.shadowRoot.querySelector('#expense-group');

    const options = this.allGroups.map(g => `<option value="${g._id}">${g.name}</option>`).join('');

    filterSelect.innerHTML = `<option value="">Todos los grupos</option>` + options;
    formSelect.innerHTML = `<option value="">Seleccionar grupo</option>` + options;
  }

  async loadExpenses() {
    try {
      const response = await apiRequest('/api/v1/expenses');
      if (response.success) {
        this.allExpenses = response.data;
        this.renderExpenses();
        this.updateStats();
      }
    } catch (error) {
      showToast('Error al cargar gastos', 'error');
    }
  }

  updateStats() {
    const total = this.allExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
    this.shadowRoot.querySelector('#total-amount').textContent = this.formatCurrency(total);
    this.shadowRoot.querySelector('#expense-count').textContent = this.allExpenses.length;

    const now = new Date();
    const monthExpenses = this.allExpenses.filter(exp => {
      const expDate = new Date(exp.date);
      return expDate.getMonth() === now.getMonth() && expDate.getFullYear() === now.getFullYear();
    });
    const monthTotal = monthExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
    this.shadowRoot.querySelector('#month-amount').textContent = this.formatCurrency(monthTotal);
  }

  renderExpenses() {
    const tbody = this.shadowRoot.querySelector('#expenses-table');

    if (this.allExpenses.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7">
            <div class="empty-state">
              <i class="fas fa-receipt"></i>
              <h3>No hay gastos</h3>
              <p>Registra tu primer gasto para comenzar</p>
              <button class="btn btn-primary mt-2" id="empty-create-btn">
                <i class="fas fa-plus"></i> Nuevo Gasto
              </button>
            </div>
          </td>
        </tr>
      `;
      const emptyBtn = this.shadowRoot.querySelector('#empty-create-btn');
      if (emptyBtn) emptyBtn.addEventListener('click', () => this.openModal('create'));
      return;
    }

    tbody.innerHTML = this.allExpenses.map(expense => {
      const group = this.allGroups.find(g => g._id === expense.groupId);
      const budget = this.allBudgets.find(b => b._id === expense.budgetId);
      const paidByUser = this.allUsers.find(u => u._id === expense.userId);
      const paidByName = paidByUser ? paidByUser.name : 'Desconocido';

      return `
        <tr>
          <td><strong>${expense.description || 'Sin descripción'}</strong></td>
          <td>
            <span class="badge badge-success">${this.formatCurrency(expense.amount)}</span>
          </td>
          <td>
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <span class="avatar-sm" style="width: 28px; height: 28px; border-radius: 50%; background: var(--primary-light); color: var(--primary-color); display: flex; align-items: center; justify-content: center; font-size: 0.7rem; font-weight: 600;">${getInitials(paidByName)}</span>
              <span>${paidByName}</span>
            </div>
          </td>
          <td>${group ? group.name : '<span class="text-secondary">-</span>'}</td>
          <td>${budget ? `<span class="badge badge-info">${budget.category || 'General'}</span>` : '<span class="text-secondary">-</span>'}</td>
          <td>${formatDate(expense.date)}</td>
          <td>
            <div class="flex" style="gap: 0.5rem;">
              <button class="btn btn-sm btn-ghost edit-btn" data-id="${expense._id}" title="Editar">
                <i class="fas fa-edit"></i>
              </button>
              <button class="btn btn-sm btn-ghost delete-btn" data-id="${expense._id}" title="Eliminar">
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

  filterExpenses() {
    const searchTerm = this.shadowRoot.querySelector('#search-input').value.toLowerCase();
    const groupId = this.shadowRoot.querySelector('#filter-group').value;

    let filtered = this.allExpenses;

    if (groupId) {
      filtered = filtered.filter(exp => exp.groupId === groupId);
    }

    if (searchTerm) {
      filtered = filtered.filter(exp =>
        (exp.description && exp.description.toLowerCase().includes(searchTerm)) ||
        (exp.tags && exp.tags.some(t => t.toLowerCase().includes(searchTerm)))
      );
    }

    this.renderFilteredExpenses(filtered);
  }

  renderFilteredExpenses(expenses) {
    const original = this.allExpenses;
    this.allExpenses = expenses;
    this.renderExpenses();
    this.allExpenses = original;
  }

  openModal(mode, expenseId = null) {
    const modal = this.shadowRoot.querySelector('#expense-modal');
    const title = this.shadowRoot.querySelector('#modal-title');
    const form = this.shadowRoot.querySelector('#expense-form');

    form.reset();
    this.shadowRoot.querySelector('#expense-id').value = '';
    this.shadowRoot.querySelector('#expense-date').value = new Date().toISOString().split('T')[0];
    this.shadowRoot.querySelector('#expense-budget').innerHTML = '<option value="">Sin presupuesto</option>';

    if (mode === 'create') {
      title.textContent = 'Nuevo Gasto';
    } else {
      title.textContent = 'Editar Gasto';
      const expense = this.allExpenses.find(e => e._id === expenseId);
      if (expense) {
        this.shadowRoot.querySelector('#expense-id').value = expense._id;
        this.shadowRoot.querySelector('#expense-description').value = expense.description || '';
        this.shadowRoot.querySelector('#expense-amount').value = expense.amount || '';
        this.shadowRoot.querySelector('#expense-group').value = expense.groupId || '';
        this.loadBudgetsForGroup();
        this.shadowRoot.querySelector('#expense-budget').value = expense.budgetId || '';
        this.shadowRoot.querySelector('#expense-date').value = expense.date ? expense.date.split('T')[0] : '';
        this.shadowRoot.querySelector('#expense-tags').value = (expense.tags || []).join(', ');
      }
    }

    modal.classList.add('active');
  }

  closeModal() {
    this.shadowRoot.querySelector('#expense-modal').classList.remove('active');
  }

  async saveExpense() {
    const id = this.shadowRoot.querySelector('#expense-id').value;
    const description = this.shadowRoot.querySelector('#expense-description').value;
    const amount = parseFloat(this.shadowRoot.querySelector('#expense-amount').value);
    const groupId = this.shadowRoot.querySelector('#expense-group').value;
    const budgetId = this.shadowRoot.querySelector('#expense-budget').value;
    const date = this.shadowRoot.querySelector('#expense-date').value;
    const tags = this.shadowRoot.querySelector('#expense-tags').value
      .split(',')
      .map(t => t.trim())
      .filter(t => t);

    if (!description || !amount || !groupId) {
      showToast('Completa los campos obligatorios', 'error');
      return;
    }

    if (budgetId) {
      const budget = this.allBudgets.find(b => b._id === budgetId);
      if (budget) {
        const currentSpent = budget.spent || 0;
        const limit = budget.limit || 0;
        const newTotal = currentSpent + amount;

        if (newTotal > limit) {
          const exceed = newTotal - limit;
          const confirmed = confirm(`⚠️ Este gasto excede el presupuesto "${budget.category}" por ${this.formatCurrency(exceed)}.\n\n¿Deseas registrar el gasto de todos modos?`);
          if (!confirmed) return;
        }
      }
    }

    const user = getCurrentUser();
    const userId = user?.id || user?._id || 'unknown';

    const data = {
      description,
      amount,
      groupId,
      budgetId: budgetId || null,
      userId,
      date: date || new Date().toISOString(),
      tags
    };

    const btn = this.shadowRoot.querySelector('#save-btn');
    btn.disabled = true;

    try {
      let response;
      if (id) {
        response = await apiRequest(`/api/v1/expenses/${id}`, 'PATCH', data);
      } else {
        response = await apiRequest('/api/v1/expenses', 'POST', data);
      }

      if (response.success) {
        showToast(id ? 'Gasto actualizado' : 'Gasto registrado', 'success');
        this.closeModal();
        await this.loadBudgets();
        this.loadExpenses();
      } else {
        showToast(response.message || 'Error al guardar', 'error');
      }
    } catch (error) {
      showToast('Error al guardar gasto', 'error');
    } finally {
      btn.disabled = false;
    }
  }

  openDeleteModal(expenseId) {
    this.shadowRoot.querySelector('#delete-expense-id').value = expenseId;
    this.shadowRoot.querySelector('#delete-modal').classList.add('active');
  }

  closeDeleteModal() {
    this.shadowRoot.querySelector('#delete-modal').classList.remove('active');
  }

  async confirmDelete() {
    const id = this.shadowRoot.querySelector('#delete-expense-id').value;

    try {
      const response = await apiRequest(`/api/v1/expenses/${id}`, 'DELETE');
      if (response.success) {
        showToast('Gasto eliminado', 'success');
        this.closeDeleteModal();
        this.loadExpenses();
      } else {
        showToast('Error al eliminar', 'error');
      }
    } catch (error) {
      showToast('Error al eliminar gasto', 'error');
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
            <h1 class="page-title">Gastos</h1>
          </div>
          <div class="header-right">
            <button class="btn btn-primary" id="new-expense-btn">
              <i class="fas fa-plus"></i>
              Nuevo Gasto
            </button>
          </div>
        </header>

        <div class="main-container">
          <div class="stats-grid" style="margin-bottom: 2rem;">
            <div class="stat-card">
              <div class="stat-icon success">
                <i class="fas fa-dollar-sign"></i>
              </div>
              <div class="stat-content">
                <h3 id="total-amount">$0</h3>
                <p>Total de gastos</p>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon warning">
                <i class="fas fa-calendar"></i>
              </div>
              <div class="stat-content">
                <h3 id="month-amount">$0</h3>
                <p>Este mes</p>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon info">
                <i class="fas fa-receipt"></i>
              </div>
              <div class="stat-content">
                <h3 id="expense-count">0</h3>
                <p>Registros</p>
              </div>
            </div>
          </div>

          <div class="table-container">
            <div class="table-header">
              <h3 class="table-title">Todos los Gastos</h3>
              <div class="table-actions">
                <select class="form-select" id="filter-group" style="width: 180px;">
                  <option value="">Todos los grupos</option>
                </select>
                <input type="text" class="form-input" placeholder="Buscar..." id="search-input" style="width: 180px;">
              </div>
            </div>
            <div class="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>Descripción</th>
                    <th>Monto</th>
                    <th>Pagado por</th>
                    <th>Grupo</th>
                    <th>Presupuesto</th>
                    <th>Fecha</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody id="expenses-table">
                  <tr>
                    <td colspan="7" class="text-center">
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

      <!-- Modal Create/Edit Expense -->
      <div class="modal-overlay" id="expense-modal">
        <div class="modal">
          <div class="modal-header">
            <h3 class="modal-title" id="modal-title">Nuevo Gasto</h3>
            <button class="modal-close" id="modal-close-btn">&times;</button>
          </div>
          <div class="modal-body">
            <form id="expense-form">
              <input type="hidden" id="expense-id">
              
              <div class="form-group">
                <label for="expense-description" class="form-label">Descripción *</label>
                <input type="text" id="expense-description" class="form-input" placeholder="Ej: Cena en restaurante" required>
              </div>

              <div class="form-group">
                <label for="expense-amount" class="form-label">Monto *</label>
                <input type="number" id="expense-amount" class="form-input" placeholder="0.00" step="0.01" min="0" required>
              </div>

              <div class="form-group">
                <label for="expense-group" class="form-label">Grupo *</label>
                <select id="expense-group" class="form-select" required>
                  <option value="">Seleccionar grupo</option>
                </select>
              </div>

              <div class="form-group">
                <label for="expense-budget" class="form-label">Presupuesto</label>
                <select id="expense-budget" class="form-select">
                  <option value="">Sin presupuesto</option>
                </select>
                <p class="form-help">Asocia este gasto a un presupuesto del grupo</p>
              </div>

              <div class="form-group">
                <label for="expense-date" class="form-label">Fecha</label>
                <input type="date" id="expense-date" class="form-input">
              </div>

              <div class="form-group">
                <label for="expense-tags" class="form-label">Etiquetas</label>
                <input type="text" id="expense-tags" class="form-input" placeholder="Separadas por coma: comida, urgente">
                <p class="form-help">Separa las etiquetas con comas</p>
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
            <p>¿Estás seguro de que deseas eliminar este gasto? Esta acción no se puede deshacer.</p>
            <input type="hidden" id="delete-expense-id">
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
    this.shadowRoot.querySelector('#new-expense-btn').addEventListener('click', () => this.openModal('create'));
    this.shadowRoot.querySelector('#search-input').addEventListener('keyup', () => this.filterExpenses());
    this.shadowRoot.querySelector('#filter-group').addEventListener('change', () => this.filterExpenses());
    this.shadowRoot.querySelector('#expense-group').addEventListener('change', () => this.loadBudgetsForGroup());
    this.shadowRoot.querySelector('#modal-close-btn').addEventListener('click', () => this.closeModal());
    this.shadowRoot.querySelector('#cancel-btn').addEventListener('click', () => this.closeModal());
    this.shadowRoot.querySelector('#save-btn').addEventListener('click', () => this.saveExpense());
    this.shadowRoot.querySelector('#delete-close-btn').addEventListener('click', () => this.closeDeleteModal());
    this.shadowRoot.querySelector('#delete-cancel-btn').addEventListener('click', () => this.closeDeleteModal());
    this.shadowRoot.querySelector('#confirm-delete-btn').addEventListener('click', () => this.confirmDelete());
  }
}

customElements.define('expenses-manager', ExpensesManager);

export { ExpensesManager };
