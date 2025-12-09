/**
 * App Sidebar Web Component
 * Shared navigation sidebar for authenticated pages with Shadow DOM
 * Uses the original light/minimalist color scheme
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
                    display: flex;
                    flex-direction: column;
                    width: 260px;
                    min-width: 260px;
                    max-width: 260px;
                    height: 100vh;
                    background: #ffffff;
                    border-right: 1px solid #e4e4e7;
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    position: sticky;
                    left: 0;
                    top: 0;
                    z-index: 100;
                    flex-shrink: 0;
                    box-sizing: border-box;
                }

                .sidebar-header {
                    padding: 1.5rem;
                    border-bottom: 1px solid #e4e4e7;
                }

                .sidebar-logo {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-size: 1.125rem;
                    font-weight: 600;
                    color: #18181b;
                    letter-spacing: -0.025em;
                }

                .sidebar-logo span {
                    font-size: 1.25rem;
                    color: #0d9488;
                }

                nav {
                    flex: 1;
                    padding: 1rem 0;
                    overflow-y: auto;
                }

                .nav-section {
                    margin-bottom: 1.5rem;
                }

                .nav-section-title {
                    padding: 0.5rem 1.5rem;
                    font-size: 0.75rem;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    color: #a1a1aa;
                    font-weight: 600;
                }

                .nav-link {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    padding: 0.75rem 1.5rem;
                    color: #71717a;
                    text-decoration: none;
                    font-size: 0.9rem;
                    transition: all 0.2s ease;
                    border-left: 2px solid transparent;
                }

                .nav-link:hover {
                    background: #fafafa;
                    color: #18181b;
                }

                .nav-link.active {
                    background: #f4f4f5;
                    color: #18181b;
                    border-left-color: #18181b;
                    font-weight: 500;
                }

                .nav-link i {
                    font-size: 1.25rem;
                    width: 24px;
                    text-align: center;
                }

                .sidebar-footer {
                    padding: 1rem 1.5rem;
                    border-top: 1px solid #e4e4e7;
                    margin-top: auto;
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
                    background: #18181b;
                    color: #fff;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 600;
                    font-size: 1rem;
                }

                .user-details {
                    flex: 1;
                    min-width: 0;
                }

                .user-name {
                    font-weight: 500;
                    font-size: 0.95rem;
                    color: #18181b;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .user-email {
                    font-size: 0.8rem;
                    color: #a1a1aa;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .btn-ghost {
                    background: transparent;
                    border: none;
                    color: #71717a;
                    padding: 0.5rem;
                    border-radius: 6px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .btn-ghost:hover {
                    background: #fee2e2;
                    color: #dc2626;
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
