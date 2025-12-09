/**
 * Payments Manager Web Component
 * Custom element for managing payments CRUD operations with Shadow DOM
 */
import { apiRequest, showToast, getInitials } from '../js/api.js';
import { checkAuth, getCurrentUser } from '../js/auth.js';

class PaymentsManager extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.allPayments = [];
    this.allGroups = [];
    this.allUsers = [];
    this.allExpenses = [];
    this.currentUserId = null;
  }

  connectedCallback() {
    checkAuth();
    this.render();
    this.loadData();
  }

  async loadData() {
    const user = getCurrentUser();
    this.currentUserId = user?._id || user?.id;

    await Promise.all([this.loadGroups(), this.loadUsers(), this.loadExpenses()]);
    await this.loadPayments();
    this.populateBalanceGroupFilter();
  }

  async loadExpenses() {
    try {
      const response = await apiRequest('/api/v1/expenses');
      if (response.success) {
        this.allExpenses = response.data;
      }
    } catch (error) {
      console.error('Error loading expenses:', error);
    }
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

  populateGroupSelect() {
    const select = this.shadowRoot.querySelector('#payment-group');
    const options = this.allGroups.map(g => `<option value="${g._id}">${g.name}</option>`).join('');
    select.innerHTML = `<option value="">Seleccionar grupo</option>` + options;
  }

  populateBalanceGroupFilter() {
    const select = this.shadowRoot.querySelector('#balance-group-filter');
    const options = this.allGroups.map(g => `<option value="${g._id}">${g.name}</option>`).join('');
    select.innerHTML = `<option value="">Seleccionar grupo</option>` + options;
  }

  loadGroupMembers() {
    const groupId = this.shadowRoot.querySelector('#payment-group').value;
    const toSelect = this.shadowRoot.querySelector('#payment-to');
    const currentUser = getCurrentUser();
    const currentUserId = currentUser?.id || currentUser?._id;

    if (!groupId) {
      toSelect.innerHTML = '<option value="">Primero selecciona un grupo</option>';
      return;
    }

    const group = this.allGroups.find(g => g._id === groupId);
    const participants = group?.participants || [];

    if (participants.length > 0) {
      const otherParticipants = participants.filter(p => {
        const odId = p.userId?.toString() || p.userId;
        return odId !== currentUserId && p.userId !== currentUserId;
      });

      if (otherParticipants.length === 0) {
        toSelect.innerHTML = '<option value="">No hay otros participantes en el grupo</option>';
        return;
      }

      const memberOptions = otherParticipants.map(p => {
        const odId = p.userId?.toString() || p.userId;
        const user = this.allUsers.find(u => u._id === odId || u._id?.toString() === odId);
        return user ? `<option value="${user._id}">${user.name || user.email}</option>` : '';
      }).filter(opt => opt !== '').join('');

      toSelect.innerHTML = '<option value="">Seleccionar receptor</option>' + memberOptions;
    } else {
      toSelect.innerHTML = '<option value="">Este grupo no tiene participantes</option>';
    }
  }

  loadBalances() {
    const groupId = this.shadowRoot.querySelector('#balance-group-filter').value;
    const container = this.shadowRoot.querySelector('#balances-container');

    if (!groupId) {
      container.innerHTML = '<p style="color: var(--text-secondary); text-align: center;">Selecciona un grupo para ver los balances</p>';
      return;
    }

    const groupExpenses = this.allExpenses.filter(e => e.groupId === groupId);
    const groupPayments = this.allPayments.filter(p => p.groupId === groupId);
    const group = this.allGroups.find(g => g._id === groupId);
    const participants = group?.participants || [];

    const balances = {};
    participants.forEach(p => { balances[p.userId] = 0; });

    groupExpenses.forEach(expense => {
      const payerId = expense.userId;
      const amount = expense.amount || 0;
      const participantCount = participants.length || 1;
      const sharePerPerson = amount / participantCount;

      if (balances[payerId] !== undefined) {
        balances[payerId] += amount - sharePerPerson;
      } else {
        balances[payerId] = amount - sharePerPerson;
      }

      participants.forEach(p => {
        if (p.userId !== payerId) {
          balances[p.userId] = (balances[p.userId] || 0) - sharePerPerson;
        }
      });
    });

    groupPayments.filter(p => p.status === 'completed').forEach(payment => {
      const amount = payment.amount || 0;
      if (balances[payment.fromUserId] !== undefined) {
        balances[payment.fromUserId] += amount;
      }
      if (balances[payment.toUserId] !== undefined) {
        balances[payment.toUserId] -= amount;
      }
    });

    if (Object.keys(balances).length === 0) {
      container.innerHTML = '<p style="color: var(--text-secondary); text-align: center;">No hay participantes en este grupo</p>';
      return;
    }

    const balanceCards = Object.entries(balances).map(([userId, balance]) => {
      const user = this.allUsers.find(u => u._id === userId);
      const userName = user?.name || 'Usuario';
      const isPositive = balance >= 0;
      const balanceClass = isPositive ? 'success' : 'danger';
      const balanceIcon = isPositive ? 'fa-arrow-up' : 'fa-arrow-down';
      const balanceText = isPositive ? 'A favor' : 'Debe';

      return `
        <div class="balance-card" style="background: var(--bg-secondary); padding: 1rem; border-radius: var(--border-radius); display: flex; align-items: center; justify-content: space-between;">
          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <div class="avatar-sm">${(userName).charAt(0)}</div>
            <div>
              <div style="font-weight: 600;">${userName}</div>
              <small style="color: var(--text-secondary);">${balanceText}</small>
            </div>
          </div>
          <div style="text-align: right;">
            <div style="font-weight: 700; color: var(--${balanceClass}-color); font-size: 1.1rem;">
              <i class="fas ${balanceIcon}" style="font-size: 0.8rem;"></i>
              ${this.formatCurrency(Math.abs(balance))}
            </div>
          </div>
        </div>
      `;
    }).join('');

    container.innerHTML = `<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 1rem;">${balanceCards}</div>`;
  }

  async loadPayments() {
    try {
      const response = await apiRequest('/api/v1/payments');
      if (response.success) {
        this.allPayments = response.data;
        this.renderPayments();
        this.updateStats();
      }
    } catch (error) {
      showToast('Error al cargar pagos', 'error');
    }
  }

  updateStats() {
    const completed = this.allPayments.filter(p => p.status === 'completed');
    const pending = this.allPayments.filter(p => p.status === 'pending');
    const totalPaid = completed.reduce((sum, p) => sum + (p.amount || 0), 0);

    this.shadowRoot.querySelector('#completed-payments').textContent = completed.length;
    this.shadowRoot.querySelector('#pending-payments').textContent = pending.length;
    this.shadowRoot.querySelector('#total-paid').textContent = this.formatCurrency(totalPaid);
  }

  renderPayments() {
    const tbody = this.shadowRoot.querySelector('#payments-table');

    if (this.allPayments.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7">
            <div class="empty-state">
              <i class="fas fa-money-bill-wave"></i>
              <h3>No hay pagos registrados</h3>
              <p>Registra el primer pago entre miembros del grupo</p>
              <button class="btn btn-primary mt-2" id="empty-create-btn">
                <i class="fas fa-plus"></i> Registrar Pago
              </button>
            </div>
          </td>
        </tr>
      `;
      const emptyBtn = this.shadowRoot.querySelector('#empty-create-btn');
      if (emptyBtn) emptyBtn.addEventListener('click', () => this.openModal('create'));
      return;
    }

    tbody.innerHTML = this.allPayments.map(payment => {
      const fromUser = this.allUsers.find(u => u._id === payment.fromUserId);
      const toUser = this.allUsers.find(u => u._id === payment.toUserId);
      const group = this.allGroups.find(g => g._id === payment.groupId);

      const statusClass = {
        'completed': 'success',
        'pending': 'warning',
        'cancelled': 'danger'
      }[payment.status] || 'info';

      const statusText = {
        'completed': 'Completado',
        'pending': 'Pendiente',
        'cancelled': 'Cancelado'
      }[payment.status] || payment.status;

      return `
        <tr>
          <td>
            <div class="flex items-center" style="gap: 0.5rem;">
              <div class="avatar-sm">${(fromUser?.name || 'U').charAt(0)}</div>
              <span>${fromUser?.name || fromUser?.email || '-'}</span>
            </div>
          </td>
          <td>
            <div class="flex items-center" style="gap: 0.5rem;">
              <div class="avatar-sm">${(toUser?.name || 'U').charAt(0)}</div>
              <span>${toUser?.name || toUser?.email || '-'}</span>
            </div>
          </td>
          <td>${group?.name || '-'}</td>
          <td><strong>${this.formatCurrency(payment.amount)}</strong></td>
          <td><span class="badge badge-${statusClass}">${statusText}</span></td>
          <td>${payment.date ? new Date(payment.date).toLocaleDateString('es-MX') : '-'}</td>
          <td>
            <div class="flex" style="gap: 0.5rem;">
              ${payment.status === 'pending' ? `
                <button class="btn btn-sm btn-success complete-btn" data-id="${payment._id}" title="Marcar como completado">
                  <i class="fas fa-check"></i>
                </button>
              ` : ''}
              <button class="btn btn-sm btn-ghost edit-btn" data-id="${payment._id}" title="Editar">
                <i class="fas fa-edit"></i>
              </button>
              <button class="btn btn-sm btn-ghost delete-btn" data-id="${payment._id}" title="Eliminar">
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
    this.shadowRoot.querySelectorAll('.complete-btn').forEach(btn => {
      btn.addEventListener('click', () => this.markAsCompleted(btn.dataset.id));
    });
  }

  filterPayments() {
    const searchTerm = this.shadowRoot.querySelector('#search-input').value.toLowerCase();
    const statusFilter = this.shadowRoot.querySelector('#status-filter').value;

    let filtered = this.allPayments;

    if (statusFilter) {
      filtered = filtered.filter(p => p.status === statusFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(payment => {
        const fromUser = this.allUsers.find(u => u._id === payment.fromUserId);
        const toUser = this.allUsers.find(u => u._id === payment.toUserId);
        const group = this.allGroups.find(g => g._id === payment.groupId);

        return (fromUser?.name?.toLowerCase().includes(searchTerm)) ||
          (toUser?.name?.toLowerCase().includes(searchTerm)) ||
          (group?.name?.toLowerCase().includes(searchTerm));
      });
    }

    const original = this.allPayments;
    this.allPayments = filtered;
    this.renderPayments();
    this.allPayments = original;
  }

  async markAsCompleted(paymentId) {
    try {
      const response = await apiRequest(`/api/v1/payments/${paymentId}`, 'PATCH', { status: 'completed' });
      if (response.success) {
        showToast('Pago marcado como completado', 'success');
        this.loadPayments();
        this.loadBalances();
      }
    } catch (error) {
      showToast('Error al actualizar pago', 'error');
    }
  }

  openModal(mode, paymentId = null) {
    const modal = this.shadowRoot.querySelector('#payment-modal');
    const title = this.shadowRoot.querySelector('#modal-title');
    const form = this.shadowRoot.querySelector('#payment-form');

    form.reset();
    this.shadowRoot.querySelector('#payment-id').value = '';
    this.shadowRoot.querySelector('#payment-date').value = new Date().toISOString().split('T')[0];

    const currentUser = getCurrentUser();
    this.shadowRoot.querySelector('#payer-avatar').textContent = (currentUser?.name || 'U').charAt(0);
    this.shadowRoot.querySelector('#payer-name').textContent = currentUser?.name || currentUser?.email || 'Usuario';
    this.shadowRoot.querySelector('#payment-from').value = currentUser?._id || currentUser?.id || '';

    if (mode === 'create') {
      title.textContent = 'Registrar Pago';
    } else {
      title.textContent = 'Editar Pago';
      const payment = this.allPayments.find(p => p._id === paymentId);
      if (payment) {
        this.shadowRoot.querySelector('#payment-id').value = payment._id;
        this.shadowRoot.querySelector('#payment-group').value = payment.groupId || '';
        this.loadGroupMembers();
        setTimeout(() => {
          this.shadowRoot.querySelector('#payment-to').value = payment.toUserId || '';
        }, 100);
        this.shadowRoot.querySelector('#payment-amount').value = payment.amount || '';
        this.shadowRoot.querySelector('#payment-status').value = payment.status || 'pending';
        this.shadowRoot.querySelector('#payment-date').value = payment.date ? payment.date.split('T')[0] : '';
        this.shadowRoot.querySelector('#payment-notes').value = payment.notes || '';

        const fromUser = this.allUsers.find(u => u._id === payment.fromUserId);
        if (fromUser) {
          this.shadowRoot.querySelector('#payer-avatar').textContent = (fromUser.name || 'U').charAt(0);
          this.shadowRoot.querySelector('#payer-name').textContent = fromUser.name || fromUser.email || 'Usuario';
          this.shadowRoot.querySelector('#payment-from').value = payment.fromUserId;
        }
      }
    }

    modal.classList.add('active');
  }

  closeModal() {
    this.shadowRoot.querySelector('#payment-modal').classList.remove('active');
  }

  async savePayment() {
    const id = this.shadowRoot.querySelector('#payment-id').value;
    const groupId = this.shadowRoot.querySelector('#payment-group').value;
    const fromUserId = this.shadowRoot.querySelector('#payment-from').value;
    const toUserId = this.shadowRoot.querySelector('#payment-to').value;
    const amount = parseFloat(this.shadowRoot.querySelector('#payment-amount').value);
    const status = this.shadowRoot.querySelector('#payment-status').value;
    const date = this.shadowRoot.querySelector('#payment-date').value;
    const notes = this.shadowRoot.querySelector('#payment-notes').value;

    if (!groupId || !fromUserId || !toUserId || !amount) {
      showToast('Completa los campos obligatorios', 'error');
      return;
    }

    if (fromUserId === toUserId) {
      showToast('El pagador y receptor deben ser diferentes', 'error');
      return;
    }

    const data = {
      groupId,
      fromUserId,
      toUserId,
      amount,
      status,
      date: date || null,
      notes
    };

    const btn = this.shadowRoot.querySelector('#save-btn');
    btn.disabled = true;

    try {
      let response;
      if (id) {
        response = await apiRequest(`/api/v1/payments/${id}`, 'PATCH', data);
      } else {
        response = await apiRequest('/api/v1/payments', 'POST', data);
      }

      if (response.success) {
        showToast(id ? 'Pago actualizado' : 'Pago registrado', 'success');
        this.closeModal();
        this.loadPayments();
        this.loadBalances();
      } else {
        showToast(response.message || 'Error al guardar', 'error');
      }
    } catch (error) {
      showToast('Error al guardar pago', 'error');
    } finally {
      btn.disabled = false;
    }
  }

  openDeleteModal(paymentId) {
    this.shadowRoot.querySelector('#delete-payment-id').value = paymentId;
    this.shadowRoot.querySelector('#delete-modal').classList.add('active');
  }

  closeDeleteModal() {
    this.shadowRoot.querySelector('#delete-modal').classList.remove('active');
  }

  async confirmDelete() {
    const id = this.shadowRoot.querySelector('#delete-payment-id').value;

    try {
      const response = await apiRequest(`/api/v1/payments/${id}`, 'DELETE');
      if (response.success) {
        showToast('Pago eliminado', 'success');
        this.closeDeleteModal();
        this.loadPayments();
        this.loadBalances();
      } else {
        showToast('Error al eliminar', 'error');
      }
    } catch (error) {
      showToast('Error al eliminar pago', 'error');
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
            <h1 class="page-title">Pagos</h1>
          </div>
          <div class="header-right">
            <button class="btn btn-primary" id="new-payment-btn">
              <i class="fas fa-plus"></i>
              Registrar Pago
            </button>
          </div>
        </header>

        <div class="main-container">
          <div class="cards-grid">
            <div class="card stat-card">
              <div class="stat-icon success">
                <i class="fas fa-check-circle"></i>
              </div>
              <div class="stat-info">
                <p class="stat-label">Pagos Completados</p>
                <h3 class="stat-value" id="completed-payments">0</h3>
              </div>
            </div>
            <div class="card stat-card">
              <div class="stat-icon warning">
                <i class="fas fa-clock"></i>
              </div>
              <div class="stat-info">
                <p class="stat-label">Pagos Pendientes</p>
                <h3 class="stat-value" id="pending-payments">0</h3>
              </div>
            </div>
            <div class="card stat-card">
              <div class="stat-icon primary">
                <i class="fas fa-coins"></i>
              </div>
              <div class="stat-info">
                <p class="stat-label">Total Pagado</p>
                <h3 class="stat-value" id="total-paid">$0</h3>
              </div>
            </div>
          </div>

          <div class="table-container" style="margin-bottom: 2rem;">
            <div class="table-header">
              <h3 class="table-title">
                <i class="fas fa-balance-scale" style="margin-right: 0.5rem;"></i>
                Balances por Usuario
              </h3>
              <div class="table-actions">
                <select class="form-select" id="balance-group-filter" style="width: 200px;">
                  <option value="">Seleccionar grupo</option>
                </select>
              </div>
            </div>
            <div id="balances-container" style="padding: 1rem;">
              <p style="color: var(--text-secondary); text-align: center;">Selecciona un grupo para ver los balances</p>
            </div>
          </div>

          <div class="table-container">
            <div class="table-header">
              <h3 class="table-title">Historial de Pagos</h3>
              <div class="table-actions">
                <select class="form-select" id="status-filter" style="width: 150px;">
                  <option value="">Todos</option>
                  <option value="completed">Completados</option>
                  <option value="pending">Pendientes</option>
                  <option value="cancelled">Cancelados</option>
                </select>
                <input type="text" class="form-input" placeholder="Buscar..." id="search-input" style="width: 200px;">
              </div>
            </div>
            <div class="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>Pagador</th>
                    <th>Receptor</th>
                    <th>Grupo</th>
                    <th>Monto</th>
                    <th>Estado</th>
                    <th>Fecha</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody id="payments-table">
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

      <!-- Modal Create/Edit Payment -->
      <div class="modal-overlay" id="payment-modal">
        <div class="modal">
          <div class="modal-header">
            <h3 class="modal-title" id="modal-title">Registrar Pago</h3>
            <button class="modal-close" id="modal-close-btn">&times;</button>
          </div>
          <div class="modal-body">
            <form id="payment-form">
              <input type="hidden" id="payment-id">

              <div class="form-group">
                <label for="payment-group" class="form-label">Grupo *</label>
                <select id="payment-group" class="form-select" required>
                  <option value="">Seleccionar grupo</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">Pagador (Tú)</label>
                <div class="current-user-display" style="padding: 0.75rem; background: var(--bg-secondary); border-radius: var(--border-radius); display: flex; align-items: center; gap: 0.5rem;">
                  <div class="avatar-sm" id="payer-avatar">U</div>
                  <span id="payer-name">Usuario</span>
                </div>
                <input type="hidden" id="payment-from">
              </div>

              <div class="form-group">
                <label for="payment-to" class="form-label">Receptor *</label>
                <select id="payment-to" class="form-select" required>
                  <option value="">Seleccionar receptor</option>
                </select>
              </div>

              <div class="form-group">
                <label for="payment-amount" class="form-label">Monto *</label>
                <input type="number" id="payment-amount" class="form-input" placeholder="0.00" step="0.01" min="0" required>
              </div>

              <div class="form-group">
                <label for="payment-status" class="form-label">Estado</label>
                <select id="payment-status" class="form-select">
                  <option value="pending">Pendiente</option>
                  <option value="completed">Completado</option>
                  <option value="cancelled">Cancelado</option>
                </select>
              </div>

              <div class="form-group">
                <label for="payment-date" class="form-label">Fecha del pago</label>
                <input type="date" id="payment-date" class="form-input">
              </div>

              <div class="form-group">
                <label for="payment-notes" class="form-label">Notas</label>
                <textarea id="payment-notes" class="form-textarea" rows="3" placeholder="Notas adicionales..."></textarea>
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
            <p>¿Estás seguro de que deseas eliminar este pago?</p>
            <input type="hidden" id="delete-payment-id">
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

      <style>
        .avatar-sm {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: var(--primary-gradient);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 0.8rem;
        }
        .btn-success {
          background: var(--success-color);
          color: white;
        }
        .btn-success:hover {
          background: #059669;
        }
      </style>
    `;

    // Attach event listeners
    this.shadowRoot.querySelector('#menu-toggle-btn').addEventListener('click', () => window.toggleSidebar());
    this.shadowRoot.querySelector('#new-payment-btn').addEventListener('click', () => this.openModal('create'));
    this.shadowRoot.querySelector('#search-input').addEventListener('keyup', () => this.filterPayments());
    this.shadowRoot.querySelector('#status-filter').addEventListener('change', () => this.filterPayments());
    this.shadowRoot.querySelector('#balance-group-filter').addEventListener('change', () => this.loadBalances());
    this.shadowRoot.querySelector('#payment-group').addEventListener('change', () => this.loadGroupMembers());
    this.shadowRoot.querySelector('#modal-close-btn').addEventListener('click', () => this.closeModal());
    this.shadowRoot.querySelector('#cancel-btn').addEventListener('click', () => this.closeModal());
    this.shadowRoot.querySelector('#save-btn').addEventListener('click', () => this.savePayment());
    this.shadowRoot.querySelector('#delete-close-btn').addEventListener('click', () => this.closeDeleteModal());
    this.shadowRoot.querySelector('#delete-cancel-btn').addEventListener('click', () => this.closeDeleteModal());
    this.shadowRoot.querySelector('#confirm-delete-btn').addEventListener('click', () => this.confirmDelete());
  }
}

customElements.define('payments-manager', PaymentsManager);

export { PaymentsManager };
