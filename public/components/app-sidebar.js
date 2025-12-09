/**
 * App Sidebar Web Component
 * Shared navigation sidebar for authenticated pages with Shadow DOM
 */
import { logout, getCurrentUser } from '../js/auth.js';
import { getInitials } from '../js/api.js';

class AppSidebar extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  static get observedAttributes() {
    return ['active-page'];
  }

  connectedCallback() {
    this.render();
    this.loadUserInfo();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'active-page' && oldValue !== newValue && this.shadowRoot.innerHTML) {
      this.updateActiveLink();
    }
  }

  get activePage() {
    return this.getAttribute('active-page') || '';
  }

  loadUserInfo() {
    const user = getCurrentUser();
    if (user) {
      const avatarEl = this.shadowRoot.querySelector('#user-avatar');
      const nameEl = this.shadowRoot.querySelector('#user-name');
      const emailEl = this.shadowRoot.querySelector('#user-email');

      if (avatarEl) avatarEl.textContent = getInitials(user.name);
      if (nameEl) nameEl.textContent = user.name || 'Usuario';
      if (emailEl) emailEl.textContent = user.email || '';
    }
  }

  updateActiveLink() {
    const links = this.shadowRoot.querySelectorAll('.nav-link');
    links.forEach(link => {
      link.classList.remove('active');
      const href = link.getAttribute('href');
      if (href && href.includes(this.activePage)) {
        link.classList.add('active');
      }
    });
  }

  handleLogout() {
    logout();
  }

  render() {
    this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    width: 280px;
                    height: 100vh;
                    background: linear-gradient(180deg, var(--surface, #1e1e2e) 0%, var(--surface-dark, #12121a) 100%);
                    border-right: 1px solid var(--border, rgba(255,255,255,0.1));
                    display: flex;
                    flex-direction: column;
                    font-family: 'Inter', sans-serif;
                }

                .sidebar-header {
                    padding: 1.5rem;
                    border-bottom: 1px solid var(--border, rgba(255,255,255,0.1));
                }

                .sidebar-logo {
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: var(--text-primary, #fff);
                }

                .sidebar-logo span {
                    color: var(--primary, #6366f1);
                }

                nav {
                    flex: 1;
                    padding: 1rem 0;
                    overflow-y: auto;
                }

                .nav-section {
                    padding: 0 0.75rem;
                    margin-bottom: 1rem;
                }

                .nav-section-title {
                    font-size: 0.75rem;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    color: var(--text-muted, rgba(255,255,255,0.4));
                    padding: 0.5rem 0.75rem;
                    font-weight: 600;
                }

                .nav-link {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    padding: 0.75rem;
                    margin: 0.125rem 0;
                    border-radius: 0.75rem;
                    color: var(--text-secondary, rgba(255,255,255,0.7));
                    text-decoration: none;
                    font-size: 0.875rem;
                    font-weight: 500;
                    transition: all 0.2s ease;
                }

                .nav-link:hover {
                    background: var(--surface-hover, rgba(255,255,255,0.05));
                    color: var(--text-primary, #fff);
                }

                .nav-link.active {
                    background: var(--primary, #6366f1);
                    color: #fff;
                }

                .nav-link i {
                    width: 1.25rem;
                    text-align: center;
                }

                .sidebar-footer {
                    padding: 1rem;
                    border-top: 1px solid var(--border, rgba(255,255,255,0.1));
                }

                .user-info {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                }

                .user-avatar {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    background: var(--primary, #6366f1);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #fff;
                    font-weight: 600;
                    font-size: 0.875rem;
                }

                .user-details {
                    flex: 1;
                    min-width: 0;
                }

                .user-name {
                    font-weight: 600;
                    color: var(--text-primary, #fff);
                    font-size: 0.875rem;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .user-email {
                    font-size: 0.75rem;
                    color: var(--text-muted, rgba(255,255,255,0.4));
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .btn-ghost {
                    background: transparent;
                    border: none;
                    color: var(--text-secondary, rgba(255,255,255,0.7));
                    padding: 0.5rem;
                    border-radius: 0.5rem;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .btn-ghost:hover {
                    background: var(--danger, #ef4444);
                    color: #fff;
                }
            </style>
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">

            <div class="sidebar-header">
                <div class="sidebar-logo">
                    <span>$</span> SplitWise
                </div>
            </div>

            <nav>
                <div class="nav-section">
                    <div class="nav-section-title">Gestión</div>
                    <a href="/pages/groups.html" class="nav-link ${this.activePage === 'groups' ? 'active' : ''}">
                        <i class="fas fa-users"></i>
                        Grupos
                    </a>
                    <a href="/pages/expenses.html" class="nav-link ${this.activePage === 'expenses' ? 'active' : ''}">
                        <i class="fas fa-receipt"></i>
                        Gastos
                    </a>
                    <a href="/pages/budgets.html" class="nav-link ${this.activePage === 'budgets' ? 'active' : ''}">
                        <i class="fas fa-piggy-bank"></i>
                        Presupuestos
                    </a>
                    <a href="/pages/payments.html" class="nav-link ${this.activePage === 'payments' ? 'active' : ''}">
                        <i class="fas fa-money-bill-wave"></i>
                        Pagos
                    </a>
                </div>

                <div class="nav-section">
                    <div class="nav-section-title">Administración</div>
                    <a href="/pages/users.html" class="nav-link ${this.activePage === 'users' ? 'active' : ''}">
                        <i class="fas fa-user-cog"></i>
                        Usuarios
                    </a>
                </div>
            </nav>

            <div class="sidebar-footer">
                <div class="user-info">
                    <div class="user-avatar" id="user-avatar">U</div>
                    <div class="user-details">
                        <div class="user-name" id="user-name">Usuario</div>
                        <div class="user-email" id="user-email">email@example.com</div>
                    </div>
                    <button class="btn-ghost" id="logout-btn" title="Cerrar sesión">
                        <i class="fas fa-sign-out-alt"></i>
                    </button>
                </div>
            </div>
        `;

    // Attach event listener for logout
    const logoutBtn = this.shadowRoot.querySelector('#logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => this.handleLogout());
    }
  }
}

// Helper function to toggle sidebar from outside the component
window.toggleSidebar = function () {
  const sidebar = document.querySelector('app-sidebar');
  if (sidebar && sidebar.shadowRoot) {
    sidebar.classList.toggle('open');
  }
};

customElements.define('app-sidebar', AppSidebar);

export { AppSidebar };
