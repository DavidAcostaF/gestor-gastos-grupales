/**
 * Register Form Web Component
 * Custom element for the registration page with Shadow DOM
 * Uses the original light/minimalist color scheme
 */
import { register, login } from '../js/auth.js';
import { showToast, isValidEmail } from '../js/api.js';

class RegisterForm extends HTMLElement {
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
                    background: #fafafa;
                    padding: 1rem;
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }

                .auth-container {
                    width: 100%;
                    max-width: 440px;
                }

                .auth-card {
                    background: #ffffff;
                    border-radius: 12px;
                    padding: 2.5rem;
                    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.07);
                    border: 1px solid #e4e4e7;
                }

                .auth-logo {
                    text-align: center;
                    margin-bottom: 2rem;
                }

                .auth-logo h1 {
                    font-size: 1.5rem;
                    font-weight: 600;
                    color: #18181b;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    letter-spacing: -0.025em;
                    margin: 0;
                }

                .auth-logo h1 span {
                    font-size: 2rem;
                    color: #0d9488;
                }

                .auth-logo p {
                    color: #71717a;
                    font-size: 0.875rem;
                    margin-top: 0.25rem;
                }

                .auth-title {
                    font-size: 1.5rem;
                    font-weight: 600;
                    color: #18181b;
                    text-align: center;
                    margin: 0 0 0.5rem 0;
                }

                .auth-subtitle {
                    color: #71717a;
                    text-align: center;
                    margin: 0 0 2rem 0;
                    font-size: 0.875rem;
                }

                .form-group {
                    margin-bottom: 1.25rem;
                }

                .form-label {
                    display: block;
                    font-size: 0.9rem;
                    font-weight: 500;
                    color: #18181b;
                    margin-bottom: 0.5rem;
                }

                .form-input {
                    width: 100%;
                    padding: 0.875rem 1rem;
                    background: #ffffff;
                    border: 2px solid #e4e4e7;
                    border-radius: 6px;
                    color: #18181b;
                    font-size: 1rem;
                    font-family: inherit;
                    transition: all 0.2s ease;
                    box-sizing: border-box;
                }

                .form-input:focus {
                    outline: none;
                    border-color: #18181b;
                    box-shadow: 0 0 0 3px #f4f4f5;
                }

                .form-input::placeholder {
                    color: #a1a1aa;
                }

                .btn {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    padding: 0.75rem 1.5rem;
                    border-radius: 6px;
                    font-weight: 500;
                    font-size: 0.95rem;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    border: none;
                    text-decoration: none;
                    font-family: inherit;
                }

                .btn-primary {
                    background: #18181b;
                    color: #ffffff;
                }

                .btn-primary:hover {
                    background: #27272a;
                    box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.06);
                }

                .btn-primary:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }

                .btn-outline {
                    background: transparent;
                    border: 2px solid #18181b;
                    color: #18181b;
                }

                .btn-outline:hover {
                    background: #18181b;
                    color: #ffffff;
                }

                .btn-block {
                    width: 100%;
                }

                .btn-lg {
                    padding: 1rem 2rem;
                    font-size: 1.1rem;
                }

                .auth-divider {
                    display: flex;
                    align-items: center;
                    margin: 1.5rem 0;
                    color: #a1a1aa;
                }

                .auth-divider::before,
                .auth-divider::after {
                    content: '';
                    flex: 1;
                    height: 1px;
                    background: #e4e4e7;
                }

                .auth-divider span {
                    padding: 0 1rem;
                    font-size: 0.875rem;
                }

                .auth-footer {
                    text-align: center;
                    color: #71717a;
                    font-size: 0.75rem;
                    margin-top: 1.5rem;
                }

                .alert {
                    padding: 1rem;
                    border-radius: 6px;
                    margin-bottom: 1rem;
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    font-size: 0.875rem;
                }

                .alert-error {
                    background: #fee2e2;
                    border: 1px solid #fecaca;
                    color: #991b1b;
                }

                .alert-success {
                    background: #dcfce7;
                    border: 1px solid #bbf7d0;
                    color: #166534;
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
                            <p>Gestión de gastos grupales</p>
                        </div>
                        
                        <h2 class="auth-title">Crea tu cuenta</h2>
                        <p class="auth-subtitle">Regístrate para gestionar gastos en equipo</p>

                        <div id="alert-container"></div>

                        <form id="register-form">
                            <div class="form-group">
                                <label for="name" class="form-label">Nombre completo</label>
                                <input 
                                    type="text" 
                                    id="name" 
                                    name="name" 
                                    class="form-input" 
                                    placeholder="Tu nombre completo"
                                    required
                                >
                            </div>

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

                            <div class="form-group">
                                <label for="confirm-password" class="form-label">Confirmar contraseña</label>
                                <input 
                                    type="password" 
                                    id="confirm-password" 
                                    name="confirm-password" 
                                    class="form-input" 
                                    placeholder="Vuelve a escribir la contraseña"
                                    required
                                >
                            </div>

                            <button type="submit" class="btn btn-primary btn-block btn-lg" id="register-btn">
                                <i class="fas fa-user-plus"></i>
                                Registrarme
                            </button>
                        </form>

                        <div class="auth-divider">
                            <span>o</span>
                        </div>

                        <a class="btn btn-outline btn-block" href="/index.html">
                            <i class="fas fa-sign-in-alt"></i>
                            Ya tengo una cuenta
                        </a>

                        <p class="auth-footer">
                            Al registrarte aceptas nuestros términos y condiciones.
                        </p>
                    </div>
                </div>
            </div>
        `;
  }

  attachEventListeners() {
    const form = this.shadowRoot.querySelector('#register-form');
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

    const name = this.shadowRoot.querySelector('#name').value.trim();
    const email = this.shadowRoot.querySelector('#email').value.trim();
    const password = this.shadowRoot.querySelector('#password').value;
    const confirmPassword = this.shadowRoot.querySelector('#confirm-password').value;
    const btn = this.shadowRoot.querySelector('#register-btn');

    // Basic validations
    if (!name) {
      this.showAlert('El nombre es requerido', 'error');
      return;
    }
    if (!isValidEmail(email)) {
      this.showAlert('Ingresa un correo válido', 'error');
      return;
    }
    if (password.length < 6) {
      this.showAlert('La contraseña debe tener al menos 6 caracteres', 'error');
      return;
    }
    if (password !== confirmPassword) {
      this.showAlert('Las contraseñas no coinciden', 'error');
      return;
    }

    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Registrando...';

    try {
      const result = await register(name, email, password);

      if (result.success) {
        // Try automatic login after registration
        const loginResult = await login(email, password);
        if (loginResult.success) {
          showToast('Registro correcto. Bienvenido!', 'success');
          setTimeout(() => { window.location.href = '/pages/groups.html'; }, 900);
          return;
        }

        // If auto-login failed, redirect to login
        showToast('Usuario creado. Por favor inicia sesión.', 'success');
        setTimeout(() => { window.location.href = '/index.html'; }, 900);
      } else {
        this.showAlert(result.message || 'No fue posible registrar el usuario', 'error');
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-user-plus"></i> Registrarme';
      }
    } catch (error) {
      this.showAlert('Error al conectar con el servidor', 'error');
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-user-plus"></i> Registrarme';
    }
  }
}

customElements.define('register-form', RegisterForm);

export { RegisterForm };
