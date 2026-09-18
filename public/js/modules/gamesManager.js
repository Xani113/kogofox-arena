/**
 * gamesManager.js
 * Campus Games Directory
 * Matches Screenshot 3: Search bar, Games Grid with tags and OPEN -> action
 */

import { switchView } from './viewController.js';

const CAMPUS_GAMES = [
  {
    id: 'freefire',
    title: 'FREE FIRE',
    genre: 'BATTLE ROYALE',
    platform: 'Mobile / Campus Scrims',
    banner: 'assets/logos/freefire.png',
    bg: 'linear-gradient(135deg, #f97316 0%, #b91c1c 100%)',
    description: 'Fast-paced 48-player battle royale with Bermuda and Purgatory custom room scrims.',
    activeTourneys: 2,
    activeSquads: 5
  },
  {
    id: 'bgmi',
    title: 'BGMI / PUBG MOBILE',
    genre: 'BATTLE ROYALE',
    platform: 'Mobile / iPad',
    banner: 'assets/logos/bgmi.png',
    bg: 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)',
    description: 'Classic 100-player Erangel tactical survival with point multiplier scoring.',
    activeTourneys: 1,
    activeSquads: 2
  },
  {
    id: 'valorant',
    title: 'VALORANT',
    genre: 'TACTICAL FPS',
    platform: 'PC / Collegiate LAN',
    banner: 'assets/logos/valorant.png',
    bg: 'linear-gradient(135deg, #ff4655 0%, #0f1923 100%)',
    description: '5v5 character-based tactical shooter. Precise gunplay meets unique agent abilities.',
    activeTourneys: 1,
    activeSquads: 1
  },
  {
    id: 'mobalegends',
    title: 'MOBILE LEGENDS: BANG BANG',
    genre: '5V5 MOBA',
    platform: 'Mobile',
    banner: 'assets/logos/mobalegends.png',
    bg: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
    description: 'Classic 3-lane MOBA action with draft picks, team coordination, and ranked cups.',
    activeTourneys: 1,
    activeSquads: 1
  }
];

export function initGamesManager() {
  const container = document.getElementById('view-games');
  if (!container) return;

  renderGamesScaffold(container);
}

function renderGamesScaffold(container) {
  container.innerHTML = `
    <div class="korg-view-header">
      <div class="korg-view-title-row">
        <div>
          <h1 class="korg-view-title">
            <span>CAMPUS GAMES DIRECTORY</span>
          </h1>
          <p class="korg-view-subtitle">
            Explore competitive titles played across campus scrims, tournaments, and community lobbies.
          </p>
        </div>
      </div>

      <!-- Search Bar -->
      <div class="korg-search-box" style="margin-top: 1.5rem;">
        <span style="color: #64748b; font-size: 1.1rem;">🔍</span>
        <input type="text" id="games-search-input" placeholder="Search games by title, genre, or platform..." />
      </div>
    </div>

    <!-- Games Grid -->
    <div class="korg-games-grid" id="games-grid-container"></div>
  `;

  const searchInput = document.getElementById('games-search-input');
  const gridContainer = document.getElementById('games-grid-container');

  renderGameCards(CAMPUS_GAMES, gridContainer);

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      const q = searchInput.value.toLowerCase().trim();
      const filtered = CAMPUS_GAMES.filter(g =>
        g.title.toLowerCase().includes(q) ||
        g.genre.toLowerCase().includes(q) ||
        g.platform.toLowerCase().includes(q) ||
        g.description.toLowerCase().includes(q)
      );
      renderGameCards(filtered, gridContainer);
    });
  }
}

function renderGameCards(games, container) {
  if (!games || games.length === 0) {
    container.innerHTML = `
      <div style="color: #94a3b8; padding: 3rem; text-align: center; grid-column: 1 / -1;">
        <h3>No games match your search query.</h3>
      </div>
    `;
    return;
  }

  container.innerHTML = games.map(g => `
    <div class="korg-game-item-card">
      <div class="korg-game-item-banner" style="background: ${g.bg}; display: flex; align-items: center; justify-content: center; position: relative;">
        <img src="${g.banner}" alt="${g.title}" style="max-height: 80px; max-width: 80%; object-fit: contain; z-index: 1;" />
        <span class="korg-pill-tag korg-pill-type" style="position: absolute; top: 12px; left: 12px; z-index: 2; background: rgba(0,0,0,0.6); backdrop-filter: blur(8px);">
          ${g.genre}
        </span>
      </div>

      <div class="korg-game-item-body">
        <h3 class="korg-game-item-title">${g.title}</h3>
        <p class="korg-game-item-desc">${g.description}</p>

        <div class="korg-game-item-meta">
          <span>🎮 ${g.platform}</span>
          <span style="color: #00f0ff; font-weight: 700;">${g.activeTourneys} Tournaments</span>
        </div>

        <button class="korg-game-open-btn" data-open-game="${g.id}">
          <span>OPEN</span>
          <span>→</span>
        </button>
      </div>
    </div>
  `).join('');

  // Attach OPEN -> button
  container.querySelectorAll('[data-open-game]').forEach(btn => {
    btn.addEventListener('click', () => {
      // Switches to events or squads
      switchView('events');
    });
  });
}
