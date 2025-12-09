/**
 * Groups Manager Web Component
 * Custom element for managing groups CRUD operations with Shadow DOM
 */
import { apiRequest, showToast, formatDate, getInitials } from '../js/api.js';
import { checkAuth, getCurrentUser } from '../js/auth.js';

class GroupsManager extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.allGroups = [];
    this.allUsers = [];
    this.currentGroupId = null;
    this.tempParticipants = [];
  }

  connectedCallback() {
    checkAuth();
    this.render();
    this.loadData();
  }

  async loadData() {
    await this.loadUsers();
    await this.loadGroups();
  }

  async loadUsers() {
    try {
      const response = await apiRequest('/api/v1/users');
      if (response.success) {
        this.allUsers = response.data;
      }
    } catch (error) {
      showToast('Error al cargar usuarios', 'error');
    }
  }

  async loadGroups() {
    try {
      const response = await apiRequest('/api/v1/groups');
      if (response.success) {
        const currentUser = getCurrentUser();
        const currentUserId = currentUser?.id || currentUser?._id;

        this.allGroups = response.data.filter(group => {
          return (group.participants || []).some(p =>
            p.userId === currentUserId ||
            p.userId?.toString() === currentUserId ||
            p.userId === currentUserId?.toString()
          );
        });

        this.renderGroups();
      }
    } catch (error) {
      showToast('Error al cargar grupos', 'error');
    }
  }

  getUserById(userId) {
    return this.allUsers.find(u => u._id === userId || u._id === userId?.toString());
  }

  renderGroups() {
    const tbody = this.shadowRoot.querySelector('#groups-table');

    if (this.allGroups.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5">
            <div class="empty-state">
              <i class="fas fa-users"></i>
              <h3>No hay grupos</h3>
              <p>Crea el primer grupo para comenzar</p>
              <button class="btn btn-primary mt-2" id="empty-create-btn">
                <i class="fas fa-users-plus"></i> Nuevo Grupo
              </button>
            </div>
          </td>
        </tr>
      `;
      const emptyBtn = this.shadowRoot.querySelector('#empty-create-btn');
      if (emptyBtn) {
        emptyBtn.addEventListener('click', () => this.openModal('create'));
      }
      return;
    }

    tbody.innerHTML = this.allGroups.map(group => `
      <tr>
        <td><strong>${group.name}</strong></td>
        <td>${group.description || '-'}</td>
        <td>
          <div class="member-badges">
            ${(group.participants || []).slice(0, 3).map(p => {
      const user = this.getUserById(p.userId);
      return `<span class="member-badge" title="${user?.name || 'Usuario'}">${getInitials(user?.name || 'U')}</span>`;
    }).join('')}
            ${group.participants && group.participants.length > 3 ? `<span class="member-badge">+${group.participants.length - 3}</span>` : ''}
          </div>
        </td>
        <td>${formatDate(group.createdAt)}</td>
        <td>
          <div class="flex" style="gap: 0.5rem;">
            <button class="btn btn-sm btn-ghost balances-btn" data-id="${group._id}" title="Ver balances">
              <i class="fas fa-calculator"></i>
            </button>
            <button class="btn btn-sm btn-ghost edit-btn" data-id="${group._id}" title="Editar">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn btn-sm btn-ghost delete-btn" data-id="${group._id}" title="Eliminar">
              <i class="fas fa-trash" style="color: var(--danger-color);"></i>
            </button>
          </div>
        </td>
      </tr>
    `).join('');

    // Attach event listeners
    this.shadowRoot.querySelectorAll('.edit-btn').forEach(btn => {
      btn.addEventListener('click', () => this.openModal('edit', btn.dataset.id));
    });
    this.shadowRoot.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', () => this.openDeleteModal(btn.dataset.id));
    });
    this.shadowRoot.querySelectorAll('.balances-btn').forEach(btn => {
      btn.addEventListener('click', () => this.openBalancesModal(btn.dataset.id));
    });
  }

  filterGroups() {
    const searchTerm = this.shadowRoot.querySelector('#search-input').value.toLowerCase();
    const filtered = this.allGroups.filter(group =>
      group.name.toLowerCase().includes(searchTerm) ||
      (group.description && group.description.toLowerCase().includes(searchTerm))
    );
    this.renderFilteredGroups(filtered);
  }

  renderFilteredGroups(groups) {
    const tbody = this.shadowRoot.querySelector('#groups-table');
    if (groups.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" class="text-center">No se encontraron grupos</td></tr>`;
      return;
    }
    // Re-render with filtered groups
    const originalGroups = this.allGroups;
    this.allGroups = groups;
    this.renderGroups();
    this.allGroups = originalGroups;
  }

  populateUserSelect(selectId, excludeUserIds = []) {
    const select = this.shadowRoot.querySelector(`#${selectId}`);
    if (!select) return;
    const availableUsers = this.allUsers.filter(u => !excludeUserIds.includes(u._id));

    select.innerHTML = '<option value="">Seleccionar usuario...</option>' +
      availableUsers.map(u => `<option value="${u._id}">${u.name} (${u.email})</option>`).join('');
  }

  openModal(mode, groupId = null) {
    const modal = this.shadowRoot.querySelector('#group-modal');
    const title = this.shadowRoot.querySelector('#modal-title');
    const form = this.shadowRoot.querySelector('#group-form');

    form.reset();
    this.shadowRoot.querySelector('#group-id').value = '';
    this.currentGroupId = groupId;
    this.tempParticipants = [];

    if (mode === 'create') {
      title.textContent = 'Nuevo Grupo';
      const currentUser = getCurrentUser();
      if (currentUser && (currentUser.id || currentUser._id)) {
        this.tempParticipants.push({ userId: currentUser.id || currentUser._id, role: 'admin' });
      }
      this.renderTempParticipantsList();
      const participantIds = this.tempParticipants.map(p => p.userId?.toString());
      this.populateUserSelect('add-participant-select', participantIds);
    } else {
      title.textContent = 'Editar Grupo';

      const group = this.allGroups.find(g => g._id === groupId);
      if (group) {
        this.shadowRoot.querySelector('#group-id').value = group._id;
        this.shadowRoot.querySelector('#group-name-input').value = group.name;
        this.shadowRoot.querySelector('#group-description-input').value = group.description || '';
        this.tempParticipants = (group.participants || []).map(p => ({ userId: p.userId, role: p.role || 'member' }));
        this.renderTempParticipantsList();
        const participantIds = this.tempParticipants.map(p => p.userId?.toString());
        this.populateUserSelect('add-participant-select', participantIds);
      }
    }

    modal.classList.add('active');
  }

  renderTempParticipantsList() {
    const list = this.shadowRoot.querySelector('#participants-list');

    if (this.tempParticipants.length === 0) {
      list.innerHTML = '<p style="color: var(--text-secondary); font-size: 0.9rem;">Aún no hay participantes</p>';
      return;
    }

    list.innerHTML = this.tempParticipants.map(p => {
      const user = this.getUserById(p.userId);
      return `
        <div class="participant-item">
          <div class="participant-info">
            <div class="participant-avatar">${getInitials(user?.name || 'U')}</div>
            <div>
              <div><strong>${user?.name || 'Usuario'}</strong></div>
              <div class="participant-role">${p.role || 'member'}</div>
            </div>
          </div>
          <button type="button" class="btn btn-sm btn-ghost remove-participant-btn" data-userid="${p.userId}">
            <i class="fas fa-times" style="color: var(--danger-color);"></i>
          </button>
        </div>
      `;
    }).join('');

    // Attach remove listeners
    this.shadowRoot.querySelectorAll('.remove-participant-btn').forEach(btn => {
      btn.addEventListener('click', () => this.removeTempParticipant(btn.dataset.userid));
    });
  }

  addTempParticipant() {
    const select = this.shadowRoot.querySelector('#add-participant-select');
    const userId = select.value;
    if (!userId) return;

    if (this.tempParticipants.some(p => p.userId === userId || p.userId?.toString() === userId)) {
      showToast('El usuario ya está en el grupo', 'warning');
      return;
    }

    this.tempParticipants.push({ userId, role: 'member' });
    this.renderTempParticipantsList();

    const participantIds = this.tempParticipants.map(p => p.userId?.toString());
    this.populateUserSelect('add-participant-select', participantIds);
  }

  removeTempParticipant(userId) {
    this.tempParticipants = this.tempParticipants.filter(p => p.userId !== userId && p.userId?.toString() !== userId);
    this.renderTempParticipantsList();

    const participantIds = this.tempParticipants.map(p => p.userId?.toString());
    this.populateUserSelect('add-participant-select', participantIds);
  }

  closeModal() {
    this.shadowRoot.querySelector('#group-modal').classList.remove('active');
    this.tempParticipants = [];
  }

  async saveGroup() {
    const id = this.shadowRoot.querySelector('#group-id').value;
    const name = this.shadowRoot.querySelector('#group-name-input').value;
    const description = this.shadowRoot.querySelector('#group-description-input').value;

    if (!name) {
      showToast('El nombre es obligatorio', 'error');
      return;
    }

    const data = { name, description, participants: this.tempParticipants };
    const btn = this.shadowRoot.querySelector('#save-btn');
    btn.disabled = true;

    try {
      let response;
      if (id) {
        response = await apiRequest(`/api/v1/groups/${id}`, 'PATCH', data);
      } else {
        response = await apiRequest('/api/v1/groups', 'POST', data);
      }

      if (response.success) {
        showToast(id ? 'Grupo actualizado' : 'Grupo creado', 'success');
        this.closeModal();
        this.loadGroups();
      }
    } catch (error) {
      showToast('Error al guardar grupo', 'error');
    } finally {
      btn.disabled = false;
    }
  }

  openDeleteModal(groupId) {
    this.shadowRoot.querySelector('#delete-group-id').value = groupId;
    this.shadowRoot.querySelector('#delete-modal').classList.add('active');
  }

  closeDeleteModal() {
    this.shadowRoot.querySelector('#delete-modal').classList.remove('active');
  }

  async confirmDelete() {
    const id = this.shadowRoot.querySelector('#delete-group-id').value;

    try {
      const response = await apiRequest(`/api/v1/groups/${id}`, 'DELETE');
      if (response.success || response.status === 204) {
        showToast('Grupo eliminado', 'success');
        this.closeDeleteModal();
        this.loadGroups();
      }
    } catch (error) {
      showToast('Error al eliminar grupo', 'error');
    }
  }

  async openBalancesModal(groupId) {
    const modal = this.shadowRoot.querySelector('#balances-modal');
    const body = this.shadowRoot.querySelector('#balances-modal-body');

    body.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    modal.classList.add('active');

    try {
      // Fetch expenses and payments for this group
      const [expensesRes, paymentsRes] = await Promise.all([
        apiRequest('/api/v1/expenses'),
        apiRequest('/api/v1/payments')
      ]);

      const group = this.allGroups.find(g => g._id === groupId);
      const participants = group?.participants || [];
      const groupExpenses = (expensesRes.data || []).filter(e => e.groupId === groupId);
      const groupPayments = (paymentsRes.data || []).filter(p => p.groupId === groupId);

      // Calculate balances
      const balances = {};
      participants.forEach(p => { balances[p.userId] = 0; });

      groupExpenses.forEach(expense => {
        const payerId = expense.userId;
        const amount = expense.amount || 0;
        const participantCount = participants.length || 1;
        const sharePerPerson = amount / participantCount;

        if (balances[payerId] !== undefined) {
          balances[payerId] += amount - sharePerPerson;
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

      // Render balances
      const totalExpenses = groupExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);

      body.innerHTML = `
        <div class="balances-summary">
          <div class="balance-card">
            <div class="balance-card-value">${this.formatCurrency(totalExpenses)}</div>
            <div class="balance-card-label">Total gastado</div>
          </div>
          <div class="balance-card">
            <div class="balance-card-value">${participants.length}</div>
            <div class="balance-card-label">Participantes</div>
          </div>
        </div>
        <h4 style="margin-bottom: 1rem;">Balances individuales</h4>
        <div class="balance-list">
          ${Object.entries(balances).map(([userId, balance]) => {
        const user = this.getUserById(userId);
        const isPositive = balance >= 0;
        return `
              <div class="balance-item">
                <div class="balance-user">
                  <div class="balance-avatar">${getInitials(user?.name || 'U')}</div>
                  <span>${user?.name || 'Usuario'}</span>
                </div>
                <div class="balance-amount ${isPositive ? 'balance-positive' : 'balance-negative'}">
                  ${isPositive ? '+' : ''}${this.formatCurrency(balance)}
                </div>
              </div>
            `;
      }).join('')}
        </div>
      `;
    } catch (error) {
      body.innerHTML = '<p class="text-center">Error al cargar balances</p>';
    }
  }

  closeBalancesModal() {
    this.shadowRoot.querySelector('#balances-modal').classList.remove('active');
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
            <h1 class="page-title">Grupos</h1>
          </div>
          <div class="header-right">
            <button class="btn btn-primary" id="new-group-btn">
              <i class="fas fa-users-plus"></i>
              Nuevo Grupo
            </button>
          </div>
        </header>

        <div class="main-container">
          <div class="table-container">
            <div class="table-header">
              <h3 class="table-title">Todos los Grupos</h3>
              <div class="table-actions">
                <input type="text" class="form-input" placeholder="Buscar..." id="search-input" style="width: 200px;">
              </div>
            </div>
            <div class="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>Grupo</th>
                    <th>Descripción</th>
                    <th>Participantes</th>
                    <th>Creado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody id="groups-table">
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

      <!-- Modal Create/Edit Group -->
      <div class="modal-overlay" id="group-modal">
        <div class="modal" style="max-width: 600px;">
          <div class="modal-header">
            <h3 class="modal-title" id="modal-title">Nuevo Grupo</h3>
            <button class="modal-close" id="modal-close-btn">&times;</button>
          </div>
          <div class="modal-body">
            <form id="group-form">
              <input type="hidden" id="group-id">
              
              <div class="form-group">
                <label for="group-name-input" class="form-label">Nombre del grupo *</label>
                <input type="text" id="group-name-input" class="form-input" placeholder="Viaje a la playa" required>
              </div>

              <div class="form-group">
                <label for="group-description-input" class="form-label">Descripción</label>
                <textarea id="group-description-input" class="form-textarea" placeholder="Descripción del grupo..."></textarea>
              </div>

              <div class="form-group" id="participants-section">
                <label class="form-label">Participantes</label>
                <div class="participants-list" id="participants-list"></div>
                <div class="add-participant-form">
                  <select id="add-participant-select" class="form-select">
                    <option value="">Seleccionar usuario...</option>
                  </select>
                  <button type="button" class="btn btn-secondary btn-sm" id="add-participant-btn">
                    <i class="fas fa-plus"></i> Agregar
                  </button>
                </div>
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
            <p>¿Estás seguro de que deseas eliminar este grupo? Esta acción no se puede deshacer.</p>
            <input type="hidden" id="delete-group-id">
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

      <!-- Modal Balances -->
      <div class="modal-overlay" id="balances-modal">
        <div class="modal" style="max-width: 600px;">
          <div class="modal-header">
            <h3 class="modal-title">Balances y Deudas</h3>
            <button class="modal-close" id="balances-close-btn">&times;</button>
          </div>
          <div class="modal-body" id="balances-modal-body">
          </div>
          <div class="modal-footer">
            <button class="btn btn-primary" id="balances-ok-btn">Cerrar</button>
          </div>
        </div>
      </div>

      <style>
        .participants-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          max-height: 200px;
          overflow-y: auto;
          margin-top: 0.5rem;
        }
        .participant-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.5rem;
          background: var(--bg-secondary);
          border-radius: 8px;
        }
        .participant-info {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .participant-avatar {
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
        .participant-role {
          font-size: 0.75rem;
          color: var(--text-secondary);
        }
        .add-participant-form {
          display: flex;
          gap: 0.5rem;
          margin-top: 0.5rem;
        }
        .add-participant-form .form-select {
          flex: 1;
        }
        .member-badges {
          display: flex;
          flex-wrap: wrap;
          gap: 0.25rem;
        }
        .member-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.25rem 0.5rem;
          background: var(--primary-light);
          color: var(--primary-color);
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 500;
        }
        .balances-summary {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 1rem;
          margin-bottom: 1.5rem;
        }
        .balance-card {
          padding: 1rem;
          background: var(--bg-secondary);
          border-radius: 12px;
          text-align: center;
        }
        .balance-card-value {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--primary-color);
        }
        .balance-card-label {
          font-size: 0.8rem;
          color: var(--text-secondary);
          margin-top: 0.25rem;
        }
        .balance-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .balance-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.75rem 1rem;
          background: var(--bg-primary);
          border-radius: 8px;
          border: 1px solid var(--border-color);
        }
        .balance-user {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .balance-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: var(--primary-light);
          color: var(--primary-color);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 0.85rem;
        }
        .balance-amount {
          font-size: 1rem;
          font-weight: 600;
        }
        .balance-positive {
          color: var(--success-color);
        }
        .balance-negative {
          color: var(--danger-color);
        }
      </style>
    `;

    // Attach event listeners
    this.shadowRoot.querySelector('#menu-toggle-btn').addEventListener('click', () => window.toggleSidebar());
    this.shadowRoot.querySelector('#new-group-btn').addEventListener('click', () => this.openModal('create'));
    this.shadowRoot.querySelector('#search-input').addEventListener('keyup', () => this.filterGroups());
    this.shadowRoot.querySelector('#modal-close-btn').addEventListener('click', () => this.closeModal());
    this.shadowRoot.querySelector('#cancel-btn').addEventListener('click', () => this.closeModal());
    this.shadowRoot.querySelector('#save-btn').addEventListener('click', () => this.saveGroup());
    this.shadowRoot.querySelector('#add-participant-btn').addEventListener('click', () => this.addTempParticipant());
    this.shadowRoot.querySelector('#delete-close-btn').addEventListener('click', () => this.closeDeleteModal());
    this.shadowRoot.querySelector('#delete-cancel-btn').addEventListener('click', () => this.closeDeleteModal());
    this.shadowRoot.querySelector('#confirm-delete-btn').addEventListener('click', () => this.confirmDelete());
    this.shadowRoot.querySelector('#balances-close-btn').addEventListener('click', () => this.closeBalancesModal());
    this.shadowRoot.querySelector('#balances-ok-btn').addEventListener('click', () => this.closeBalancesModal());
  }
}

customElements.define('groups-manager', GroupsManager);

export { GroupsManager };
