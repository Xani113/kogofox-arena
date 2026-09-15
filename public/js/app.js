/**
 * Kugofox Gaming Arena - Main Application Orchestrator
 * Clean, streamlined eSports platform with stadium aesthetic
 * Replicating Photo 1 (Home Stage) & Photo 2 (3D Coverflow Gallery)
 */

import { sound } from './modules/soundEngine.js';
import { GAMES_DATA } from './data/gamesData.js';
import { CoverflowGallery } from './modules/coverflow.js';
import { RegistrationModal } from './modules/registrationModal.js';
import { StreamHud } from './modules/streamHud.js';
import { MiniGameManager } from './modules/minigames.js';
import { LeaderboardManager } from './modules/leaderboard.js';
import { CyberHeadphoneController } from './modules/cyberHeadphone.js';
import { AuthModal } from './modules/authModal.js';

class KugofoxApp {
  constructor() {
    this.sound = sound;
    this.activeGame = 'freefire'; // Default to 1st title Free Fire
    this.activeSection = 'hero';
    
    this.coverflow = new CoverflowGallery(this);
    this.regModal = new RegistrationModal(this);
    this.authModal = new AuthModal(this);
    this.streamHud = new StreamHud(this);
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
    this.streamHud.init('stream-hud-container');
    this.leaderboard.init('leaderboard-container');

    // Init tactical simulators
    this.minigames.initReflexTrainer('valorant-reflex-container');
    this.minigames.initClashDeckBuilder('clash-deck-container');
    this.minigames.initMobaDraftSim('moba-draft-container');
    this.minigames.initPubgDropRoulette('pubg-drop-container');
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
    const canvas = document.getElementById('bg-cyber-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    window.addEventListener('resize', () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    });

    const particles = [];
    const count = 45;
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        size: Math.random() * 2 + 0.8,
        color: i % 3 === 0 ? 'rgba(0, 240, 255, 0.5)' : (i % 3 === 1 ? 'rgba(255, 42, 133, 0.45)' : 'rgba(255, 255, 255, 0.6)')
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < count; i++) {
        const p1 = particles[i];
        p1.x += p1.vx;
        p1.y += p1.vy;

        if (p1.x < 0 || p1.x > width) p1.vx *= -1;
        if (p1.y < 0 || p1.y > height) p1.vy *= -1;

        ctx.fillStyle = p1.color;
        ctx.beginPath();
        ctx.arc(p1.x, p1.y, p1.size, 0, Math.PI * 2);
        ctx.fill();

        for (let j = i + 1; j < count; j++) {
          const p2 = particles[j];
          const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
          if (dist < 110) {
            ctx.strokeStyle = `rgba(0, 240, 255, ${0.1 * (1 - dist / 110)})`;
            ctx.lineWidth = 0.65;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      }

      requestAnimationFrame(animate);
    };

    animate();
  }

  initNavigation() {
    // Top Nav Pills
    const topPills = document.querySelectorAll('.korg-nav-pill');
    topPills.forEach(pill => {
      pill.addEventListener('click', () => {
        sound.playTabSwitch();
        topPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');

        const navType = pill.dataset.nav;
        this.scrollToTarget(navType);
      });
    });

    // Sidebar Menu Items
    const sidebarItems = document.querySelectorAll('.sidebar-menu-item');
    sidebarItems.forEach(item => {
      item.addEventListener('click', () => {
        sound.playTabSwitch();
        sidebarItems.forEach(i => i.classList.remove('active'));
        item.classList.add('active');

        const target = item.dataset.target;
        this.scrollToTarget(target);
      });
    });

    // Brand logo home click
    const brandBtn = document.getElementById('brand-home-btn');
    brandBtn?.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // Header Action Buttons
    document.getElementById('find-team-btn')?.addEventListener('click', () => {
      sound.playClick();
      this.regModal.open(this.activeGame);
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

    chipWrap.innerHTML = `
      <div class="header-user-chip" id="header-user-chip" title="Player Profile: ${user.fullName || user.username}">
        <div class="user-chip-avatar">${user.avatar || '🦊'}</div>
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
    let el = null;
    switch (target) {
      case 'home':
        el = document.getElementById('section-hero');
        break;
      case 'games':
        el = document.getElementById('section-gallery');
        break;
      case 'community':
        el = document.getElementById('section-broadcast');
        break;
      case 'squads':
      case 'findteam':
        el = document.getElementById('section-minigames');
        break;
      case 'events':
        el = document.getElementById('section-gallery');
        break;
      case 'leaderboard':
        el = document.getElementById('section-leaderboard');
        break;
      default:
        el = document.getElementById(`section-${target}`);
    }

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
      document.getElementById('section-games')?.scrollIntoView({ behavior: 'smooth' });
    });
  }

  initHeroButtons() {
    const enterBtn = document.getElementById('hero-enter-arena-btn');
    const exploreBtn = document.getElementById('hero-explore-scrims-btn');

    enterBtn?.addEventListener('click', () => {
      sound.playClick();
      document.getElementById('section-gallery')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });

    exploreBtn?.addEventListener('click', () => {
      sound.playClick();
      this.regModal.open(this.activeGame);
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

document.addEventListener('DOMContentLoaded', () => {
  const app = new KugofoxApp();
  app.init();
  window.kugofox = app;
});
