/**
 * Supabase Auth Client for Kabura Ventures.
 * Handles Google OAuth, password reset, email verification,
 * and session exchange with the Flask backend.
 *
 * Dependencies: supabase-js v2 (loaded via CDN in HTML)
 *   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js"></script>
 */

// ─── Initialization ───────────────────────────────────────────────────────────

let supabaseClient = null;

/**
 * Fetch Supabase config from backend and create the client.
 * Call once on page load.
 */
async function initSupabaseClient() {
    try {
        const baseUrl = window.API_BASE || 'https://kabura-adventures-api.onrender.com/api';
        const res = await fetch(`${baseUrl}/auth/supabase/config`);
        if (!res.ok) {
            const errBody = await res.json().catch(() => ({}));
            throw new Error(errBody.error || `Config fetch failed (${res.status})`);
        }
        if (!window.supabase) {
            throw new Error('Supabase JS SDK not loaded (CDN may be blocked)');
        }
        const config = await res.json();
        if (!config.url || !config.anonKey) {
            throw new Error('Invalid Supabase config from server');
        }
        supabaseClient = window.supabase.createClient(config.url, config.anonKey);
        return supabaseClient;
    } catch (err) {
        console.error('[supabase-client] Init failed:', err.message);
        return null;
    }
}

/**
 * Get the Supabase client instance (must call initSupabaseClient first).
 */
function getSupabaseClient() {
    return supabaseClient;
}

// ─── Google OAuth ─────────────────────────────────────────────────────────────

/**
 * Initiate Google OAuth sign-in via Supabase.
 * The user is redirected to Google, then back to the redirectTo URL.
 */
async function signInWithGoogle() {
    const client = getSupabaseClient();
    if (!client) {
        console.warn('[supabase-client] Not initialized, redirecting to login page');
        window.location.href = '/login';
        return;
    }

    try {
        const { error } = await client.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin + '/login',
            },
        });
        if (error) throw error;
    } catch (err) {
        console.error('[supabase-client] Google OAuth error:', err);
        showToast('Failed to sign in with Google. Check console for details.', 'error');
    }
}

// ─── Password Reset ───────────────────────────────────────────────────────────

/**
 * Send a password reset email via the app's own API (works without Supabase).
 */
async function sendAppPasswordReset(email) {
    const baseUrl = window.API_BASE || (location.origin + '/api');
    try {
        const res = await fetch(`${baseUrl}/auth/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, redirect_to: location.origin }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to send reset email');
        return true;
    } catch (err) {
        console.error('[supabase-client] App password reset error:', err);
        showToast('App reset failed: ' + err.message + ' — trying Supabase...', 'warning');
        return false;
    }
}

/**
 * Send a password reset email — tries app API first, falls back to Supabase.
 */
async function sendPasswordReset(email) {
    const appOk = await sendAppPasswordReset(email);
    if (appOk) return true;

    const client = getSupabaseClient();
    if (!client) {
        showToast('Authentication service unavailable', 'error');
        return false;
    }

    try {
        const siteUrl = (window.API_BASE || location.origin + '/api').replace('/api', '');
        const { error } = await client.auth.resetPasswordForEmail(email, {
            redirectTo: siteUrl + '/login',
        });
        if (error) throw error;
        return true;
    } catch (err) {
        console.error('[supabase-client] Supabase password reset error:', err);
        showToast('Failed to send reset email. Check the email address.', 'error');
        return false;
    }
}

/**
 * Complete a password reset using the app's own API (reset token from email link).
 */
async function completeAppPasswordReset(token, newPassword) {
    const baseUrl = window.API_BASE || (location.origin + '/api');
    try {
        const res = await fetch(`${baseUrl}/auth/reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, password: newPassword }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to reset password');
        return true;
    } catch (err) {
        console.error('[supabase-client] App password reset complete error:', err);
        showToast(err.message, 'error');
        return false;
    }
}

/**
 * Update the password for the currently authenticated Supabase user.
 * Used after the Supabase password reset callback flow.
 */
async function updateSupabasePassword(newPassword) {
    const client = getSupabaseClient();
    if (!client) {
        showToast('Authentication service unavailable', 'error');
        return false;
    }

    try {
        const { error } = await client.auth.updateUser({ password: newPassword });
        if (error) throw error;
        return true;
    } catch (err) {
        console.error('[supabase-client] Password update error:', err);
        showToast('Failed to update password', 'error');
        return false;
    }
}

// ─── Session Exchange ─────────────────────────────────────────────────────────

/**
 * Exchange the current Supabase session for a Flask JWT via the backend.
 * Stores the Flask JWT in localStorage (same as existing email/password login).
 */
async function exchangeSupabaseSession() {
    const client = getSupabaseClient();
    if (!client) return null;

    try {
        const { data: { session } } = await client.auth.getSession();
        if (!session || !session.access_token) return null;

        const baseUrl = window.API_BASE || 'https://kabura-adventures-api.onrender.com/api';
        const res = await fetch(`${baseUrl}/auth/supabase/exchange`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ access_token: session.access_token }),
        });

        if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            console.error('[supabase-client] Exchange failed:', errData);
            return null;
        }

        const data = await res.json();
        if (data.token) {
            // Store Flask JWT using the existing API client method
            if (window.api && window.api.setToken) {
                window.api.setToken(data.token);
            } else {
                localStorage.setItem('token', data.token);
            }
        }
        return data;
    } catch (err) {
        console.error('[supabase-client] Session exchange error:', err);
        return null;
    }
}

/**
 * Sign out from Supabase (clears Supabase session).
 * Does NOT clear the Flask JWT — call api.logout() for that.
 */
async function signOutSupabase() {
    const client = getSupabaseClient();
    if (!client) return;
    try {
        await client.auth.signOut();
    } catch (err) {
        console.error('[supabase-client] Sign-out error:', err);
    }
}

// ─── Auth State Listener ──────────────────────────────────────────────────────

/**
 * Set up a Supabase auth state listener.
 * Processes OAuth callbacks, email verification, and password reset flows.
 * Call once after initSupabaseClient() on auth pages.
 */
function setupSupabaseAuthListener() {
    const client = getSupabaseClient();
    if (!client) return;

    client.auth.onAuthStateChange(async (event, session) => {
        console.log('[supabase-client] Auth event:', event);

        switch (event) {
            case 'SIGNED_IN':
                if (session) {
                    const hashParams = new URLSearchParams(window.location.hash.substring(1));
                    const type = hashParams.get('type');
                    if (type === 'recovery') {
                        showPasswordResetForm();
                        return;
                    }
                    const result = await exchangeSupabaseSession();
                    if (result) {
                        showToast('Login successful!', 'success');
                        setTimeout(() => {
                            window.location.href = '/';
                        }, 500);
                    }
                }
                break;

            case 'TOKEN_REFRESHED':
                break;

            case 'USER_UPDATED':
                break;

            default:
                break;
        }
    });
}

// ─── Password Reset UI Helpers ────────────────────────────────────────────────

/**
 * Show the password reset form on the auth page.
 * Called when the user returns from the reset email link.
 */
function showPasswordResetForm() {
    // Hide normal panels, show reset form
    const panels = document.querySelector('.auth-panels');
    const resetDiv = document.getElementById('supabase-reset-password-form');

    if (panels) panels.style.display = 'none';
    if (resetDiv) {
        resetDiv.style.display = 'block';
    } else {
        // Create the reset form if it doesn't exist
        const container = document.querySelector('.auth-left');
        if (!container) return;
        const form = document.createElement('div');
        form.id = 'supabase-reset-password-form';
        form.innerHTML = `
            <h3 style="margin-bottom:1rem;">Set New Password</h3>
            <p style="color:var(--text-secondary);margin-bottom:1.5rem;">
                Enter your new password below.
            </p>
            <div class="form-group">
                <label class="form-label">New Password</label>
                <div class="password-wrapper">
                    <input type="password" class="form-input" id="reset-new-password" minlength="6" required placeholder="At least 6 characters">
                    <button type="button" class="password-toggle" tabindex="-1" aria-label="Show password" onclick="togglePassword(this)">
                        <i class="fas fa-eye"></i>
                    </button>
                </div>
            </div>
            <div class="form-group">
                <label class="form-label">Confirm Password</label>
                <div class="password-wrapper">
                    <input type="password" class="form-input" id="reset-confirm-password" minlength="6" required placeholder="Repeat your password">
                    <button type="button" class="password-toggle" tabindex="-1" aria-label="Show password" onclick="togglePassword(this)">
                        <i class="fas fa-eye"></i>
                    </button>
                </div>
            </div>
            <button class="btn btn-primary btn-lg auth-cta" onclick="handlePasswordResetSubmit()">
                Update Password
            </button>
        `;
        container.appendChild(form);

    }
}

/**
 * Handle the password reset form submission.
 */
async function handlePasswordResetSubmit() {
    const newPw = document.getElementById('reset-new-password').value;
    const confirmPw = document.getElementById('reset-confirm-password').value;

    if (!newPw || newPw.length < 6) {
        showToast('Password must be at least 6 characters', 'error');
        return;
    }
    if (newPw !== confirmPw) {
        showToast('Passwords do not match', 'error');
        return;
    }

    // Try app API reset first (reset token from URL param)
    const params = new URLSearchParams(window.location.search);
    const resetToken = params.get('reset');
    if (resetToken) {
        const ok = await completeAppPasswordReset(resetToken, newPw);
        if (!ok) return;
        showToast('Password updated successfully! Please log in.', 'success');
        const panels = document.querySelector('.auth-panels');
        const resetDiv = document.getElementById('supabase-reset-password-form');
        if (panels) panels.style.display = '';
        if (resetDiv) resetDiv.style.display = 'none';
        window.history.replaceState({}, document.title, window.location.pathname);
        return;
    }

    // Fallback: Supabase password reset flow
    const supabaseSuccess = await updateSupabasePassword(newPw);
    if (!supabaseSuccess) return;

    const client = getSupabaseClient();
    if (!client) return;

    const { data: { session } } = await client.auth.getSession();
    if (session && session.access_token) {
        const baseUrl = window.API_BASE || 'https://kabura-adventures-api.onrender.com/api';
        try {
            const res = await fetch(`${baseUrl}/auth/supabase/sync-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ access_token: session.access_token, password: newPw }),
            });
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                console.error('[supabase-client] Password sync failed:', errData);
            }
        } catch (err) {
            console.error('[supabase-client] Password sync error:', err);
        }
    }

    showToast('Password updated successfully! Please log in.', 'success');
    const panels = document.querySelector('.auth-panels');
    const resetDiv = document.getElementById('supabase-reset-password-form');
    if (panels) panels.style.display = '';
    if (resetDiv) resetDiv.style.display = 'none';
    await signOutSupabase();
}

// ─── Forgot Password UI ───────────────────────────────────────────────────────

/**
 * Show an inline forgot-password form on the login panel.
 */
function showForgotPasswordForm() {
    const loginPanel = document.querySelector('[data-panel="login-panel"]');
    if (!loginPanel) return;

    // Hide the normal login form
    const loginForm = document.getElementById('login-form');
    const forgotDiv = document.getElementById('forgot-password-form');

    if (loginForm) loginForm.style.display = 'none';
    if (forgotDiv) {
        forgotDiv.style.display = 'block';
        return;
    }

    const form = document.createElement('div');
    form.id = 'forgot-password-form';
    form.innerHTML = `
        <h3 style="margin-bottom:1rem;">Reset Password</h3>
        <p style="color:var(--text-secondary);margin-bottom:1.5rem;">
            Enter your email address and we'll send you a reset link.
        </p>
        <div class="form-group">
            <label class="form-label">Email</label>
            <input type="email" class="form-input" id="forgot-email" required placeholder="you@domain.com">
        </div>
        <button class="btn btn-primary btn-lg auth-cta" id="forgot-submit-btn" onclick="handleForgotPasswordSubmit()">
            Send Reset Link
        </button>
        <p class="auth-note" style="margin-top:1rem;">
            <a href="#" onclick="event.preventDefault();hideForgotPasswordForm();" style="color:var(--primary);">
                Back to Login
            </a>
        </p>
    `;
    loginPanel.parentNode.insertBefore(form, loginPanel.nextSibling);
}

function hideForgotPasswordForm() {
    const loginForm = document.getElementById('login-form');
    const forgotDiv = document.getElementById('forgot-password-form');
    if (loginForm) loginForm.style.display = '';
    if (forgotDiv) forgotDiv.style.display = 'none';
}

async function handleForgotPasswordSubmit() {
    const email = document.getElementById('forgot-email').value;
    if (!email) {
        showToast('Please enter your email', 'error');
        return;
    }

    const btn = document.getElementById('forgot-submit-btn');
    if (btn) {
        btn.disabled = true;
        btn.textContent = 'Sending...';
    }

    const success = await sendPasswordReset(email);
    if (success) {
        showToast('Reset link sent! Check your email.', 'success');
        hideForgotPasswordForm();
    }

    if (btn) {
        btn.disabled = false;
        btn.textContent = 'Send Reset Link';
    }
}

// ─── Initialization for Auth Pages ────────────────────────────────────────────

/**
 * Check URL for password reset token from the app's own reset email.
 */
function checkAppResetToken() {
    const params = new URLSearchParams(window.location.search);
    if (params.has('reset')) {
        showPasswordResetForm();
        return true;
    }
    return false;
}

/**
 * Full initialization for login/signup pages.
 * Call this on DOMContentLoaded.
 */
async function initSupabaseAuthPage() {
    if (checkAppResetToken()) {
        return;
    }
    const client = await initSupabaseClient();
    if (client) {
        setupSupabaseAuthListener();
    }
}
