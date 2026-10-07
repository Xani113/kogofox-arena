/**
 * viewController.js
 * Centralized View Switcher & Hash Router for Kugofox Arena
 * Manages views: home, games, squads, events, leaderboard, admin
 */

const VIEWS = ['home', 'games', 'squads', 'events', 'leaderboard', 'admin'];
let currentView = 'home';

export function toggleMobileMenu(force = null) {
  const sidebar = document.getElementById('kugofox-sidebar');
  const backdrop = document.getElementById('mobile-menu-backdrop');
  const btn = document.getElementById('mobile-menu-btn');
  if (!sidebar || !backdrop) return;

  const shouldOpen = force !== null ? force : !sidebar.classList.contains('mobile-open');

  if (shouldOpen) {
    sidebar.classList.add('mobile-open');
    backdrop.classList.add('active');
    btn?.classList.add('open');
    document.body.classList.add('mobile-menu-locked');
  } else {
    sidebar.classList.remove('mobile-open');
    backdrop.classList.remove('active');
    btn?.classList.remove('open');
    document.body.classList.remove('mobile-menu-locked');
  }
}

export function initViewController() {
  // Bind all navigation links and pills
  document.querySelectorAll('[data-view-target]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      const target = el.getAttribute('data-view-target');
      if (target) switchView(target);
    });
  });

  // Mobile drawer toggle and close buttons
  const mobileBtn = document.getElementById('mobile-menu-btn');
  if (mobileBtn) {
    mobileBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggleMobileMenu();
    });
  }

  const closeBtn = document.getElementById('sidebar-close-btn');
  if (closeBtn) {
    closeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggleMobileMenu(false);
    });
  }

  const backdrop = document.getElementById('mobile-menu-backdrop');
  if (backdrop) {
    backdrop.addEventListener('click', () => {
      toggleMobileMenu(false);
    });
  }

  // Close drawer on ESC key
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      toggleMobileMenu(false);
    }
  });

  // Auth hash handler for #login and #signup
  const handleAuthHash = (hash) => {
    if (hash === 'login') {
      setTimeout(() => {
        window.kugofoxApp?.authModal?.open('login');
      }, 80);
      return true;
    }
    if (hash === 'signup' || hash === 'create-account' || hash === 'register-account') {
      setTimeout(() => {
        window.kugofoxApp?.authModal?.open('create');
      }, 80);
      return true;
    }
    return false;
  };

  // Handle hash changes for direct linking (e.g. #squads, #events, #leaderboard, #admin, #login, #signup)
  window.addEventListener('hashchange', () => {
    const hash = window.location.hash.replace('#', '').toLowerCase();
    if (handleAuthHash(hash)) return;
    if (VIEWS.includes(hash) && currentView !== hash) {
      switchView(hash, false);
    }
  });

  // Initial load from URL hash if present
  const initialHash = window.location.hash.replace('#', '').toLowerCase();
  if (handleAuthHash(initialHash)) {
    switchView('home', false);
  } else if (VIEWS.includes(initialHash)) {
    switchView(initialHash, false);
  } else {
    switchView('home', false);
  }

  // Ticker button event
  const tickerBtn = document.getElementById('ticker-cta-btn');
  if (tickerBtn) {
    tickerBtn.addEventListener('click', () => {
      switchView('events');
    });
  }
}

const VIEW_METADATA = {
  home: {
    title: 'KUGOFOX Arena | Esports Arena & Campus Tournaments',
    desc: 'Compete in verified campus esports scrims and tournaments for Free Fire, BGMI, Valorant, and MOBA Legends on KUGOFOX Arena.'
  },
  games: {
    title: 'Campus Games Directory | KUGOFOX Arena',
    desc: 'Browse supported collegiate gaming titles including BGMI, Free Fire, Valorant, and MOBA Legends on KUGOFOX Arena.'
  },
  squads: {
    title: 'Squads & LFG Player Finder | KUGOFOX Arena',
    desc: 'Recruit teammates, join verified campus squads, and build competitive rosters for collegiate tournaments.'
  },
  events: {
    title: 'Campus Tournaments & Scrims | KUGOFOX Arena',
    desc: 'Register for scheduled campus scrims, live championship matches, and competitive esports brackets with verified prize pools.'
  },
  leaderboard: {
    title: 'Competitive Standings & Leaderboard | KUGOFOX Arena',
    desc: 'Track collegiate rankings, Combat Points (CP), win streaks, and season standings across all competitive titles.'
  },
  admin: {
    title: 'Admin Control Panel | KUGOFOX Arena',
    desc: 'Authorized tournament marshal portal for event scheduling, scorekeeping, and Combat Points allocation.'
  }
};

export function switchView(viewName, updateHash = true, extra = null) {
  if (!VIEWS.includes(viewName)) return;

  currentView = viewName;

  // Update dynamic page title and meta description
  const meta = VIEW_METADATA[viewName] || VIEW_METADATA.home;
  document.title = meta.title;
  const metaDescEl = document.querySelector('meta[name="description"]');
  if (metaDescEl) {
    metaDescEl.setAttribute('content', meta.desc);
  }

  // 1. Toggle view containers
  VIEWS.forEach(v => {
    const el = document.getElementById(`view-${v}`);
    if (el) {
      if (v === viewName) {
        el.classList.add('active');
      } else {
        el.classList.remove('active');
      }
    }
  });

  // 2. Sync Top Navigation Bar items
  document.querySelectorAll('.kugofox-nav-pill, [data-view-target]').forEach(el => {
    const target = el.getAttribute('data-view-target');
    if (target === viewName) {
      el.classList.add('active');
    } else if (target) {
      el.classList.remove('active');
    }
  });

  // 3. Sync Sidebar menu items
  document.querySelectorAll('.sidebar-menu-item').forEach(el => {
    const target = el.getAttribute('data-view-target');
    if (target === viewName) {
      el.classList.add('active');
    } else if (target) {
      el.classList.remove('active');
    }
  });

  // Automatically close mobile menu when navigating
  toggleMobileMenu(false);

  // 4. Update hash in browser URL bar
  if (updateHash && window.location.hash !== '#' + viewName) {
    window.location.hash = viewName;
  }

  // Universal scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (document.documentElement) document.documentElement.scrollTop = 0;
  if (document.body) document.body.scrollTop = 0;
  const mainArea = document.getElementById('kugofox-main-area');
  if (mainArea) mainArea.scrollTop = 0;
  const targetViewEl = document.getElementById(`view-${viewName}`);
  if (targetViewEl) {
    try {
      targetViewEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (e) {}
  }

  // Dispatch view change event with optional extra details
  window.dispatchEvent(new CustomEvent('kugofox:viewChanged', { detail: { view: viewName, ...(extra || {}) } }));
}

// Ensure switchView is globally available
if (typeof window !== 'undefined') {
  window.switchView = switchView;
}

export function getCurrentView() {
  return currentView;
}
