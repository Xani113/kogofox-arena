/**
 * Kugofox Gaming Arena - Combat Zone's
 * Vertical single-card arena list (4 Titles: Free Fire, BGMI, Valorant, MOBA Legends)
 * Replaces previous horizontal sliding carousel
 */

import { sound } from './soundEngine.js';
import { GAMES_DATA } from '../data/gamesData.js';
import { switchView } from './viewController.js';

export class CoverflowGallery {
  constructor(app) {
    this.app = app;
    this.currentIndex = 0;
    // Exactly 4 titles in requested order
    this.games = ['freefire', 'bgmi', 'valorant', 'mobalegends'];
  }

  init(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    this.render();
    this.attachEvents();
  }

  render() {
    this.container.innerHTML = `
      <div class="combat-zones-section" id="combat-zones-hub">
        <!-- Top Section Header matching User Request -->
        <div class="combat-zones-header">
          <div class="cz-title-group">
            <span class="cz-icon">🎮</span>
            <h2 class="cz-heading">COMBAT ZONE'S</h2>
          </div>

          <div class="cz-header-badge">
            <span class="cz-live-dot"></span>
            <span>4 ACTIVE BATTLEGROUNDS</span>
          </div>
        </div>

        <!-- Vertical Single Single Cards List (Not like sliding) -->
        <div class="combat-zones-list" id="combat-zones-list">
          ${this.games.map((key, idx) => {
            const g = GAMES_DATA[key];
            if (!g) return '';
            const isSelected = idx === this.currentIndex;
            return `
              <div class="arena-card cz-vertical-card ${isSelected ? 'active-card' : ''}" 
                   data-index="${idx}" 
                   data-game="${g.id}"
                   data-view-target="events"
                   id="arena-card-${g.id}">
                <div class="arena-card-inner">
                  <img src="${g.banner || 'assets/banners/' + g.id + '.jpg'}" 
                       alt="${g.name} Combat Zone" 
                       class="arena-banner-img"
                       loading="lazy">
                  <div class="arena-card-gradient"></div>

                  <div class="arena-card-overlay">
                    <div class="arena-card-top">
                      <span class="arena-badge-pill">${g.badge || 'CHAMPIONSHIP'}</span>
                    </div>

                    <div class="arena-card-bottom">
                      <div class="arena-info-left">
                        <h3 class="arena-game-title">${g.name.toUpperCase()}</h3>
                        <p class="arena-game-category">${g.category || g.tagline}</p>
                      </div>
                      <button type="button" class="arena-enter-btn" data-game="${g.id}" data-view-target="events" title="Enter ${g.name} Arena">
                        <span>ENTER ARENA</span> ➔
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;

    this.updateActiveCardUI();
  }

  updateActiveCardUI() {
    const cards = this.container.querySelectorAll('.arena-card');
    cards.forEach((card, idx) => {
      card.classList.toggle('active-card', idx === this.currentIndex);
    });
  }

  selectGame(index) {
    const total = this.games.length;
    this.currentIndex = (index + total) % total;
    this.updateActiveCardUI();

    // Sync active game in app if available
    const activeGameKey = this.games[this.currentIndex];
    if (this.app && this.app.setGameFilter) {
      this.app.setGameFilter(activeGameKey, false);
    }
  }

  goTo(index) {
    this.selectGame(index);
  }

  next() {
    this.selectGame(this.currentIndex + 1);
  }

  prev() {
    this.selectGame(this.currentIndex - 1);
  }

  attachEvents() {
    // Card interactions - Click anywhere on Combat Zone card or ENTER ARENA button
    const cards = this.container.querySelectorAll('.arena-card');
    cards.forEach(card => {
      const gameId = card.dataset.game;
      const idx = parseInt(card.dataset.index, 10);
      const enterBtn = card.querySelector('.arena-enter-btn');

      const handleNavigateToEvents = (e) => {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }

        this.selectGame(idx);
        try {
          sound.playClick();
        } catch (err) {}

        // 1. Direct navigation to Events & Scrims view
        const switcher = window.switchView || switchView;
        switcher('events', true, { game: gameId });

        // 2. Direct filter call
        if (typeof window.filterEventsByGame === 'function') {
          window.filterEventsByGame(gameId);
        }

        // 3. Trigger filter button in events filter bar
        const filterBtn = document.querySelector(`#events-filter-bar .korg-filter-pill[data-game="${gameId}"]`);
        if (filterBtn) {
          filterBtn.click();
        }

        // 4. Smoothly scroll to the top of the scrims and tournaments catalog
        window.scrollTo({ top: 0, behavior: 'smooth' });
        if (document.documentElement) document.documentElement.scrollTop = 0;
        if (document.body) document.body.scrollTop = 0;
        const mainArea = document.getElementById('korg-main-area');
        if (mainArea) mainArea.scrollTop = 0;
        const eventsView = document.getElementById('view-events');
        if (eventsView) {
          try {
            eventsView.scrollIntoView({ behavior: 'smooth', block: 'start' });
          } catch (err) {}
        }
      };

      // Card click directs immediately to Events & Scrims
      card.addEventListener('click', handleNavigateToEvents);

      // Enter button click directs immediately to Events & Scrims
      if (enterBtn) {
        enterBtn.addEventListener('click', handleNavigateToEvents);
      }
    });
  }
}
