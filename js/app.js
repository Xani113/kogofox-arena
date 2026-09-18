/**
 * Kugofox Gaming Arena - Main Application Orchestrator
 * Clean, streamlined eSports platform with stadium aesthetic
 * Replicating Photo 1 (Home Stage) & Photo 2 (3D Coverflow Gallery)
 */

import { sound } from './modules/soundEngine.js?v=2.4.0';
import { GAMES_DATA } from './data/gamesData.js?v=2.4.0';
import { CoverflowGallery } from './modules/coverflow.js?v=2.4.0';
import { RegistrationModal } from './modules/registrationModal.js?v=2.4.0';
import { StreamHud } from './modules/streamHud.js?v=2.4.0';
import { MiniGameManager } from './modules/minigames.js?v=2.4.0';
import { LeaderboardManager } from './modules/leaderboard.js?v=2.4.0';
import { CyberHeadphoneController } from './modules/cyberHeadphone.js?v=2.4.0';
import { AuthModal } from './modules/authModal.js?v=2.4.0';
import { PixelStarsEngine } from './modules/pixelStars.js?v=2.5.0';
import { TournamentSystem } from './modules/tournamentSystem.js?v=2.4.0';
import { initViewController, switchView } from './modules/viewController.js?v=2.5.0';
import { initSquadsManager } from './modules/squadsManager.js?v=2.5.0';
import { initEventsManager } from './modules/eventsManager.js?v=2.5.0';
import { initLeaderboard } from './modules/leaderboard.js?v=2.5.0';
import { initAdminPanel } from './modules/adminPanel.js?v=2.5.0';
import { initGamesManager } from './modules/gamesManager.js?v=2.5.0';

class KugofoxApp {
  constructor() {
    this.sound = sound;
    this.activeGame = 'freefire'; // Default to 1st title Free Fire
    this.activeSection = 'hero';
    
    this.coverflow = new CoverflowGallery(this);
    this.regModal = new RegistrationModal(this);
    this.authModal = new AuthModal(this);
    this.streamHud = new StreamHud(this);
    this.tournaments = new TournamentSystem(this);
    this.minigames = new MiniGameManager(this);
    this.leaderboard = new LeaderboardManager(this);
    this.headphone = new CyberHeadphoneController(this);
    this.currentUser = null;
  }

  init() {
    this.initCanvasGrid();
    this.initNavigation();
    this.initSidebarGames();
    this.initHeroButtons();
    this.renderGameHub();

    // Init 3D Interactive Cyberpunk Headphone
    this.headphone.init('hero-headphone-col');

    // Init 3D Coverflow Gallery (Photo 2)
    this.coverflow.init('coverflow-gallery-mount');

    // Init Registration Modal with Axios IGN verification
    this.regModal.init();

    // Init KORG Sign In & Create Account Modal
    this.authModal.init();

    // Init core submodules
    if (document.getElementById('stream-hud-container')) {
      this.streamHud.init('stream-hud-container');
    }
    if (document.getElementById('tournaments-hub-container')) {
      this.tournaments.init('tournaments-hub-container');
    }

    // Init Dedicated View Modules (Screenshots 1-5 & Admin Panel)
    initViewController();
    initGamesManager();
    initSquadsManager();
    initEventsManager();
    initLeaderboard('view-leaderboard');
    initAdminPanel();

    // Init tactical simulators (4 Titles)
    this.minigames.initReflexTrainer('valorant-reflex-container');
    this.minigames.initBgmiDropLab('bgmi-drop-container');
    this.minigames.initMobaDraftSim('moba-draft-container');
    this.renderFreeFireSynergy('freefire-synergy-container');

    // Enable sound on first interaction
    const handleFirstTouch = () => {
      sound.init();
      window.removeEventListener('click', handleFirstTouch);
    };
    window.addEventListener('click', handleFirstTouch);
  }

  showToast(msg, type = 'info') {
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) return;

    const toast = document.createElement('div');
    toast.className = `cyber-toast toast-${type}`;
    toast.innerHTML = `<img src="assets/kugofox_logo.png" alt="Kugofox" class="toast-brand-icon"> <span>${msg}</span>`;
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('fade-out');
      setTimeout(() => toast.remove(), 400);
    }, 3000);
  }

  initCanvasGrid() {
    this.pixelStars = new PixelStarsEngine('bg-cyber-canvas');
  }

  initNavigation() {
    // Top Nav Pills
    const topPills = document.querySelectorAll('.korg-nav-pill');
    topPills.forEach(pill => {
      pill.addEventListener('click', (e) => {
        e.preventDefault();
        sound.playTabSwitch();
        const target = pill.getAttribute('data-view-target') || pill.dataset.nav;
        if (target) switchView(target);
      });
    });

    // Sidebar Menu Items
    const sidebarItems = document.querySelectorAll('.sidebar-menu-item');
    sidebarItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        sound.playTabSwitch();
        const target = item.getAttribute('data-view-target') || item.dataset.target;
        if (target) switchView(target);
      });
    });

    // Brand logo home click
    const brandBtn = document.getElementById('brand-home-btn');
    brandBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      switchView('home');
    });

    // Header Action Buttons
    document.getElementById('find-team-btn')?.addEventListener('click', (e) => {
      e.preventDefault();
      sound.playClick();
      switchView('squads');
    });

    document.getElementById('notification-btn')?.addEventListener('click', () => {
      sound.playClick();
      this.showToast('Championship Update: Free Fire Grand Finals start in 45m', 'info');
    });

    document.getElementById('sign-in-btn')?.addEventListener('click', () => {
      sound.playClick();
      this.authModal.open('login');
    });
  }

  onUserLogin(user) {
    this.currentUser = user;
    this.renderHeaderUserChip(user);
  }

  onUserLogout() {
    this.currentUser = null;
    this.renderHeaderSignInButton();
  }

  renderHeaderUserChip(user) {
    const signInBtn = document.getElementById('sign-in-btn');
    const existingChip = document.getElementById('header-user-wrapper');
    const target = signInBtn || existingChip;
    if (!target) return;

    const parent = target.parentElement;
    let chipWrap = existingChip;
    if (!chipWrap) {
      chipWrap = document.createElement('div');
      chipWrap.id = 'header-user-wrapper';
      chipWrap.className = 'header-user-wrapper';
      parent.replaceChild(chipWrap, target);
    }

    const isUrl = typeof user.avatar === 'string' && (user.avatar.startsWith('http://') || user.avatar.startsWith('https://') || user.avatar.startsWith('data:'));
    const avatarHtml = isUrl
      ? `<img src="${user.avatar}" alt="${user.username}" class="user-chip-avatar-img" referrerpolicy="no-referrer" onerror="this.onerror=null;this.parentElement.textContent='🦊';" />`
      : `${user.avatar || '🦊'}`;

    chipWrap.innerHTML = `
      <div class="header-user-chip" id="header-user-chip" title="Player Profile: ${user.fullName || user.username}">
        <div class="user-chip-avatar">${avatarHtml}</div>
        <span class="user-chip-name">@${user.username}</span>
      </div>
      <div class="header-user-dropdown" id="header-user-dropdown">
        <div class="user-dropdown-header">
          <div class="dropdown-user-fullname">${user.fullName || user.username}</div>
          <div class="dropdown-user-email">${user.email}</div>
        </div>
        <button class="user-dropdown-item" id="user-dd-register-btn">
          <span>🏆</span> Tournament Hub
        </button>
        <button class="user-dropdown-item logout" id="user-dd-logout-btn">
          <span>🚪</span> Sign Out
        </button>
      </div>
    `;

    const chip = chipWrap.querySelector('#header-user-chip');
    const dropdown = chipWrap.querySelector('#header-user-dropdown');

    chip?.addEventListener('click', (e) => {
      e.stopPropagation();
      sound.playClick();
      dropdown?.classList.toggle('active');
    });

    document.addEventListener('click', (e) => {
      if (!chipWrap.contains(e.target)) {
        dropdown?.classList.remove('active');
      }
    });

    chipWrap.querySelector('#user-dd-register-btn')?.addEventListener('click', () => {
      dropdown?.classList.remove('active');
      sound.playClick();
      this.regModal.open(this.activeGame);
    });

    chipWrap.querySelector('#user-dd-logout-btn')?.addEventListener('click', () => {
      dropdown?.classList.remove('active');
      this.authModal.logout();
    });
  }

  renderHeaderSignInButton() {
    const chipWrap = document.getElementById('header-user-wrapper');
    if (!chipWrap) return;

    const parent = chipWrap.parentElement;
    const btn = document.createElement('button');
    btn.className = 'btn-sign-in';
    btn.id = 'sign-in-btn';
    btn.textContent = 'SIGN IN';
    btn.addEventListener('click', () => {
      sound.playClick();
      this.authModal.open('login');
    });

    parent.replaceChild(btn, chipWrap);
  }

  scrollToTarget(target) {
    if (['home', 'games', 'squads', 'events', 'leaderboard', 'admin'].includes(target)) {
      switchView(target);
      return;
    }
    if (target === 'findteam') {
      switchView('squads');
      return;
    }
    const el = document.getElementById(`section-${target}`) || document.getElementById(target);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  initSidebarGames() {
    const gameRows = document.querySelectorAll('.sb-game-row');
    gameRows.forEach(row => {
      row.addEventListener('click', () => {
        sound.playClick();
        const gameId = row.dataset.game;
        this.setGameFilter(gameId, true);
        
        // Scroll to Coverflow gallery
        const gallerySec = document.getElementById('section-gallery');
        gallerySec?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    });

    document.getElementById('sb-view-all-btn')?.addEventListener('click', () => {
      this.setGameFilter('all', false);
      document.getElementById('section-gallery')?.scrollIntoView({ behavior: 'smooth' });
    });
  }

  initHeroButtons() {
    const enterBtn = document.getElementById('hero-enter-arena-btn');
    const exploreBtn = document.getElementById('hero-explore-scrims-btn');

    enterBtn?.addEventListener('click', () => {
      sound.playClick();
      switchView('events');
    });

    exploreBtn?.addEventListener('click', () => {
      sound.playClick();
      switchView('events');
    });
  }

  setGameFilter(gameId, updateCoverflow = true) {
    this.activeGame = gameId;
    document.body.setAttribute('data-theme', gameId);

    // Sync sidebar rows
    const gameRows = document.querySelectorAll('.sb-game-row');
    gameRows.forEach(row => {
      row.classList.toggle('active', row.dataset.game === gameId);
    });

    // Sync coverflow if requested
    if (updateCoverflow && this.coverflow) {
      const idx = this.coverflow.games.indexOf(gameId);
      if (idx !== -1) {
        this.coverflow.goTo(idx);
      }
    }

    // Sync stream broadcast channel
    if (gameId !== 'all' && this.streamHud) {
      this.streamHud.setChannel(gameId);
    }

    this.renderGameHub();
  }

  renderGameHub() {
    const hubGrid = document.getElementById('games-showcase-grid');
    if (!hubGrid) return;

    const gameKeys = this.activeGame === 'all' 
      ? Object.keys(GAMES_DATA) 
      : [this.activeGame, ...Object.keys(GAMES_DATA).filter(k => k !== this.activeGame)];

    hubGrid.innerHTML = gameKeys.map(key => {
      const g = GAMES_DATA[key];
      return `
        <div class="game-arena-card theme-${g.id}">
          <div class="card-head">
            <span class="game-badge-pill">${g.badge}</span>
            <span class="game-prize-pill">Prize Pool: ${g.prizePool}</span>
          </div>

          <div class="card-body">
            <div class="card-game-logo-wrapper">
              <img src="${g.logo}" alt="${g.name} Logo" class="card-game-logo-img">
            </div>
            <h3 class="game-title">${g.name}</h3>
            <p class="game-tagline">${g.tagline}</p>
            <p class="game-desc">${g.description}</p>

            <div class="card-features-list">
              ${g.features.map(f => `
                <div class="c-feat">
                  <span class="feat-dot"></span>
                  <strong>${f.title}:</strong> ${f.desc}
                </div>
              `).join('')}
            </div>
          </div>

          <div class="card-footer">
            <button class="btn-kugofox btn-enter-game" data-game="${g.id}">
              Launch ${g.name} Drill ➔
            </button>
          </div>
        </div>
      `;
    }).join('');

    hubGrid.querySelectorAll('.btn-enter-game').forEach(btn => {
      btn.addEventListener('click', () => {
        sound.playClick();
        const gid = btn.dataset.game;
        const minigameSec = document.getElementById('section-minigames');
        if (minigameSec) {
          minigameSec.scrollIntoView({ behavior: 'smooth' });
        }
        const tabBtn = document.querySelector(`.mg-tab[data-mg="${gid}"]`);
        if (tabBtn) tabBtn.click();
      });
    });
  }

  renderFreeFireSynergy(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const chars = GAMES_DATA.freefire.characters;
    container.innerHTML = `
      <div class="ff-synergy-box">
        <div class="ff-header">
          <div>
            <h4 class="title-glow">🔥 Clash Squad 4v4 Synergy Lab</h4>
            <p class="subtitle">Select character abilities to evaluate Rusher & Defense combinations.</p>
          </div>
        </div>

        <div class="chars-grid">
          ${chars.map((c, idx) => `
            <div class="ff-char-card ${idx === 0 ? 'selected-char' : ''}" data-char="${c.name}">
              <div class="char-role-badge">${c.role}</div>
              <h4 class="char-name">${c.name}</h4>
              <div class="char-skill">${c.skill} <span class="skill-type">(${c.type})</span></div>
              <p class="char-effect">${c.effect}</p>
            </div>
          `).join('')}
        </div>

        <div class="synergy-status-bar">
          <div class="syn-metric">
            <span>Sprint Rush:</span> <strong class="text-neon">+21% Speed</strong>
          </div>
          <div class="syn-metric">
            <span>Armor Penetration:</span> <strong class="text-magenta">Lethal Bushido Level 4</strong>
          </div>
          <div class="syn-metric">
            <span>Revival Pulse:</span> <strong class="text-success">Self-Revive Zone Active</strong>
          </div>
          <button id="ff-test-squad-btn" class="btn-kugofox">Test Clash Squad Simulation</button>
        </div>
        <div id="ff-test-results" class="deck-sim-results" style="display:none;"></div>
      </div>
    `;

    const testBtn = container.querySelector('#ff-test-squad-btn');
    const results = container.querySelector('#ff-test-results');

    testBtn.addEventListener('click', () => {
      sound.playVictory();
      results.style.display = 'block';
      results.innerHTML = `
        <div class="sim-banner">
          <h5>🔥 Clash Squad Round 7 Decider - BOOYAH!</h5>
          <div class="match-score-display">
            <span class="crown-badge">🔥 4 - 2</span> <span class="badge-win">BOOYAH!</span>
          </div>
          <p class="sim-analysis">
            Drop the Beat aura allowed your 4-stack to overwhelm Factory stairs before enemy gloo walls could deploy.
          </p>
        </div>
      `;
      this.showToast('Clash Squad Round 7 Simulation: BOOYAH!', 'success');
    });
  }
}

function bootApp() {
  if (window.kugofox) return;
  const app = new KugofoxApp();
  app.init();
  window.kugofox = app;
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootApp);
} else {
  bootApp();
}
