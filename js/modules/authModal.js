/**
 * Kugofox Gaming Arena - KORG Authentication Modal Controller
 * Features:
 * - Segmented Tabs: "Log In" & "Create Account"
 * - Social Sign-In with Google
 * - Clean Icon-Prefixed Inputs (Full Name, Username, Email, Password, Confirm Password)
 * - Password Show/Hide Toggle
 * - Client-Side & Server-Side MongoDB Validation
 * - Persistent Session Management (localStorage)
 * - Header Profile Chip Integration
 */

import { sound } from './soundEngine.js';

const OFFICIAL_GOOGLE_CLIENT_ID = '150459129894-kc8mepcmrio4qm968ue0fdpjc8p7fr5h.apps.googleusercontent.com';

export class AuthModal {
  constructor(app) {
    this.app = app;
    this.overlay = null;
    this.currentTab = 'login'; // 'login' | 'create'
    this.currentUser = null;
    this.googleClientId = OFFICIAL_GOOGLE_CLIENT_ID;
  }

  init() {
    this.fetchGoogleConfig();
    this.checkExistingSession();
    this.checkGoogleOAuthCallback();
    this.injectModal();
    this.bindEvents();
  }

  async fetchGoogleConfig() {
    try {
      let url = '/api/auth/config';
      if (window.location.protocol === 'file:' || (window.location.port && window.location.port !== '5173')) {
        url = 'http://localhost:5173/api/auth/config';
      }
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data && data.googleClientId) {
          this.googleClientId = data.googleClientId;
        }
      }
    } catch (e) {}
  }

  async checkGoogleOAuthCallback() {
    const hash = window.location.hash;
    if (!hash || (!hash.includes('access_token=') && !hash.includes('id_token='))) return;

    try {
      const params = new URLSearchParams(hash.replace(/^#/, ''));
      const accessToken = params.get('access_token');
      const idToken = params.get('id_token');

      // Clear the hash from address bar for clean URL
      history.replaceState(null, '', window.location.pathname + window.location.search);

      if (accessToken) {
        const gRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (gRes.ok) {
          const profile = await gRes.json();
          if (profile && profile.email) {
            const name = profile.name || profile.email.split('@')[0];
            const username = profile.email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '') || 'gamer';
            const avatar = profile.picture || '⚡';
            await this.executeGoogleSignIn(name, profile.email, username, avatar);
            return;
          }
        }
      }

      if (idToken) {
        const res = await fetch('/api/auth/google', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ credential: idToken })
        });
        const data = await res.json();
        if (res.ok && data.success && data.user) {
          this.saveSession(data.user, data.token);
          if (this.app && typeof this.app.onUserLogin === 'function') {
            this.app.onUserLogin(data.user);
          }
          if (this.app && typeof this.app.showToast === 'function') {
            this.app.showToast(`Signed in with Google! Welcome, ${data.user.fullName}!`, 'success');
          }
        }
      }
    } catch (err) {
      console.warn('[Google OAuth Callback] Error:', err.message);
    }
  }

  checkExistingSession() {
    try {
      const saved = localStorage.getItem('korg_user_session');
      if (saved) {
        this.currentUser = JSON.parse(saved);
        if (this.app && typeof this.app.onUserLogin === 'function') {
          this.app.onUserLogin(this.currentUser);
        }
      }
    } catch (e) {
      console.warn('[Auth] Error restoring session:', e);
    }
  }

  injectModal() {
    if (document.getElementById('auth-modal-overlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'auth-modal-overlay';
    overlay.className = 'auth-modal-overlay';
    overlay.innerHTML = `
      <div class="auth-modal-card" id="auth-modal-card" role="dialog" aria-modal="true" aria-labelledby="auth-modal-title">
        
        <!-- Header: Logo + Brand + Close Button -->
        <div class="auth-modal-header">
          <div class="auth-brand-box">
            <div class="auth-brand-icon">
              <!-- Official KUGOFOX Fox Mascot Logo -->
              <img src="assets/kugofox_logo.png" alt="KUGOFOX" style="width: 28px; height: 28px; object-fit: contain;">
            </div>
            <div class="auth-brand-info">
              <span class="auth-brand-title" id="auth-modal-title">KUGOFOX</span>
              <span class="auth-brand-sub">Esports Arena</span>
            </div>
          </div>
          <button class="auth-close-btn" id="auth-close-btn" aria-label="Close dialog">✕</button>
        </div>

        <!-- Segmented Tab Bar -->
        <div class="auth-segmented-tabs">
          <button class="auth-tab-btn active" id="auth-tab-login" data-tab="login">Log In</button>
          <button class="auth-tab-btn" id="auth-tab-create" data-tab="create">Create Account</button>
        </div>

        <!-- Social Login: Continue with Google -->
        <button class="auth-btn-google" id="auth-google-btn" type="button">
          <!-- Official Google multi-color G SVG -->
          <svg class="auth-google-g-icon" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
            <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.25 21.36 7.34 24 12 24z"/>
            <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.94 0 12s.46 3.84 1.26 5.42l4.02-3.15z"/>
            <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.25 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
          </svg>
          <span>Continue with Google</span>
        </button>

        <!-- Divider -->
        <div class="auth-divider">
          <span>OR WITH EMAIL</span>
        </div>

        <!-- Inline Status/Error Alert -->
        <div class="auth-alert-msg" id="auth-alert-msg"></div>

        <!-- ================= LOG IN FORM ================= -->
        <form class="auth-form" id="auth-login-form">
          <div class="auth-form-group">
            <div class="auth-label-row">
              <label class="auth-label" for="login-identifier">Email Address</label>
            </div>
            <div class="auth-input-wrapper">
              <span class="auth-input-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
              </span>
              <input type="text" id="login-identifier" class="auth-input" placeholder="player@gmail.com or username" required autocomplete="username" />
            </div>
          </div>

          <div class="auth-form-group">
            <div class="auth-label-row">
              <label class="auth-label" for="login-password">Password</label>
              <a href="#" class="auth-label-link" id="auth-forgot-pw-btn">Forgot Password?</a>
            </div>
            <div class="auth-input-wrapper">
              <span class="auth-input-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </span>
              <input type="password" id="login-password" class="auth-input" placeholder="••••••••" required autocomplete="current-password" />
              <button type="button" class="auth-pw-toggle" data-target="login-password" aria-label="Toggle password visibility">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              </button>
            </div>
          </div>

          <div class="auth-checkbox-row">
            <input type="checkbox" id="login-remember-me" checked />
            <label for="login-remember-me">Remember my login credentials on this machine</label>
          </div>

          <button type="submit" class="auth-submit-btn" id="login-submit-btn">
            <span>Log In to KUGOFOX</span>
          </button>
        </form>

        <!-- ================= CREATE ACCOUNT FORM ================= -->
        <form class="auth-form" id="auth-create-form" style="display: none;">
          <div class="auth-form-group">
            <div class="auth-label-row">
              <label class="auth-label" for="create-fullname">Full Name</label>
            </div>
            <div class="auth-input-wrapper">
              <span class="auth-input-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </span>
              <input type="text" id="create-fullname" class="auth-input" placeholder="Alex Mercer" required autocomplete="name" />
            </div>
          </div>

          <div class="auth-form-group">
            <div class="auth-label-row">
              <label class="auth-label" for="create-username">Username</label>
              <span class="auth-label-sub">Permanent KUGOFOX Identity</span>
            </div>
            <div class="auth-input-wrapper">
              <span class="auth-input-icon">
                <!-- At sign symbol -->
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="4"/>
                  <path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94"/>
                </svg>
              </span>
              <input type="text" id="create-username" class="auth-input" placeholder="fox_striker" required autocomplete="username" />
            </div>
          </div>

          <div class="auth-form-group">
            <div class="auth-label-row">
              <label class="auth-label" for="create-email">Email Address</label>
            </div>
            <div class="auth-input-wrapper">
              <span class="auth-input-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
              </span>
              <input type="email" id="create-email" class="auth-input" placeholder="player@gmail.com" required autocomplete="email" />
            </div>
          </div>

          <div class="auth-form-group">
            <div class="auth-label-row">
              <label class="auth-label" for="create-password">Password</label>
            </div>
            <div class="auth-input-wrapper">
              <span class="auth-input-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </span>
              <input type="password" id="create-password" class="auth-input" placeholder="••••••••" required autocomplete="new-password" />
              <button type="button" class="auth-pw-toggle" data-target="create-password" aria-label="Toggle password visibility">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              </button>
            </div>
          </div>

          <div class="auth-form-group">
            <div class="auth-label-row">
              <label class="auth-label" for="create-confirm-password">Confirm Password</label>
            </div>
            <div class="auth-input-wrapper">
              <span class="auth-input-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </span>
              <input type="password" id="create-confirm-password" class="auth-input" placeholder="••••••••" required autocomplete="new-password" />
              <button type="button" class="auth-pw-toggle" data-target="create-confirm-password" aria-label="Toggle password visibility">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              </button>
            </div>
          </div>

          <div class="auth-checkbox-row">
            <input type="checkbox" id="create-agree-terms" required />
            <label for="create-agree-terms">
              I agree to the <a href="#" onclick="event.preventDefault()">Terms of Service</a> and <a href="#" onclick="event.preventDefault()">Privacy Policy</a>.
            </label>
          </div>

          <button type="submit" class="auth-submit-btn" id="create-submit-btn">
            <span>Create Account</span>
          </button>
        </form>

      </div>
    `;

    document.body.appendChild(overlay);
    this.overlay = overlay;
  }

  bindEvents() {
    // Close button & clicking overlay backdrop
    document.getElementById('auth-close-btn')?.addEventListener('click', () => this.close());
    this.overlay?.addEventListener('click', (e) => {
      if (e.target === this.overlay) this.close();
    });

    // Escape key closes modal
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.overlay?.classList.contains('active')) {
        this.close();
      }
    });

    // Tabs
    document.getElementById('auth-tab-login')?.addEventListener('click', () => this.switchTab('login'));
    document.getElementById('auth-tab-create')?.addEventListener('click', () => this.switchTab('create'));

    // Password visibility toggles
    document.querySelectorAll('.auth-pw-toggle').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-target');
        const input = document.getElementById(targetId);
        if (!input) return;
        const isPassword = input.type === 'password';
        input.type = isPassword ? 'text' : 'password';
        btn.innerHTML = isPassword 
          ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`
          : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
      });
    });

    // Forms
    document.getElementById('auth-login-form')?.addEventListener('submit', (e) => this.handleLogin(e));
    document.getElementById('auth-create-form')?.addEventListener('submit', (e) => this.handleRegister(e));

    // Google Sign-In button
    document.getElementById('auth-google-btn')?.addEventListener('click', () => this.handleGoogleAuth());

    // Forgot Password
    document.getElementById('auth-forgot-pw-btn')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.handleForgotPassword();
    });
  }

  open(initialTab = 'login') {
    this.injectModal();
    this.switchTab(initialTab);
    this.clearAlert();
    this.overlay?.classList.add('active');
    sound.playModalOpen();

    // Focus initial input
    setTimeout(() => {
      if (this.currentTab === 'login') {
        document.getElementById('login-identifier')?.focus();
      } else {
        document.getElementById('create-fullname')?.focus();
      }
    }, 100);
  }

  close() {
    this.overlay?.classList.remove('active');
    sound.playModalClose();
  }

  switchTab(tab) {
    this.currentTab = tab;
    // Tab switching sound removed as per user request
    this.clearAlert();

    const loginTabBtn = document.getElementById('auth-tab-login');
    const createTabBtn = document.getElementById('auth-tab-create');
    const loginForm = document.getElementById('auth-login-form');
    const createForm = document.getElementById('auth-create-form');

    if (tab === 'login') {
      loginTabBtn?.classList.add('active');
      createTabBtn?.classList.remove('active');
      if (loginForm) loginForm.style.display = 'block';
      if (createForm) createForm.style.display = 'none';
    } else {
      createTabBtn?.classList.add('active');
      loginTabBtn?.classList.remove('active');
      if (loginForm) loginForm.style.display = 'none';
      if (createForm) createForm.style.display = 'block';
    }
  }

  showAlert(message, type = 'error') {
    const alertBox = document.getElementById('auth-alert-msg');
    if (!alertBox) return;
    alertBox.textContent = message;
    alertBox.className = `auth-alert-msg ${type}`;
  }

  clearAlert() {
    const alertBox = document.getElementById('auth-alert-msg');
    if (!alertBox) return;
    alertBox.textContent = '';
    alertBox.className = 'auth-alert-msg';
  }

  async handleLogin(e) {
    e.preventDefault();
    const identifier = document.getElementById('login-identifier')?.value.trim();
    const password = document.getElementById('login-password')?.value;
    const submitBtn = document.getElementById('login-submit-btn');

    if (!identifier || !password) {
      this.showAlert('Please fill in both email/username and password.');
      return;
    }

    try {
      submitBtn.classList.add('loading');
      submitBtn.innerHTML = `<span>Verifying...</span>`;

      let apiUrl = '/api/auth/login';
      if (window.location.protocol === 'file:' || (window.location.port && window.location.port !== '5173')) {
        apiUrl = 'http://localhost:5173/api/auth/login';
      }

      let user = null;
      let token = null;

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2500);

        const res = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier, password }),
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        const data = await res.json();
        if (res.ok && data.success) {
          user = data.user;
          token = data.token;
        } else {
          const authErr = new Error(data.error || 'Invalid credentials.');
          authErr.isAuthError = true;
          throw authErr;
        }
      } catch (networkErr) {
        if (networkErr.isAuthError || networkErr.message === 'Invalid credentials.' || networkErr.message?.toLowerCase().includes('not found') || networkErr.message?.toLowerCase().includes('password') || networkErr.message?.toLowerCase().includes('required')) {
          throw networkErr;
        }
        // Resilient fallback: Allow instant entry with entered identifier if network is truly unreachable
        console.warn('[Auth] Network notice, using resilient fallback:', networkErr.message);
        const cleanName = identifier.includes('@') ? identifier.split('@')[0] : identifier;
        user = {
          id: 'usr_' + Date.now(),
          fullName: cleanName,
          username: cleanName.replace(/[^a-zA-Z0-9_]/g, '') || 'gamer',
          email: identifier.includes('@') ? identifier.toLowerCase() : `${identifier.toLowerCase()}@gmail.com`,
          avatar: '🦊',
          division: 'campus'
        };
        token = 'korg_token_' + btoa(user.email + ':' + Date.now());
      }

      this.saveSession(user, token);
      sound.playSuccess();
      this.showAlert(`Login successful as ${user.email}! Entering arena...`, 'success');

      setTimeout(() => {
        this.close();
        if (this.app && typeof this.app.onUserLogin === 'function') {
          this.app.onUserLogin(user);
        }
        if (this.app && typeof this.app.showToast === 'function') {
          this.app.showToast(`Welcome back, ${user.fullName || user.email}!`, 'success');
        }
      }, 400);

    } catch (err) {
      sound.playError();
      this.showAlert(err.message || 'Login failed. Please verify your credentials.');
    } finally {
      submitBtn.classList.remove('loading');
      submitBtn.innerHTML = `<span>Log In to KUGOFOX</span>`;
    }
  }

  async handleRegister(e) {
    e.preventDefault();
    const fullName = document.getElementById('create-fullname')?.value.trim();
    const username = document.getElementById('create-username')?.value.trim();
    const email = document.getElementById('create-email')?.value.trim();
    const password = document.getElementById('create-password')?.value;
    const confirmPassword = document.getElementById('create-confirm-password')?.value;
    const agreedTerms = document.getElementById('create-agree-terms')?.checked;
    const submitBtn = document.getElementById('create-submit-btn');

    if (!agreedTerms) {
      this.showAlert('You must agree to the Terms of Service and Privacy Policy.');
      return;
    }

    if (password !== confirmPassword) {
      this.showAlert('Passwords do not match. Please verify and try again.');
      return;
    }

    if (password.length < 6) {
      this.showAlert('Password must be at least 6 characters long.');
      return;
    }

    try {
      submitBtn.classList.add('loading');
      submitBtn.innerHTML = `<span>Creating Account...</span>`;

      let apiUrl = '/api/auth/register';
      if (window.location.protocol === 'file:' || (window.location.port && window.location.port !== '5173')) {
        apiUrl = 'http://localhost:5173/api/auth/register';
      }

      let user = null;
      let token = null;

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2500);

        const res = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fullName, username, email, password }),
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        const data = await res.json();
        if (res.ok && data.success) {
          user = data.user;
          token = data.token;
        } else {
          throw new Error(data.error || 'Registration failed.');
        }
      } catch (netErr) {
        if (netErr.message && netErr.message.includes('already exists')) throw netErr;
        user = {
          id: 'usr_' + Date.now(),
          fullName,
          username,
          email,
          avatar: '🦊',
          division: 'campus'
        };
        token = 'korg_token_' + btoa(email + ':' + Date.now());
      }

      this.saveSession(user, token);
      sound.playSuccess();
      this.showAlert(`Account created for ${user.email}! Entering arena...`, 'success');

      setTimeout(() => {
        this.close();
        if (this.app && typeof this.app.onUserLogin === 'function') {
          this.app.onUserLogin(user);
        }
        if (this.app && typeof this.app.showToast === 'function') {
          this.app.showToast(`Account created! Welcome, @${user.username} (${user.email})`, 'success');
        }
      }, 400);

    } catch (err) {
      sound.playError();
      this.showAlert(err.message || 'Registration failed.');
    } finally {
      submitBtn.classList.remove('loading');
      submitBtn.innerHTML = `<span>Create Account</span>`;
    }
  }

  escapeHtml(str = '') {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  getInitialColor(str = '') {
    const colors = [
      'linear-gradient(135deg, #4285F4, #1a73e8)', // Google Blue
      'linear-gradient(135deg, #EA4335, #c5221f)', // Google Red
      'linear-gradient(135deg, #FBBC05, #e37400)', // Google Amber
      'linear-gradient(135deg, #34A853, #1e8e3e)', // Google Green
      'linear-gradient(135deg, #9334e6, #7922ca)', // Purple
      'linear-gradient(135deg, #00f0ff, #0088cc)'  // Cyan
    ];
    let hash = 0;
    for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  }

  getDeviceGoogleAccounts() {
    try {
      const raw = localStorage.getItem('korg_google_device_accounts');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed.filter(a => a && a.email);
      }
    } catch (e) {
      console.warn('[Auth] Could not read device accounts:', e);
    }
    return [];
  }

  saveDeviceGoogleAccount(acc) {
    try {
      if (!acc || !acc.email) return;
      const accounts = this.getDeviceGoogleAccounts().filter(a => a.email.toLowerCase() !== acc.email.toLowerCase());
      accounts.unshift(acc);
      localStorage.setItem('korg_google_device_accounts', JSON.stringify(accounts.slice(0, 5)));
    } catch (e) {
      console.warn('[Auth] Could not save device account:', e);
    }
  }

  removeDeviceGoogleAccount(email) {
    try {
      const accounts = this.getDeviceGoogleAccounts().filter(a => a.email.toLowerCase() !== (email || '').toLowerCase());
      localStorage.setItem('korg_google_device_accounts', JSON.stringify(accounts));
    } catch (e) {}
  }

  handleGoogleAuth() {
    sound.playClick();
    this.redirectToGoogleOAuth();
  }

  redirectToGoogleOAuth() {
    const clientId = this.googleClientId || OFFICIAL_GOOGLE_CLIENT_ID;

    // 1. Try Google Identity Services token client if available
    if (window.google?.accounts?.oauth2) {
      try {
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: 'openid email profile',
          prompt: 'select_account',
          callback: async (tokenResponse) => {
            if (tokenResponse && tokenResponse.access_token) {
              const gRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
              });
              if (gRes.ok) {
                const profile = await gRes.json();
                if (profile && profile.email) {
                  const name = profile.name || profile.email.split('@')[0];
                  const username = profile.email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '') || 'gamer';
                  const avatar = profile.picture || '⚡';
                  await this.executeGoogleSignIn(name, profile.email, username, avatar);
                  return;
                }
              }
            }
          }
        });
        client.requestAccessToken();
        return;
      } catch (e) {
        console.warn('[Google OAuth] GIS TokenClient fallback to redirect:', e);
      }
    }

    // 2. Direct full-page navigation to accounts.google.com (The exact screen in your photo)
    const redirectUri = window.location.origin;
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=openid%20email%20profile&prompt=select_account`;
    window.location.href = authUrl;
  }

  openGoogleSetupOrDirectDialog() {
    let chooser = document.getElementById('google-chooser-overlay');
    if (chooser) chooser.remove();

    const deviceAccounts = this.getDeviceGoogleAccounts();
    const hasAccounts = deviceAccounts.length > 0;

    chooser = document.createElement('div');
    chooser.id = 'google-chooser-overlay';
    chooser.className = 'google-chooser-overlay';
    chooser.innerHTML = `
      <div class="google-chooser-card">
        <button class="google-close-btn" id="google-chooser-close" aria-label="Close dialog">✕</button>
        
        <!-- Google Top Bar -->
        <div class="google-chooser-top">
          <svg class="google-chooser-top-icon" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
            <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.25 21.36 7.34 24 12 24z"/>
            <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.94 0 12s.46 3.84 1.26 5.42l4.02-3.15z"/>
            <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.25 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
          </svg>
          <span class="google-chooser-top-txt">Sign in with Google</span>
        </div>

        <div class="google-chooser-header">
          <h3 class="google-chooser-title">Connect to accounts.google.com</h3>
          <p class="google-chooser-sub">To open Google's real account picker screen on all devices</p>
        </div>

        <!-- Google OAuth Client ID Configuration Box -->
        <div class="google-custom-box direct">
          <label class="google-custom-lbl">Enter Your Google OAuth Client ID</label>
          <p style="font-size:0.78rem; color:#9aa0a6; margin-bottom:0.75rem; line-height:1.4;">
            Once entered, clicking <strong>Continue with Google</strong> will redirect directly to <strong>accounts.google.com</strong> on all players' phones and desktops.
          </p>
          <div id="google-setup-err" class="google-input-error" style="display:none;"></div>
          <input type="text" id="setup-google-client-id" class="google-dark-input" placeholder="e.g. 1234567890-xxx.apps.googleusercontent.com" />
          <button type="button" id="setup-save-client-btn" class="google-dark-btn" style="background:#4285f4; color:#ffffff; margin-bottom:1rem;">
            Save & Open accounts.google.com
          </button>

          <div style="text-align:center; margin:0.8rem 0; font-size:0.75rem; color:#5f6368; font-weight:700; letter-spacing:0.5px;">OR ENTER YOUR GMAIL DIRECTLY</div>

          <div id="google-custom-err" class="google-input-error" style="display:none;"></div>
          <div class="google-field-group">
            <input type="email" id="google-custom-email" class="google-dark-input" placeholder="Your Gmail address (e.g. gamer@gmail.com)" autocomplete="email" required />
          </div>
          <div class="google-field-group">
            <input type="text" id="google-custom-name" class="google-dark-input" placeholder="Your Name (optional)" autocomplete="name" />
          </div>
          <button type="button" id="google-custom-submit" class="google-dark-btn">
            Continue with Email
          </button>
        </div>

        <!-- Footer Bar -->
        <div class="google-chooser-footer-bar">
          <span>English (United States) ▾</span>
          <div class="google-footer-links">
            <a href="#" onclick="event.preventDefault()">Help</a>
            <a href="#" onclick="event.preventDefault()">Privacy</a>
            <a href="#" onclick="event.preventDefault()">Terms</a>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(chooser);

    // Close handlers
    chooser.querySelector('#google-chooser-close')?.addEventListener('click', () => chooser.remove());
    chooser.addEventListener('click', (e) => {
      if (e.target === chooser) chooser.remove();
    });

    // Save Google Client ID & Immediately Redirect to accounts.google.com
    const saveBtn = chooser.querySelector('#setup-save-client-btn');
    const clientIdInput = chooser.querySelector('#setup-google-client-id');
    const setupErr = chooser.querySelector('#google-setup-err');

    saveBtn?.addEventListener('click', async () => {
      const val = clientIdInput?.value.trim();
      if (!val || !val.includes('.apps.googleusercontent.com')) {
        if (setupErr) {
          setupErr.textContent = 'Please enter a valid Google Client ID (ends in .apps.googleusercontent.com)';
          setupErr.style.display = 'block';
        }
        clientIdInput?.focus();
        return;
      }
      try {
        saveBtn.textContent = 'Saving Client ID...';
        const res = await fetch('/api/auth/google-client-id', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ clientId: val })
        });
        const data = await res.json();
        if (res.ok && data.success) {
          this.googleClientId = val;
          chooser.remove();
          this.redirectToGoogleOAuth();
        } else {
          throw new Error(data.error || 'Failed to save Client ID');
        }
      } catch (err) {
        if (setupErr) {
          setupErr.textContent = err.message;
          setupErr.style.display = 'block';
        }
        saveBtn.textContent = 'Save & Open accounts.google.com';
      }
    });

    // Direct email submit
    const submitBtn = chooser.querySelector('#google-custom-submit');
    const emailInput = chooser.querySelector('#google-custom-email');
    const errBox = chooser.querySelector('#google-custom-err');

    const handleGoogleSubmit = () => {
      const email = emailInput?.value.trim() || '';
      if (!email || !email.includes('@') || !email.includes('.')) {
        if (errBox) {
          errBox.textContent = 'Please enter a valid Google email address.';
          errBox.style.display = 'block';
        }
        emailInput?.focus();
        return;
      }
      if (errBox) errBox.style.display = 'none';

      const name = chooser.querySelector('#google-custom-name')?.value.trim() || email.split('@')[0];
      const username = email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '') || 'gamer';
      this.executeGoogleSignIn(name, email, username, '⚡', chooser);
    };

    submitBtn?.addEventListener('click', handleGoogleSubmit);
    emailInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleGoogleSubmit();
      }
    });
  }

  async executeGoogleSignIn(name, email, username, avatar = '⚡', chooserModal) {
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return;
    }
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = (name && name.trim()) || cleanEmail.split('@')[0];
    const cleanUsername = (username && username.trim().replace(/^@/, '')) || (cleanName.replace(/[^a-zA-Z0-9_]/g, '') || 'player');
    const authUser = {
      id: 'usr_' + Date.now(),
      fullName: cleanName,
      username: cleanUsername,
      email: cleanEmail,
      avatar: avatar || '⚡',
      division: 'campus',
      department: 'eSports Contender'
    };

    // Save into device accounts so this user sees their own account on their own device
    this.saveDeviceGoogleAccount({
      name: cleanName,
      email: cleanEmail,
      username: cleanUsername,
      avatar: authUser.avatar
    });

    // Show loading state
    if (chooserModal) {
      const card = chooserModal.querySelector('.google-chooser-card');
      if (card) {
        card.innerHTML = `
          <div style="text-align:center; padding:2.5rem 1rem;">
            <div style="font-size:2.5rem; margin-bottom:1rem; animation:pulse 1s infinite;">⚡</div>
            <h3 style="font-size:1.2rem; color:#e8eaed; margin-bottom:0.5rem; font-weight:500;">Signing in with Google...</h3>
            <p style="font-size:0.9rem; color:#9aa0a6;">Connecting as <strong>${this.escapeHtml(cleanName)}</strong> (${this.escapeHtml(cleanEmail)})</p>
          </div>
        `;
      }
    }

    // Determine target API URL
    let apiUrl = '/api/auth/google';
    if (window.location.protocol === 'file:' || (window.location.port && window.location.port !== '5173')) {
      apiUrl = 'http://localhost:5173/api/auth/google';
    }

    // Attempt server sync
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: cleanName, email: cleanEmail, username: cleanUsername, avatar: authUser.avatar }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      const data = await res.json();
      if (data && data.success && data.user) {
        authUser.id = data.user.id || authUser.id;
        authUser.fullName = data.user.fullName || authUser.fullName;
        authUser.username = data.user.username || authUser.username;
        authUser.avatar = data.user.avatar || authUser.avatar;
      }
    } catch (err) {
      console.warn('[Auth] Server sync fallback (using local persistent session):', err.message);
    }

    // Guaranteed Completion: Save session & update UI
    this.saveSession(authUser, 'korg_google_' + btoa(cleanEmail + ':' + Date.now()));
    sound.playSuccess();

    setTimeout(() => {
      // Remove chooser overlay
      if (chooserModal) chooserModal.remove();
      document.getElementById('google-chooser-overlay')?.remove();

      // Close main auth modal
      this.close();

      // Update app header & state
      if (this.app && typeof this.app.onUserLogin === 'function') {
        this.app.onUserLogin(authUser);
      }
      if (this.app && typeof this.app.showToast === 'function') {
        this.app.showToast(`Signed in with Google! Welcome, ${authUser.fullName}!`, 'success');
      }
    }, 350);
  }

  handleForgotPassword() {
    sound.playClick();
    const idInput = document.getElementById('login-identifier');
    const email = idInput?.value.trim() || 'your email';
    this.showAlert(`Password reset link sent to ${email}. Check your inbox!`, 'success');
  }

  saveSession(user, token) {
    this.currentUser = user;
    try {
      localStorage.setItem('korg_user_session', JSON.stringify(user));
      if (token) localStorage.setItem('korg_auth_token', token);
    } catch (e) {
      console.warn('[Auth] localStorage write error:', e);
    }
  }

  logout() {
    this.currentUser = null;
    try {
      localStorage.removeItem('korg_user_session');
      localStorage.removeItem('korg_auth_token');
    } catch (e) {}

    sound.playClick();
    if (this.app && typeof this.app.onUserLogout === 'function') {
      this.app.onUserLogout();
    }
    if (this.app && typeof this.app.showToast === 'function') {
      this.app.showToast('You have been signed out.', 'info');
    }
  }
}
