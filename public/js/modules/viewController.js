/**
 * viewController.js
 * Centralized View Switcher & Hash Router for Kugofox Arena
 * Manages views: home, games, squads, events, leaderboard, admin
 */

const VIEWS = ['home', 'games', 'squads', 'events', 'leaderboard', 'admin'];
let currentView = 'home';

export function initViewController() {
  // Bind all navigation links and pills
  document.querySelectorAll('[data-view-target]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      const target = el.getAttribute('data-view-target');
      if (target) switchView(target);
    });
  });

  // Handle hash changes for direct linking (e.g. #squads, #events, #leaderboard, #admin)
  window.addEventListener('hashchange', () => {
    const hash = window.location.hash.replace('#', '').toLowerCase();
    if (VIEWS.includes(hash)) {
      switchView(hash, false);
    }
  });

  // Initial load from URL hash if present
  const initialHash = window.location.hash.replace('#', '').toLowerCase();
  if (VIEWS.includes(initialHash)) {
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

export function switchView(viewName, updateHash = true) {
  if (!VIEWS.includes(viewName)) return;

  currentView = viewName;

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
  document.querySelectorAll('.korg-nav-pill, [data-view-target]').forEach(el => {
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

  // 4. Update hash in browser URL bar
  if (updateHash) {
    window.location.hash = viewName;
  }

  // Scroll to top of main view container smoothly
  const mainStage = document.getElementById('korg-main-stage') || window;
  if (mainStage.scrollTo) {
    mainStage.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Dispatch view change event so modules can reload or refresh their data
  window.dispatchEvent(new CustomEvent('korg:viewChanged', { detail: { view: viewName } }));
}

export function getCurrentView() {
  return currentView;
}
