/**
 * Login Form Web Component
 * Custom element for the login page with Shadow DOM
 */
import { login } from '../js/auth.js';
import { showToast, isValidEmail } from '../js/api.js';

class LoginForm extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    // Check if already authenticated
    if (localStorage.getItem('token')) {
      window.location.href = '/pages/groups.html';
      return;
    }

    this.render();
    this.attachEventListeners();
  }

  render() {
    this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                }

                .auth-page {
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: linear-gradient(135deg, var(--bg-dark, #0a0a0f) 0%, var(--surface-dark, #12121a) 100%);
                    padding: 2rem;
                    font-family: 'Inter', sans-serif;
                }

                .auth-container {
                    width: 100%;
                    max-width: 420px;
                }

                .auth-card {
                    background: var(--surface, #1e1e2e);
                    border-radius: 1.5rem;
                    padding: 2.5rem;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                    border: 1px solid var(--border, rgba(255,255,255,0.1));
                }

                .auth-logo {
                    text-align: center;
                    margin-bottom: 2rem;
                }

                .auth-logo h1 {
                    font-size: 2rem;
                    font-weight: 700;
                    color: var(--text-primary, #fff);
                    margin: 0;
                }

                .auth-logo h1 span {
                    color: var(--primary, #6366f1);
                }

                .auth-title {
                    font-size: 1.5rem;
                    font-weight: 600;
                    color: var(--text-primary, #fff);
                    text-align: center;
                    margin: 0 0 0.5rem 0;
                }

                .auth-subtitle {
                    color: var(--text-secondary, rgba(255,255,255,0.7));
                    text-align: center;
                    margin: 0 0 2rem 0;
                    font-size: 0.875rem;
                }

                .form-group {
                    margin-bottom: 1.25rem;
                }

                .form-label {
                    display: block;
                    font-size: 0.875rem;
                    font-weight: 500;
                    color: var(--text-primary, #fff);
                    margin-bottom: 0.5rem;
                }

                .form-input {
                    width: 100%;
                    padding: 0.875rem 1rem;
                    background: var(--bg-dark, #0a0a0f);
                    border: 1px solid var(--border, rgba(255,255,255,0.1));
                    border-radius: 0.75rem;
                    color: var(--text-primary, #fff);
                    font-size: 0.875rem;
                    transition: all 0.2s ease;
                    box-sizing: border-box;
                }

                .form-input:focus {
                    outline: none;
                    border-color: var(--primary, #6366f1);
                    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
                }

                .form-input::placeholder {
                    color: var(--text-muted, rgba(255,255,255,0.4));
                }

                .btn {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    padding: 0.875rem 1.5rem;
                    border-radius: 0.75rem;
                    font-weight: 600;
                    font-size: 0.875rem;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    border: none;
                }

                .btn-primary {
                    background: linear-gradient(135deg, var(--primary, #6366f1) 0%, var(--primary-dark, #4f46e5) 100%);
                    color: #fff;
                }

                .btn-primary:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 10px 20px rgba(99, 102, 241, 0.3);
                }

                .btn-primary:disabled {
                    opacity: 0.7;
                    cursor: not-allowed;
                    transform: none;
                }

                .btn-block {
                    width: 100%;
                }

                .btn-lg {
                    padding: 1rem 1.5rem;
                    font-size: 1rem;
                }

                .auth-divider {
                    text-align: center;
                    margin: 1.5rem 0;
                    color: var(--text-muted, rgba(255,255,255,0.4));
                    font-size: 0.875rem;
                }

                .auth-footer {
                    text-align: center;
                    color: var(--text-secondary, rgba(255,255,255,0.7));
                    font-size: 0.875rem;
                }

                .auth-footer a {
                    color: var(--primary, #6366f1);
                    text-decoration: none;
                    font-weight: 500;
                }

                .auth-footer a:hover {
                    text-decoration: underline;
                }

                .alert {
                    padding: 1rem;
                    border-radius: 0.75rem;
                    margin-bottom: 1rem;
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    font-size: 0.875rem;
                }

                .alert-error {
                    background: rgba(239, 68, 68, 0.1);
                    border: 1px solid rgba(239, 68, 68, 0.3);
                    color: #ef4444;
                }

                .alert-success {
                    background: rgba(16, 185, 129, 0.1);
                    border: 1px solid rgba(16, 185, 129, 0.3);
                    color: #10b981;
                }

                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }

                .fa-spin {
                    animation: spin 1s linear infinite;
                }
            </style>
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">

            <div class="auth-page">
                <div class="auth-container">
                    <div class="auth-card">
                        <div class="auth-logo">
                            <h1><span>$</span> SplitWise</h1>
                            <p style="color: var(--text-secondary); font-size: 0.875rem; margin-top: 0.25rem;">Gestión de gastos grupales</p>
                        </div>
                        
                        <h2 class="auth-title">Bienvenido</h2>
                        <p class="auth-subtitle">Ingresa tus credenciales para acceder</p>

                        <div id="alert-container"></div>

                        <form id="login-form">
                            <div class="form-group">
                                <label for="email" class="form-label">Correo electrónico</label>
                                <input 
                                    type="email" 
                                    id="email" 
                                    name="email" 
                                    class="form-input" 
                                    placeholder="tu@email.com"
                                    required
                                >
                            </div>

                            <div class="form-group">
                                <label for="password" class="form-label">Contraseña</label>
                                <input 
                                    type="password" 
                                    id="password" 
                                    name="password" 
                                    class="form-input" 
                                    placeholder="••••••••"
                                    required
                                >
                            </div>

                            <button type="submit" class="btn btn-primary btn-block btn-lg" id="login-btn">
                                <i class="fas fa-sign-in-alt"></i>
                                Iniciar Sesión
                            </button>
                        </form>

                        <div class="auth-divider">
                            <span>o</span>
                        </div>

                        <p class="auth-footer">
                            ¿No tienes cuenta? <a href="/pages/register.html">Regístrate aquí</a>
                        </p>
                    </div>
                </div>
            </div>
        `;
  }

  attachEventListeners() {
    const form = this.shadowRoot.querySelector('#login-form');
    if (form) {
      form.addEventListener('submit', (e) => this.handleSubmit(e));
    }
  }

  showAlert(message, type) {
    const container = this.shadowRoot.querySelector('#alert-container');
    if (container) {
      container.innerHTML = `
                <div class="alert alert-${type}">
                    <i class="fas fa-${type === 'error' ? 'exclamation-circle' : 'check-circle'}"></i>
                    ${message}
                </div>
            `;
    }
  }

  async handleSubmit(e) {
    e.preventDefault();

    const email = this.shadowRoot.querySelector('#email').value;
    const password = this.shadowRoot.querySelector('#password').value;
    const btn = this.shadowRoot.querySelector('#login-btn');

    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Iniciando...';

    try {
      const result = await login(email, password);

      if (result.success) {
        showToast('¡Bienvenido! Redirigiendo...', 'success');
        setTimeout(() => {
          window.location.href = '/pages/groups.html';
        }, 1000);
      } else {
        this.showAlert(result.message || 'Credenciales inválidas', 'error');
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Iniciar Sesión';
      }
    } catch (error) {
      this.showAlert('Error al conectar con el servidor', 'error');
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Iniciar Sesión';
    }
  }
}

customElements.define('login-form', LoginForm);

export { LoginForm };
