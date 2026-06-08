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

let currentUser = null;

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
            currentUser = user;

            if (authButtons) {
                authButtons.innerHTML = `
                    <span style="font-weight:500;">Hi, ${user.name.split(' ')[0]}</span>
                    <button class="btn btn-sm btn-secondary" onclick="openUserInbox()">Inbox</button>
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
        <button class="btn btn-sm btn-secondary" onclick="window.location.href='/login.html'">Login</button>
        <button class="btn btn-sm btn-primary" onclick="window.location.href='/signup.html'">Sign Up</button>
    `;
}

// Login form
document.addEventListener('submit', async (e) => {
    if (e.target.id === 'login-form') {
        e.preventDefault();
        const identifier = document.getElementById('login-identifier').value;
        const password = document.getElementById('login-password').value;
        const btn = e.target.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.textContent = 'Loading...';

        try {
            const payload = { identifier, password };
            if (identifier && identifier.indexOf('@') !== -1) payload.email = identifier;
            const result = await api.login(payload);
            showToast('Login successful!', 'success');
            const path = window.location.pathname || '';
            if (path.endsWith('login.html') || path.endsWith('signup.html') || path.endsWith('/login') || path.endsWith('/signup')) {
                setTimeout(() => { window.location.href = '/'; }, 300);
            } else {
                closeAllModals();
                updateAuthUI();
                e.target.reset();
            }
        } catch (err) {
            if (err.message && err.message.includes('verify your email')) {
                showEmailVerification(identifier.indexOf('@') !== -1 ? identifier : '');
            } else {
                showToast(err.message, 'error');
            }
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
            const result = await api.register({ name, email, password, phone });
            if (result.requires_verification) {
                const path = window.location.pathname || '';
                if (path.endsWith('login.html') || path.endsWith('signup.html')) {
                    showEmailVerification(result.email);
                } else {
                    showToast('Verification code sent! Check your email.', 'success');
                    setTimeout(() => { window.location.href = '/signup.html'; }, 500);
                }
            } else {
                if (result.token) api.setToken(result.token);
                showToast('Registration successful!', 'success');
                const path = window.location.pathname || '';
                if (path.endsWith('login.html') || path.endsWith('signup.html')) {
                    setTimeout(() => { window.location.href = '/'; }, 300);
                } else {
                    closeAllModals();
                    updateAuthUI();
                    e.target.reset();
                }
            }
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            btn.disabled = false;
            btn.textContent = 'Sign Up';
        }
    }

    if (e.target.classList.contains('footer-newsletter-form')) {
        e.preventDefault();
        const emailInput = e.target.querySelector('input[type="email"]');
        const email = emailInput?.value.trim();
        const btn = e.target.querySelector('button[type="submit"]');
        const originalText = btn ? btn.textContent : 'Subscribe';

        if (!email) {
            showToast('Please enter a valid email address.', 'error');
            return;
        }

        if (btn) {
            btn.disabled = true;
            btn.textContent = 'Subscribing...';
        }

        try {
            await api.subscribeNewsletter({ email });
            showToast('Subscribed successfully!', 'success');
            e.target.reset();
        } catch (err) {
            showToast(err.message || 'Subscription failed.', 'error');
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.textContent = originalText;
            }
        }
    }
});

// Email verification UI
function showEmailVerification(email) {
    const existing = document.getElementById('verify-email-panel');
    if (existing) existing.remove();

    const panels = document.querySelector('.auth-panels');
    const socials = document.querySelector('.socials');
    const orSep = document.querySelector('.or-sep');
    const toggle = document.querySelector('.auth-toggle');

    if (panels) panels.style.display = 'none';
    if (socials) socials.style.display = 'none';
    if (orSep) orSep.style.display = 'none';
    if (toggle) toggle.style.display = 'none';

    const container = document.querySelector('.auth-left');
    if (!container) return;

    const div = document.createElement('div');
    div.id = 'verify-email-panel';
    div.innerHTML = `
        <div style="text-align:center;padding:1rem 0;">
            <div style="font-size:3rem;margin-bottom:1rem;">&#9993;</div>
            <h3 style="margin-bottom:0.5rem;">Verify Your Email</h3>
            <p style="color:var(--text-secondary);margin-bottom:1.5rem;">
                We sent a 6-digit code to<br><strong>${escapeHTML(email)}</strong>
            </p>
            <div class="form-group" style="max-width:280px;margin:0 auto;">
                <input type="text" id="otp-input" class="form-input"
                    placeholder="Enter 6-digit code" maxlength="6"
                    style="text-align:center;font-size:1.5rem;letter-spacing:8px;font-weight:600;">
            </div>
            <button class="btn btn-primary btn-lg auth-cta" id="verify-email-btn" onclick="handleVerifyEmail('${escapeHTML(email)}')">
                Verify Email
            </button>
            <p class="auth-note" style="margin-top:1rem;">
                Didn't get the code?
                <a href="#" onclick="event.preventDefault();resendOtp('${escapeHTML(email)}')" style="color:var(--primary-green);font-weight:600;">
                    Resend Code
                </a>
            </p>
            <p class="auth-note">
                <a href="#" onclick="event.preventDefault();cancelVerification()" style="color:var(--text-secondary);font-size:0.85rem;">
                    Back to Sign Up
                </a>
            </p>
        </div>
    `;
    container.appendChild(div);

    const otpInput = document.getElementById('otp-input');
    if (otpInput) {
        otpInput.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/\D/g, '').slice(0, 6);
        });
        otpInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') handleVerifyEmail(email);
        });
        otpInput.focus();
    }

}

async function handleVerifyEmail(email) {
    const token = document.getElementById('otp-input').value.trim();
    if (token.length < 6) {
        showToast('Please enter the full 6-digit code', 'error');
        return;
    }

    const btn = document.getElementById('verify-email-btn');
    if (btn) { btn.disabled = true; btn.textContent = 'Verifying...'; }

    try {
        const result = await api.verifyEmail(email, token);
        showToast('Email verified! Welcome!', 'success');
        setTimeout(() => { window.location.href = '/'; }, 300);
    } catch (err) {
        showToast(err.message || 'Invalid code. Please try again.', 'error');
        if (btn) { btn.disabled = false; btn.textContent = 'Verify Email'; }
    }
}

async function resendOtp(email) {
    if (!email) return;
    const link = document.querySelector('a[onclick*="resendOtp"]');
    if (link) link.style.opacity = '0.5';
    try {
        await api.sendOtp(email);
        showToast('Code resent! Check your email.', 'success');
    } catch (err) {
        showToast(err.message || 'Failed to resend code', 'error');
    } finally {
        if (link) link.style.opacity = '1';
    }
}

function cancelVerification() {
    const panel = document.getElementById('verify-email-panel');
    if (panel) panel.remove();

    const panels = document.querySelector('.auth-panels');
    const socials = document.querySelector('.socials');
    const orSep = document.querySelector('.or-sep');
    const toggle = document.querySelector('.auth-toggle');

    if (panels) panels.style.display = '';
    if (socials) socials.style.display = '';
    if (orSep) orSep.style.display = '';
    if (toggle) toggle.style.display = '';
}

// Auth page slider initialization (login/signup panels)
function initAuthPage() {
    const tabs = document.querySelectorAll('.auth-tab');
    const slider = document.querySelector('.auth-slider');
    const panels = document.querySelectorAll('.auth-panel');

    if (!tabs || tabs.length === 0) return;

    function showPanel(target) {
        panels.forEach(p => {
            if (p.dataset.panel === target) {
                p.style.display = '';
                p.style.opacity = '1';
                p.style.transform = 'none';
                p.classList.add('reveal-visible');
            } else {
                p.style.display = 'none';
                p.style.opacity = '0';
                p.style.transform = 'translateY(8px)';
                p.classList.remove('reveal-visible');
            }
        });
    }

    tabs.forEach((tab, i) => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            if (slider) slider.style.left = (i === 0 ? '0%' : '50%');
            const target = tab.dataset.target;
            showPanel(target);
        });
    });

    // initialize position based on active tab
    const activeIndex = Array.from(tabs).findIndex(t => t.classList.contains('active'));
    const initIndex = activeIndex >= 0 ? activeIndex : 0;
    if (slider) slider.style.left = (initIndex === 0 ? '0%' : '50%');
    const initialTarget = tabs[initIndex] ? tabs[initIndex].dataset.target : (panels[0] && panels[0].dataset.panel);
    if (initialTarget) showPanel(initialTarget);

    document.querySelectorAll('.switch-to').forEach(a => {
        a.addEventListener('click', (ev) => {
            ev.preventDefault();
            const target = a.dataset.target;
            const tab = Array.from(tabs).find(t => t.dataset.target === target);
            if (tab) tab.click();
        });
    });
}

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
                        <label class="form-label">Username or Email</label>
                        <input type="text" class="form-input" id="login-identifier" required>
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

        <!-- User Inbox Modal -->
        <div class="modal-overlay" id="user-inbox-modal">
            <div class="modal modal-large">
                <div class="modal-header">
                    <h2>My Inbox</h2>
                    <button class="modal-close" onclick="closeModal('user-inbox-modal')">&times;</button>
                </div>
                <div class="modal-body" style="gap:1rem;">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;gap:0.5rem;flex-wrap:wrap;">
                        <span style="font-size:0.95rem;color:var(--text-secondary);">Messages from admin and support</span>
                        <div style="display:flex;gap:0.5rem;flex-wrap:wrap;">
                            <button class="btn btn-sm btn-secondary" onclick="loadUserMessages()">Refresh</button>
                            <button class="btn btn-sm btn-danger" onclick="clearUserMessages()">Clear Inbox</button>
                        </div>
                    </div>
                    <div id="user-inbox-list" style="display:grid;gap:1rem;"></div>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function toggleReplyPanel(messageId) {
    const panel = document.getElementById(`reply-panel-${messageId}`);
    if (!panel) return;
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
}

async function openUserInbox() {
    if (!currentUser) {
        try {
            const profile = await api.getProfile();
            currentUser = profile.user;
        } catch (err) {
            showToast(err.message || 'Unable to load profile', 'error');
            return;
        }
    }
    openModal('user-inbox-modal');
    await loadUserMessages();
}

async function clearUserMessages() {
    if (!confirm('Clear all inbox messages? This cannot be undone.')) return;
    try {
        await api.clearMyMessages();
        showToast('Inbox cleared', 'success');
        await loadUserMessages();
    } catch (err) {
        showToast(err.message || 'Failed to clear inbox', 'error');
    }
}

async function sendInboxMessage() {
    const subjectInput = document.getElementById('inbox-subject');
    const messageInput = document.getElementById('inbox-message');
    if (!subjectInput || !messageInput) return;

    const subject = subjectInput.value.trim() || 'Support message';
    const message = messageInput.value.trim();
    if (!message) {
        showToast('Please enter a message before sending.', 'error');
        return;
    }

    if (!currentUser) {
        try {
            const profile = await api.getProfile();
            currentUser = profile.user;
        } catch (err) {
            showToast(err.message || 'Unable to identify current user', 'error');
            return;
        }
    }

    try {
        await api.sendMessage({
            user_id: currentUser.id,
            name: currentUser.name,
            email: currentUser.email,
            subject,
            message
        });
        showToast('Message sent to support.', 'success');
        subjectInput.value = '';
        messageInput.value = '';
        await loadUserMessages();
    } catch (err) {
        showToast(err.message || 'Failed to send message', 'error');
    }
}

async function sendReplyFromInbox(messageId) {
    const textarea = document.getElementById(`reply-text-${messageId}`);
    const panel = document.getElementById(`reply-panel-${messageId}`);
    if (!textarea || !panel) return;

    const replyText = textarea.value.trim();
    if (!replyText) {
        showToast('Please enter a reply before sending.', 'error');
        return;
    }

    const subject = panel.dataset.subject || 'Admin Reply';
    const userId = currentUser?.id;
    const userEmail = currentUser?.email;
    const userName = currentUser?.name;

    if (!userId || !userEmail || !userName) {
        showToast('Unable to identify current user.', 'error');
        return;
    }

    try {
        await api.sendMessage({
            user_id: userId,
            name: userName,
            email: userEmail,
            subject,
            message: replyText
        });
        textarea.value = '';
        panel.style.display = 'none';
        showToast('Reply sent to admin.', 'success');
        await loadUserMessages();
    } catch (err) {
        showToast(err.message || 'Failed to send reply.', 'error');
    }
}

async function loadUserMessages() {
    const list = document.getElementById('user-inbox-list');
    if (!list) return;
    list.innerHTML = '<div class="empty-state"><h3>Loading messages...</h3></div>';

    try {
        const result = await api.getMyMessages({ per_page: 50 });
        const messages = result.messages || [];

        if (!messages.length) {
            list.innerHTML = `
                <div class="empty-state">
                    <h3>No inbox messages yet</h3>
                    <p>Admin replies will appear here.</p>
                </div>
                <div class="card" style="padding:1rem;">
                    <h3 style="margin:0 0 0.75rem;">Send a message to support</h3>
                    <div class="form-group">
                        <label class="form-label">Subject</label>
                        <input type="text" id="inbox-subject" class="form-input" placeholder="Message subject" maxlength="255">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Message</label>
                        <textarea id="inbox-message" class="form-input" style="min-height:120px;" placeholder="Write your message to support..."></textarea>
                    </div>
                    <button class="btn btn-primary" onclick="sendInboxMessage()">Send Message</button>
                </div>
            `;
            return;
        }

        list.innerHTML = messages.map(msg => `
            <div class="card" style="padding:1rem;">
                <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:0.75rem;flex-wrap:wrap;">
                    <div>
                        <h3 style="margin:0 0 0.5rem;">${escapeHTML(msg.subject || 'Message from admin')}</h3>
                        <div style="font-size:0.85rem;color:var(--text-secondary);">${escapeHTML(new Date(msg.created_at).toLocaleString())}</div>
                    </div>
                    <span style="font-size:0.85rem;color:${msg.is_read ? 'var(--text-secondary)' : 'var(--primary-green)'};font-weight:600;">${msg.is_read ? 'Read' : 'Unread'}</span>
                </div>
                <p style="margin:0.75rem 0 0.75rem;line-height:1.6;white-space:pre-wrap;">${escapeHTML(msg.message)}</p>
                ${msg.admin_reply ? `<div style="margin-top:0.75rem;padding:0.85rem;border-left:4px solid var(--accent-gold);background:rgba(255,243,224,0.65);">
                    <strong>Admin Reply</strong>
                    <p style="margin:0.5rem 0 0;line-height:1.6;white-space:pre-wrap;">${escapeHTML(msg.admin_reply)}</p>
                </div>` : ''}
                <div style="margin-top:1rem;display:flex;justify-content:flex-end;gap:0.5rem;flex-wrap:wrap;">
                    <button class="btn btn-sm btn-primary" onclick="toggleReplyPanel('${msg.id}')">Reply</button>
                </div>
                <div id="reply-panel-${msg.id}" class="reply-panel" data-subject="${escapeHTML('Re: ' + (msg.subject || 'Message from admin'))}" style="display:none;margin-top:1rem;">
                    <textarea id="reply-text-${msg.id}" class="form-input" placeholder="Write your reply to the admin..." style="min-height:100px;width:100%;"></textarea>
                    <div style="display:flex;justify-content:flex-end;gap:0.5rem;margin-top:0.75rem;">
                        <button class="btn btn-sm btn-secondary" onclick="toggleReplyPanel('${msg.id}')">Cancel</button>
                        <button class="btn btn-sm btn-gold" onclick="sendReplyFromInbox('${msg.id}')">Send Reply</button>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (err) {
        list.innerHTML = `<div class="empty-state"><h3>Could not load messages</h3><p>${err.message || 'Please try again later.'}</p></div>`;
    }
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

function escapeHTML(value) {
    if (value === null || value === undefined) return '';
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
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
    initAuthPage();
    setupScrollReveal();
    // load hero image for auth pages
    (async function loadAuthHero() {
        try {
            const url = `${API_BASE.replace('/api','')}/api/media/hero-image`;
            const r = await fetch(url, { method: 'GET' });
            if (!r.ok) return;
            const data = await r.json();
            if (data && data.image) {
                const imgEl = document.getElementById('auth-hero-image');
                if (imgEl && data.image.file_url) imgEl.src = data.image.file_url;
                const capEl = document.getElementById('auth-hero-caption');
                if (capEl && data.image.caption) capEl.textContent = data.image.caption;
            }
        } catch (err) {
            // ignore
        }
    })();
});
