/**
 * Toast Container Web Component
 * Custom element for displaying toast notifications with Shadow DOM
 */
class ToastContainer extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.render();
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    position: fixed;
                    top: 1rem;
                    right: 1rem;
                    z-index: 9999;
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }

                .toast {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    padding: 1rem 1.25rem;
                    border-radius: 0.75rem;
                    background: var(--surface, #1e1e2e);
                    color: var(--text-primary, #fff);
                    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
                    animation: slideIn 0.3s ease;
                    font-family: 'Inter', sans-serif;
                    font-size: 0.875rem;
                }

                .toast-success {
                    border-left: 4px solid var(--success, #10b981);
                }

                .toast-error {
                    border-left: 4px solid var(--danger, #ef4444);
                }

                .toast-warning {
                    border-left: 4px solid var(--warning, #f59e0b);
                }

                .toast-info {
                    border-left: 4px solid var(--primary, #6366f1);
                }

                .toast i {
                    font-size: 1.25rem;
                }

                .toast-success i { color: var(--success, #10b981); }
                .toast-error i { color: var(--danger, #ef4444); }
                .toast-warning i { color: var(--warning, #f59e0b); }
                .toast-info i { color: var(--primary, #6366f1); }

                @keyframes slideIn {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
            </style>
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
        `;
    }

    /**
     * Show a toast notification
     * @param {string} message - The message to display
     * @param {string} type - The type of notification (success, error, warning, info)
     */
    show(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;

        const icon = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        }[type] || 'info-circle';

        toast.innerHTML = `
            <i class="fas fa-${icon}"></i>
            <span>${message}</span>
        `;

        this.shadowRoot.appendChild(toast);

        // Remove after 4 seconds
        setTimeout(() => {
            toast.style.animation = 'slideIn 0.3s ease reverse';
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }
}

customElements.define('toast-container', ToastContainer);

export { ToastContainer };
