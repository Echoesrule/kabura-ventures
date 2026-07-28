// Kabura Ventures - Main Application Script

/* ── SVG Icon Registry ───────────────────────────────────────── */
function svgIcon(name, opts) {
    opts = opts || {};
    var s = opts.size || 16;
    var c = opts.color || 'currentColor';
    var sw = opts.strokeWidth || 2;
    var cls = opts.className || '';
    var d = svgIcon.paths[name];
    if (!d) return '';
    var extra = '';
    if (opts.fill) extra += ' fill="' + opts.fill + '" ';
    if (opts.style) extra += ' style="' + opts.style + '" ';
    return '<svg width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none" stroke="' + c + '" stroke-width="' + sw + '" stroke-linecap="round" stroke-linejoin="round" class="svg-icon' + (cls ? ' ' + cls : '') + '" ' + extra + '>' + d + '</svg>';
}
svgIcon.paths = {
    'star':            '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
    'star-outline':    '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
    'clock':           '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
    'users':           '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    'map-pin':         '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
    'tag':             '<path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>',
    'city':            '<path d="M3 21h18"/><path d="M5 21V7l7-4 7 4v14"/><path d="M9 21v-6h6v6"/><path d="M10 9h1"/><path d="M14 9h1"/><path d="M10 13h1"/><path d="M14 13h1"/>',
    'check':           '<polyline points="20 6 9 17 4 12"/>',
    'times':           '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
    'undo':            '<polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>',
    'chevron-down':    '<polyline points="6 9 12 15 18 9"/>',
    'chevron-left':    '<polyline points="15 18 9 12 15 6"/>',
    'chevron-right':   '<polyline points="9 18 15 12 9 6"/>',
    'fire':            '<path d="M12 12c2-2.96 0-7-1-8 0 3.038-1.773 4.741-3 6-1.226 1.26-2 3.24-2 5a6 6 0 1 0 12 0c0-1.532-1.056-3.94-2-5-1.786 3-2.791 3-4 2z"/>',
    'trophy':          '<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>',
    'check-circle':    '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>',
    'lock':            '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    'bed':             '<path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/>',
    'comment':         '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
    'wifi':            '<path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/>',
    'parking':         '<rect x="3" y="3" width="18" height="18" rx="2"/><text x="12" y="16" text-anchor="middle" fill="currentColor" stroke="none" font-size="12" font-weight="700" font-family="sans-serif">P</text>',
    'coffee':          '<path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/>',
    'swimmer':         '<path d="M2 12c1.5-2 3.5-3 5-3s3.5 1 5 3 3.5 3 5 3 3.5-1 5-3"/><path d="M4 20l2-4 3 2 3-4 3 2 3-4 2 4"/>',
    'dumbbell':        '<path d="M6.5 6.5h11"/><path d="M6.5 17.5h11"/><path d="M3 6.5v11"/><path d="M21 6.5v11"/><path d="M3 10v4"/><path d="M21 10v4"/>',
    'utensils':        '<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/>',
    'glass-cheers':    '<path d="M8 2h8l-1 8H9L8 2z"/><path d="M12 10v4"/><path d="M8 22h8"/><path d="M7 14h10"/><path d="M6 14l-2 8"/><path d="M18 14l2 8"/>',
    'snowflake':       '<line x1="12" y1="2" x2="12" y2="22"/><path d="M20 16l-4-4 4-4"/><path d="M4 8l4 4-4 4"/><path d="M16 4l-4 4-4-4"/><path d="M8 20l4-4 4 4"/>',
    'temp-high':       '<path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/>',
    'tv':              '<rect x="2" y="7" width="20" height="15" rx="2" ry="2"/><polyline points="17 2 12 7 7 2"/>',
    'paw':             '<circle cx="11" cy="4" r="2"/><circle cx="18" cy="8" r="2"/><circle cx="20" cy="16" r="2"/><path d="M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z"/>',
    'umbrella':        '<path d="M23 12a11.05 11.05 0 0 0-22 0zm-5 7a3 3 0 0 1-6 0"/>',
    'spa':             '<path d="M12 22c-4.97 0-9-2.69-9-6 0-4 9-10 9-10s9 6 9 10c0 3.31-4.03 6-9 6z"/><path d="M12 12V6"/><path d="M9 9l3-3 3 3"/>',
    'briefcase':       '<rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
    'soap':            '<path d="M8.5 2C5.46 2 3 4.46 3 7.5S5.46 13 8.5 13H9v7a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-7h.5c3.04 0 5.5-2.46 5.5-5.5S20.54 2 17.5 2"/><path d="M12 2v4"/>',
    'shuttle-van':     '<path d="M1 3h15v13H1z"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>',
    'plane':           '<path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>',
    'bell':            '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>',
    'user':            '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    'smoking':         '<path d="M2 16h16"/><path d="M18 16V8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8"/><path d="M20 8v4"/><path d="M22 8v4"/>',
    'no-smoking':      '<circle cx="12" cy="12" r="10"/><line x1="2" y1="2" x2="22" y2="22"/>',
    'wheelchair':      '<circle cx="12" cy="4" r="2"/><path d="M19 13v-2a4 4 0 0 0-4-4H9"/><path d="M9 13v6"/><path d="M5 13v6"/><path d="M15 19a4 4 0 1 1-8 0"/>',
    'seedling':        '<path d="M12 22V10"/><path d="M6 14c0-4 2-7 6-7s6 3 6 7"/><path d="M4 20c0-5 3.5-8 8-8s8 3 8 8"/>',
    'tree':            '<path d="M12 22v-7"/><path d="M7 15l5-5 5 5"/><path d="M5 11l7-7 7 7"/>',
    'mountain':        '<path d="M8 21l4-10 4 10"/><path d="M2 21l7-14 3 6"/><path d="M14 11l7-14-9 14"/>',
    'water':           '<path d="M2 12c2-3 4-5 6-5s4 3 6 3 4-3 6-3"/><path d="M2 17c2-3 4-5 6-5s4 3 6 3 4-3 6-3"/><path d="M2 22c2-3 4-5 6-5s4 3 6 3 4-3 6-3"/>',
    'door-open':       '<path d="M13 4h3a2 2 0 0 1 2 2v14"/><path d="M2 20h3"/><path d="M13 20h9"/><path d="M10 12v.01"/><path d="M13 4.562v16.157"/><path d="M6 16l4-8"/>',
    'laptop':          '<rect x="3" y="4" width="18" height="12" rx="2" ry="2"/><line x1="2" y1="20" x2="22" y2="20"/>',
    'ruler':           '<path d="M21.7 7.3l-5-5-12 12 5 5 12-12z"/><path d="M15 10l2 2"/><path d="M18 7l2 2"/><path d="M7 17l-3 3"/>',
    'couch':           '<path d="M4 11V8a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v3"/><path d="M2 11v5a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v4H6v-4a2 2 0 0 0-4 0z"/>',
    'flag-checkered':  '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>',
    'map-marker-alt':  '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
    'star-half':       '<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>',
    'question-circle': '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
    'info':            '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>',
    'search':          '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
    'suitcase':        '<rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
    'credit-card':     '<rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>',
    'hiking':          '<circle cx="13.5" cy="6.5" r="2.5"/><path d="M7 21l3-7 3 2 4-5 3 5"/><path d="M5 21l4-8"/>',
    'hotel-building':  '<path d="M3 21h18"/><path d="M5 21V7l7-4 7 4v14"/><path d="M9 21v-6h6v6"/>',
    'headset':         '<path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/>',
    'envelope':        '<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>',
    'phone':           '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>',
    'message-circle':  '<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>',
    'shield':          '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
    'send':            '<line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>'
};
/* ── End SVG Icon Registry ───────────────────────────────────── */

function escHtml(str) {
    if (!str) return '';
    var d = document.createElement('div');
    d.appendChild(document.createTextNode(str));
    return d.innerHTML;
}

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

// Cross-tab auth sync
window.addEventListener('storage', (e) => {
    if (e.key === 'token' && e.newValue) {
        api.setToken(e.newValue);
        if (window.location.pathname === '/' || window.location.pathname === '/login.html' || window.location.pathname === '/signup.html') {
            window.location.href = '/';
        }
    }
    if (e.key === 'token' && !e.newValue) {
        api.setToken(null);
    }
});

// Auth state management
async function updateAuthUI() {
    const token = localStorage.getItem('token');
    const authButtons = document.getElementById('auth-buttons');
    const dropdown = document.getElementById('user-dropdown-menu');

    if (!authButtons) return;

    if (token) {
        try {
            const result = await api.getProfile();
            const user = result.user;
            currentUser = user;
            const adminMenuItem = user.role === 'admin'
                ? '<a href="/admin" class="nav-user-menu-item">Dashboard</a>'
                : '';

            if (dropdown) {
    dropdown.innerHTML = '<div class="nav-user-menu-card">'
                    + '<div class="nav-user-menu-header">'
                    + '<img src="/assets/images/kabura-logo.png" alt="Kabura Ventures" class="nav-user-logo">'
                    + '<p class="nav-user-greeting">Hello There,</br> ' + escHtml(user.name || 'Traveler') + '</p>'
                    + '<p class="nav-user-email">' + escHtml(user.email || '') + '</p>'
                    + '</div>'
                    + '<div class="nav-user-section-label">My Account</div>'
                    + adminMenuItem
                    + '<a href="/booking.html" class="nav-user-menu-item">My Bookings</a>'
                    + '<a href="/wishlist.html" class="nav-user-menu-item">Wishlists</a>'
                    + '<div class="nav-user-menu-divider"></div>'
                    + '<div class="nav-user-section-label">Support</div>'
                    + '<a href="/help.html" class="nav-user-menu-item">Help Center</a>'
                    + '<a href="/help.html#general" class="nav-user-menu-item">FAQs</a>'
                    + '<div class="nav-user-menu-divider"></div>'
                    + '<div class="nav-user-footer">'
                    + '<span class="nav-user-lang">English</span>'
                    + '<a href="#" class="nav-user-app">By Kabura</a>'
                    + '</div>'
                    + '<a href="#" class="nav-user-menu-item nav-user-menu-logout" onclick="api.logout()">Logout</a>'
                    + '</div>';
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
    const dropdown = document.getElementById('user-dropdown-menu');
    if (!dropdown) return;
                dropdown.innerHTML = '<div class="nav-user-menu-card">'
        + '<div class="nav-user-menu-header">'
        + '<img src="/assets/images/kabura-logo.png" alt="Kabura Ventures" class="nav-user-logo">'
        + '<p class="nav-user-tagline">Explore.</br>Discover. Journey.</p>'
        + '<p class="nav-user-subtitle">Log in or sign up to unlock savings.</p>'
        + '</div>'
        + '<div class="nav-user-section-label">My Account</div>'
        + '<div class="nav-user-roles">'
        + '<button class="nav-user-role active">Traveler</button>'
        + '<button class="nav-user-role">Partner</button>'
        + '</div>'
        + '<div class="nav-user-login-row">'
        + '<a href="/login.html" class="nav-user-login-btn">Log in</a>'
     
        + '</div>'
        + '<a href="/signup.html" class="nav-user-signup-link">Sign Up</a>'
        + '<div class="nav-user-menu-divider"></div>'
        + '<div class="nav-user-section-label">Support</div>'
        + '<a href="/help.html" class="nav-user-menu-item">Help Center</a>'
        + '<a href="/help.html#general" class="nav-user-menu-item">FAQs</a>'
        + '<div class="nav-user-menu-divider"></div>'
        + '<div class="nav-user-footer">'
        + '<span class="nav-user-lang">English</span>'
        + '<a href="#" class="nav-user-app">By Kabura</a>'
        + '</div>'
        + '</div>';
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
            <p style="color:var(--text-secondary);margin-bottom:1rem;">
                We sent a sign-in link to<br><strong>${escapeHTML(email)}</strong>
            </p>
            <p style="color:var(--text-secondary);font-size:0.9rem;margin-bottom:1.5rem;">
                Click the link in the email to verify your account and log in automatically.
            </p>
            <p class="auth-note">
                Didn't get the email?
                <a href="#" onclick="event.preventDefault();resendOtp('${escapeHTML(email)}')" style="color:var(--primary);font-weight:600;">
                    Resend
                </a>
            </p>
            <p style="margin-top:1.5rem;">
                <a href="#" onclick="event.preventDefault();toggleOtpInput()" style="color:var(--text-secondary);font-size:0.85rem;">
                    Have a verification code? Enter it manually
                </a>
            </p>
            <div id="otp-section" style="display:none;margin-top:1rem;">
                <div class="form-group" style="max-width:280px;margin:0 auto;">
                    <input type="text" id="otp-input" class="form-input"
                        placeholder="Enter 6-digit code" maxlength="6"
                        style="text-align:center;font-size:1.5rem;letter-spacing:8px;font-weight:600;">
                </div>
                <button class="btn btn-primary btn-lg auth-cta" id="verify-email-btn" onclick="handleVerifyEmail('${escapeHTML(email)}')">
                    Verify Email
                </button>
            </div>
            <p class="auth-note" style="margin-top:1rem;">
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
    }

    const onVisible = () => {
        if (!document.hidden) {
            const token = localStorage.getItem('token');
            if (token) {
                window.location.href = '/';
            }
        }
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);

    let pollCount = 0;
    const pollInterval = setInterval(async () => {
        if (document.getElementById('otp-section')?.style.display === '') return;
        pollCount++;
        try {
            const res = await api.get(`/auth/verification-status?email=${encodeURIComponent(email)}`);
            if (res.verified && res.token) {
                api.setToken(res.token);
                clearInterval(pollInterval);
                const overlay = document.createElement('div');
                overlay.className = 'verification-loading-overlay';
                overlay.innerHTML = '<div class="spinner"></div><p>Verification successful! Logging in...</p>';
                document.body.appendChild(overlay);
                setTimeout(() => { window.location.href = '/'; }, 1200);
            }
        } catch (e) {
            if (pollCount > 120) clearInterval(pollInterval);
        }
    }, 4000);

    div._cleanup = () => {
        document.removeEventListener('visibilitychange', onVisible);
        window.removeEventListener('focus', onVisible);
        clearInterval(pollInterval);
    };

}

function cancelVerification() {
    const panel = document.getElementById('verify-email-panel');
    if (panel && panel._cleanup) panel._cleanup();
    const panels = document.querySelector('.auth-panels');
    const socials = document.querySelector('.socials');
    const orSep = document.querySelector('.or-sep');
    const toggle = document.querySelector('.auth-toggle');
    if (panels) panels.style.display = '';
    if (socials) socials.style.display = '';
    if (orSep) orSep.style.display = '';
    if (toggle) toggle.style.display = '';
    if (panel) panel.remove();
}

function toggleOtpInput() {
    const section = document.getElementById('otp-section');
    if (section) {
        const shown = section.style.display !== 'none';
        section.style.display = shown ? 'none' : 'block';
        if (!shown) {
            const input = document.getElementById('otp-input');
            if (input) input.focus();
        }
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
        const msg = err.message || '';
        if (msg.includes('expired')) {
            showToast('Code expired. Click "Resend" for a new one.', 'error');
        } else if (msg.includes('Invalid')) {
            showToast('Invalid code. Check your email and try again, or click the verification link in the email.', 'error');
        } else {
            showToast(msg || 'Verification failed. Please try again.', 'error');
        }
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

// Password toggle visibility (global function for inline onclick)
window.togglePassword = function(btn) {
    const wrapper = btn.closest('.password-wrapper');
    if (!wrapper) return;
    const input = wrapper.querySelector('.form-input, input[type="password"], input[type="text"]');
    const icon = btn.querySelector('i');
    if (!input || !icon) return;
    const show = input.type === 'password';
    input.type = show ? 'text' : 'password';
    icon.className = show ? 'fas fa-eye-slash' : 'fas fa-eye';
    btn.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
};

// Password strength meter
const strengthConfig = [
    { label: 'Weak', color: '#D32F2F', min: 0 },
    { label: 'Fair', color: '#FF8A65', min: 2 },
    { label: 'Good', color: '#FFC107', min: 3 },
    { label: 'Strong', color: '#4CAF50', min: 4 },
];

function getPasswordStrength(password) {
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 10) score++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;
    return Math.min(score, strengthConfig.length - 1);
}

function setupPasswordStrength() {
    const input = document.getElementById('reg-password');
    const meter = document.getElementById('reg-password-strength-meter');
    const fill = document.getElementById('reg-password-strength-fill');
    const label = document.getElementById('reg-password-strength-label');
    if (!input || !meter || !fill || !label) return;

    input.addEventListener('input', () => {
        const val = input.value;
        if (!val) { meter.style.display = 'none'; return; }
        meter.style.display = 'flex';
        const idx = getPasswordStrength(val);
        const cfg = strengthConfig[idx];
        fill.style.width = ((idx + 1) / strengthConfig.length * 100) + '%';
        fill.style.background = cfg.color;
        label.textContent = cfg.label;
        label.style.color = cfg.color;
    });
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

    setupPasswordStrength();
}

// Hamburger menu — builds and toggles a separate fullscreen mobile overlay
function toggleMobileMenu(open) {
    var overlay = document.getElementById('mobile-menu-overlay');
    var btn = document.querySelector('.hamburger i');

    if (open === undefined) {
        if (overlay && overlay.style.display === 'block') open = false;
        else open = true;
    }

    if (open) {
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'mobile-menu-overlay';
            overlay.className = 'mobile-menu-overlay';
            document.body.appendChild(overlay);
        }
        renderMobileMenu(overlay);
        overlay.style.display = 'block';
        if (btn) btn.className = 'fas fa-times';
        document.body.style.overflow = 'hidden';
    } else {
        if (overlay) overlay.style.display = 'none';
        if (btn) btn.className = 'fas fa-bars';
        document.body.style.overflow = '';
    }
}

function renderMobileMenu(container) {
    var token = localStorage.getItem('token');
    var user = currentUser;
    var isLoggedIn = token && user;

    var html = '<button class="mobile-menu-close" aria-label="Close menu"><i class="fas fa-times"></i></button>';
    html += '<div class="mobile-menu-scroll"><div class="mobile-menu-card">';

    if (isLoggedIn) {
        html += '<div class="mobile-menu-card-header">'
            + '<img src="/assets/images/kabura-logo.png" alt="Kabura Ventures" class="mobile-menu-logo">'
            + '<p class="mobile-menu-greeting">Hi, ' + escHtml(user.name || 'Traveler') + '</p>'
            + '<p class="mobile-menu-email">' + escHtml(user.email || '') + '</p>'
            + '</div>'
            + '<div class="mobile-menu-section-label">My Account</div>'
            + (user.role === 'admin' ? '<a href="/admin" class="mobile-menu-item">Dashboard</a>' : '')
            + '<a href="/booking.html" class="mobile-menu-item">My Bookings</a>'
            + '<a href="/wishlist.html" class="mobile-menu-item">Wishlists</a>'
            + '<div class="mobile-menu-divider"></div>';
    } else {
        html += '<div class="mobile-menu-card-header">'
            + '<img src="/assets/images/kabura-logo.png" alt="Kabura Ventures" class="mobile-menu-logo">'
            + '<p class="mobile-menu-tagline">Explore Kenya</p>'
            + '<p class="mobile-menu-tagline-sub">with Kabura Adventures</p>'
            + '<p class="mobile-menu-subtitle">Sign in to access bookings, wishlists & more.</p>'
            + '</div>'
            + '<div class="mobile-menu-section-label">My Account</div>'
            + '<div class="mobile-menu-roles">'
            + '<button class="mobile-menu-role active">Traveler</button>'
            + '<button class="mobile-menu-role">Partner</button>'
            + '</div>'
            + '<div class="mobile-menu-login-row">'
            + '<a href="/login.html" class="mobile-menu-login-btn">Log in</a>'
           
            + '</div>'
            + '<a href="/signup.html" class="mobile-menu-signup-link">Create an account</a>'
            + '<div class="mobile-menu-divider"></div>';
    }

    // Browse — nav links
    html += '<div class="mobile-menu-section-label">Explore</div>';
    document.querySelectorAll('.nav-links > li').forEach(function(li) {
        if (li.classList.contains('mobile-brand') || li.id === 'auth-buttons' || li.classList.contains('currency-selector')) return;
        var a = li.tagName === 'A' ? li : li.querySelector('a');
        if (!a) return;
        var href = a.getAttribute('href');
        var t = a.textContent.replace(/^\s+|\s+$/g, '').replace(/\s*<.*?>/g, '');
        if (!t) return;

        // Dropdowns — collapsible with toggle
        if (li.classList.contains('nav-dropdown')) {
            var tText = a.textContent.replace(/^\s+|\s+$/g, '').replace(/\s*<.*?>/g, '');
            if (tText === 'Packages') {
                html += '<div class="mobile-menu-dropdown">'
                    + '<button class="mobile-menu-dropdown-toggle" onclick="this.parentElement.classList.toggle(\'open\')">'
                    + '<span>Packages</span><i class="fas fa-chevron-down"></i>'
                    + '</button>'
                    + '<div class="mobile-menu-dropdown-content">';
                li.querySelectorAll('.nav-dropdown-menu a').forEach(function(sub) {
                    var sh = sub.getAttribute('href');
                    var st = sub.textContent.replace(/^\s+|\s+$/g, '');
                    if (sh && st) html += '<a href="' + sh + '" class="mobile-menu-item mobile-menu-sub">' + st + '</a>';
                });
                html += '</div></div>';
            } else if (tText === 'Our Services') {
                html += '<div class="mobile-menu-dropdown">'
                    + '<button class="mobile-menu-dropdown-toggle" onclick="this.parentElement.classList.toggle(\'open\')">'
                    + '<span>Our Services</span><i class="fas fa-chevron-down"></i>'
                    + '</button>'
                    + '<div class="mobile-menu-dropdown-content">';
                li.querySelectorAll('.nav-service-card').forEach(function(card) {
                    var sh = card.getAttribute('href');
                    var st = card.querySelector('strong')?.textContent || '';
                    if (sh && st) html += '<a href="' + sh + '" class="mobile-menu-item mobile-menu-sub">' + st + '</a>';
                });
                html += '</div></div>';
            }
            return;
        }

        if (!href || href === '#') return;
        html += '<a href="' + href + '" class="mobile-menu-item">' + t + '</a>';
    });

    // Support
    html += '<div class="mobile-menu-divider"></div>'
        + '<div class="mobile-menu-section-label">Support</div>'
        + '<a href="/help.html" class="mobile-menu-item">Help Center</a>'
        + '<a href="/help.html#general" class="mobile-menu-item">FAQs</a>'
        + '<div class="mobile-menu-divider"></div>'
        + '<div class="mobile-menu-footer">'
        + '<span class="mobile-menu-lang">English</span>'
        + '<a href="tel:+254716036542" class="mobile-menu-app">+254 716 036 542</a>'
        + '</div>';

    if (isLoggedIn) {
        html += '<a href="#" class="mobile-menu-item mobile-menu-logout" onclick="api.logout()">Logout</a>';
    }

    html += '</div></div>'; // close card + scroll
    container.innerHTML = html;
}

// Hamburger click
document.addEventListener('click', function(e) {
    var hamburger = e.target.closest('.hamburger');
    if (hamburger) { toggleMobileMenu(); return; }
    // Close overlay on close button or outside click
    if (e.target.closest('.mobile-menu-close')) { toggleMobileMenu(false); return; }
    if (e.target.closest('.mobile-menu-overlay') && !e.target.closest('.mobile-menu-card') && !e.target.closest('.mobile-menu-close')) { toggleMobileMenu(false); return; }
    // Role toggle
    var role = e.target.closest('.mobile-menu-role');
    if (role) {
        var parent = role.closest('.mobile-menu-roles');
        if (parent) { parent.querySelectorAll('.mobile-menu-role').forEach(function(r) { r.classList.remove('active'); }); role.classList.add('active'); }
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
                        <div class="password-wrapper">
                            <input type="password" class="form-input" id="login-password" required>
                            <button type="button" class="password-toggle" tabindex="-1" aria-label="Show password" onclick="togglePassword(this)">
                                <i class="fas fa-eye"></i>
                            </button>
                        </div>
                    </div>
                    <button type="submit" class="btn btn-primary" style="width:100%;">Login</button>
                    <p style="text-align:center;margin-top:1rem;color:var(--text-secondary);">
                        Don't have an account? <a href="#" onclick="event.preventDefault();closeModal('login-modal');openModal('register-modal');" style="color:var(--primary);font-weight:600;">Sign Up</a>
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
                        <div class="password-wrapper">
                            <input type="password" class="form-input" id="reg-password" minlength="6" required>
                            <button type="button" class="password-toggle" tabindex="-1" aria-label="Show password" onclick="togglePassword(this)">
                                <i class="fas fa-eye"></i>
                            </button>
                        </div>
                        <div class="password-strength" id="reg-password-strength-meter">
                            <div class="password-strength-bar">
                                <div class="password-strength-fill" id="reg-password-strength-fill"></div>
                            </div>
                            <span class="password-strength-label" id="reg-password-strength-label"></span>
                        </div>
                    </div>
                    <button type="submit" class="btn btn-primary" style="width:100%;">Sign Up</button>
                    <p style="text-align:center;margin-top:1rem;color:var(--text-secondary);">
                        Already have an account? <a href="#" onclick="event.preventDefault();closeModal('register-modal');openModal('login-modal');" style="color:var(--primary);font-weight:600;">Login</a>
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
    setupPasswordStrength();
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
                    <span style="font-size:0.85rem;color:${msg.is_read ? 'var(--text-secondary)' : 'var(--primary)'};font-weight:600;">${msg.is_read ? 'Read' : 'Unread'}</span>
                </div>
                <p style="margin:0.75rem 0 0.75rem;line-height:1.6;white-space:pre-wrap;">${escapeHTML(msg.message)}</p>
                ${msg.admin_reply ? `<div style="margin-top:0.75rem;padding:0.85rem;border-left:4px solid var(--accent);background:rgba(255,243,224,0.65);">
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
    const converted = ((Number(amountKES) || 0) / rate);
    if (currentCurrency === 'KES') {
        return `KSh ${Math.round(converted).toLocaleString()}`;
    }
    return `${symbol}${converted.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function priceHTML(amountKES, suffix = '') {
    const value = Number(amountKES) || 0;
    return `<span class="price-amount" data-kes="${value}">${formatPrice(value)}</span>${suffix}`;
}

function refreshCurrencyPrices() {
    document.querySelectorAll('.price-amount[data-kes]').forEach(el => {
        const kes = parseFloat(el.dataset.kes);
        if (!Number.isNaN(kes)) el.textContent = formatPrice(kes);
    });
    window.dispatchEvent(new CustomEvent('currencychange', { detail: { currency: currentCurrency } }));
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
    const selector = document.getElementById('currency-selector');
    const trigger = document.getElementById('currency-trigger');
    const dropdown = document.getElementById('currency-dropdown');
    const label = document.getElementById('currency-label');
    if (!selector || !trigger || !dropdown) return;

    try {
        const result = await api.getCurrencies();
        (result.currencies || []).forEach(c => {
            currencyRates[c.currency_code] = c;
        });
    } catch { /* ignore */ }

    function setActiveCurrency(code) {
        currentCurrency = code;
        localStorage.setItem('preferred_currency', currentCurrency);
        label.textContent = code;
        dropdown.querySelectorAll('.currency-option').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.currency === code);
        });
        refreshCurrencyPrices();
    }

    setActiveCurrency(currentCurrency);

    trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        selector.classList.toggle('open');
        trigger.setAttribute('aria-expanded', selector.classList.contains('open'));
    });

    dropdown.querySelectorAll('.currency-option').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            setActiveCurrency(btn.dataset.currency);
            selector.classList.remove('open');
            trigger.setAttribute('aria-expanded', 'false');
        });
    });

    document.addEventListener('click', () => {
        selector.classList.remove('open');
        trigger.setAttribute('aria-expanded', 'false');
    });
}

window.formatPrice = formatPrice;
window.priceHTML = priceHTML;
window.refreshCurrencyPrices = refreshCurrencyPrices;

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
    // ── Auth Carousel (login/register page) ──────────────────
    (async function initAuthCarousel() {
        var carousel = document.getElementById('auth-carousel');
        if (!carousel) return;

        var track = carousel.querySelector('.auth-carousel-track');
        var locEl = document.getElementById('auth-slide-location');
        var descEl = document.getElementById('auth-slide-desc');
        var prevBtn = carousel.querySelector('.auth-carousel-prev');
        var nextBtn = carousel.querySelector('.auth-carousel-next');
        var slides = [];
        var current = 0;

        function showSlide(index) {
            if (slides.length === 0) return;
            if (index < 0) index = slides.length - 1;
            if (index >= slides.length) index = 0;
            current = index;

            var imgs = track.querySelectorAll('.auth-slide-img');
            imgs.forEach(function (img, i) {
                img.classList.toggle('active', i === current);
            });

            if (locEl) locEl.textContent = slides[current].location || '';
            if (descEl) descEl.textContent = slides[current].description || '';
        }

        if (prevBtn) prevBtn.addEventListener('click', function () { showSlide(current - 1); });
        if (nextBtn) nextBtn.addEventListener('click', function () { showSlide(current + 1); });

        try {
            var result = await api.getAuthSlides();
            slides = result.slides || [];
        } catch (e) {
            // keep default kenya.jpg fallback
            return;
        }

        if (slides.length === 0) return;

        track.innerHTML = '';
        slides.forEach(function (s, i) {
            var img = document.createElement('img');
            img.src = s.file_url;
            img.alt = s.location || 'Slide';
            img.className = 'banner-img auth-hero-img auth-slide-img';
            if (i === 0) img.classList.add('active');
            track.appendChild(img);
        });

        showSlide(0);
    })();


    // WhatsApp floating bubble
    (function injectWhatsApp() {
        if (document.getElementById('whatsapp-float')) return;
        var a = document.createElement('a');
        a.id = 'whatsapp-float';
        a.className = 'whatsapp-float';
        a.href = 'https://wa.me/254700000000';
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.setAttribute('aria-label', 'Chat on WhatsApp');
        a.innerHTML = '<i class="fab fa-whatsapp"></i>';
        document.body.appendChild(a);
    })();

    // Role button toggle in user dropdown
    document.addEventListener('click', function(e) {
        var role = e.target.closest('.nav-user-role');
        if (role) {
            var parent = role.closest('.nav-user-roles');
            if (parent) {
                parent.querySelectorAll('.nav-user-role').forEach(function(r) { r.classList.remove('active'); });
                role.classList.add('active');
            }
        }
    });
});

