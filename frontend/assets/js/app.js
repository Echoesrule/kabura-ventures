// Kabura Ventures - Main Application Script

// Toast system
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) {
        const div = document.createElement('div');
        div.id = 'toast-container';
        div.className = 'toast-container';
        document.body.appendChild(div);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.getElementById('toast-container').appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// Modal system
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('active');
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('active');
}

function closeAllModals() {
    document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
}

document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) {
        e.target.classList.remove('active');
    }
});

// Auth state management
async function updateAuthUI() {
    const token = localStorage.getItem('token');
    const authButtons = document.getElementById('auth-buttons');
    const userMenu = document.getElementById('user-menu');

    if (!authButtons) return;

    if (token) {
        try {
            const result = await api.getProfile();
            const user = result.user;

            if (authButtons) {
                authButtons.innerHTML = `
                    <span style="font-weight:500;">Hi, ${user.name.split(' ')[0]}</span>
                    ${user.role === 'admin' ? '<a href="/admin.html" class="btn btn-sm btn-gold">Dashboard</a>' : ''}
                    <button class="btn btn-sm btn-secondary" onclick="api.logout()">Logout</button>
                `;
            }
        } catch {
            api.setToken(null);
            renderGuestAuth();
        }
    } else {
        renderGuestAuth();
    }
}

function renderGuestAuth() {
    const authButtons = document.getElementById('auth-buttons');
    if (!authButtons) return;
    authButtons.innerHTML = `
        <button class="btn btn-sm btn-secondary" onclick="openModal('login-modal')">Login</button>
        <button class="btn btn-sm btn-primary" onclick="openModal('register-modal')">Sign Up</button>
    `;
}

// Login form
document.addEventListener('submit', async (e) => {
    if (e.target.id === 'login-form') {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        const btn = e.target.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.textContent = 'Loading...';

        try {
            await api.login({ email, password });
            showToast('Login successful!', 'success');
            closeAllModals();
            updateAuthUI();
            e.target.reset();
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            btn.disabled = false;
            btn.textContent = 'Login';
        }
    }

    if (e.target.id === 'register-form') {
        e.preventDefault();
        const name = document.getElementById('reg-name').value;
        const email = document.getElementById('reg-email').value;
        const password = document.getElementById('reg-password').value;
        const phone = document.getElementById('reg-phone').value;
        const btn = e.target.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.textContent = 'Loading...';

        try {
            await api.register({ name, email, password, phone });
            showToast('Registration successful!', 'success');
            closeAllModals();
            updateAuthUI();
            e.target.reset();
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            btn.disabled = false;
            btn.textContent = 'Sign Up';
        }
    }
});

// Hamburger menu
document.addEventListener('click', (e) => {
    if (e.target.closest('.hamburger')) {
        document.querySelector('.nav-links').classList.toggle('open');
    }
});

// Setup navigation
function setupNavigation() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-links a').forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPage) {
            link.classList.add('active');
        }
    });
}

// Initialize auth forms modals on all pages
function initAuthModals() {
    const modalHTML = `
        <!-- Login Modal -->
        <div class="modal-overlay" id="login-modal">
            <div class="modal">
                <div class="modal-header">
                    <h2>Welcome Back</h2>
                    <button class="modal-close" onclick="closeModal('login-modal')">&times;</button>
                </div>
                <form id="login-form">
                    <div class="form-group">
                        <label class="form-label">Email</label>
                        <input type="email" class="form-input" id="login-email" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Password</label>
                        <input type="password" class="form-input" id="login-password" required>
                    </div>
                    <button type="submit" class="btn btn-primary" style="width:100%;">Login</button>
                    <p style="text-align:center;margin-top:1rem;color:var(--text-secondary);">
                        Don't have an account? <a href="#" onclick="event.preventDefault();closeModal('login-modal');openModal('register-modal');" style="color:var(--primary-green);font-weight:600;">Sign Up</a>
                    </p>
                </form>
            </div>
        </div>

        <!-- Register Modal -->
        <div class="modal-overlay" id="register-modal">
            <div class="modal">
                <div class="modal-header">
                    <h2>Create Account</h2>
                    <button class="modal-close" onclick="closeModal('register-modal')">&times;</button>
                </div>
                <form id="register-form">
                    <div class="form-group">
                        <label class="form-label">Full Name</label>
                        <input type="text" class="form-input" id="reg-name" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Email</label>
                        <input type="email" class="form-input" id="reg-email" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Phone</label>
                        <input type="tel" class="form-input" id="reg-phone">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Password</label>
                        <input type="password" class="form-input" id="reg-password" minlength="6" required>
                    </div>
                    <button type="submit" class="btn btn-primary" style="width:100%;">Sign Up</button>
                    <p style="text-align:center;margin-top:1rem;color:var(--text-secondary);">
                        Already have an account? <a href="#" onclick="event.preventDefault();closeModal('register-modal');openModal('login-modal');" style="color:var(--primary-green);font-weight:600;">Login</a>
                    </p>
                </form>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// Currency state
let currencyRates = {};
let currentCurrency = localStorage.getItem('preferred_currency') || 'KES';

function formatPrice(amountKES) {
    const rate = currencyRates[currentCurrency]?.rate_to_kes || 1;
    const symbol = currencyRates[currentCurrency]?.symbol || 'KSh';
    const converted = (amountKES / rate);
    if (currentCurrency === 'KES') {
        return `KSh ${Math.round(converted).toLocaleString()}`;
    }
    return `${symbol}${converted.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

async function initCurrencySwitcher() {
    const sel = document.getElementById('currency-switcher');
    if (!sel) return;
    try {
        const result = await api.getCurrencies();
        (result.currencies || []).forEach(c => {
            currencyRates[c.currency_code] = c;
        });
        sel.value = currentCurrency;
        sel.addEventListener('change', () => {
            currentCurrency = sel.value;
            localStorage.setItem('preferred_currency', currentCurrency);
            document.querySelectorAll('.price-amount').forEach(el => {
                const kes = parseFloat(el.dataset.kes);
                if (kes) el.textContent = formatPrice(kes);
            });
        });
    } catch { /* ignore */ }
}

// AOS (Animate on Scroll)
function initializeAOS() {
    if (!window.AOS) return false;

    AOS.init({
        offset: 120,
        delay: 0,
        duration: 700,
        easing: 'ease-out-cubic',
        once: true,
        mirror: false,
        anchorPlacement: 'top-bottom'
    });

    return true;
}

(function() {
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/aos@2.3.1/dist/aos.js';
    script.async = true;
    script.onload = () => {
        initializeAOS();
    };
    script.onerror = () => {
        setupScrollReveal();
    };
    document.body.appendChild(script);
})();

let _scrollObserver = null;

function setupScrollReveal(container) {
    if (window.AOS) {
        AOS.refresh();
        return;
    }

    if (!_scrollObserver) {
        _scrollObserver = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('reveal-visible');
                    obs.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.18,
            rootMargin: '0px 0px -12% 0px'
        });
    }

    const root = container || document;
    const targets = Array.from(root.querySelectorAll('[data-aos], .scroll-reveal'));

    targets.forEach(target => {
        if (!target.classList.contains('reveal-visible')) {
            target.classList.add('reveal-init');
            _scrollObserver.observe(target);
        }
    });
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setupNavigation();
    initAuthModals();
    updateAuthUI();
    initCurrencySwitcher();
    setupScrollReveal();
});
