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
                      <button class="arena-enter-btn" data-game="${g.id}" title="Enter ${g.name} Arena">
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
    // Card interactions
    const cards = this.container.querySelectorAll('.arena-card');
    cards.forEach(card => {
      card.addEventListener('click', (e) => {
        const idx = parseInt(card.dataset.index, 10);
        const gameId = card.dataset.game;

        this.selectGame(idx);
        sound.playClick();

        // Direct user directly to Events & Scrims
        switchView('events');

        // Automatically filter events by the selected game
        setTimeout(() => {
          const filterBtn = document.querySelector(`#events-filter-bar .korg-filter-pill[data-game="${gameId}"]`);
          if (filterBtn) {
            filterBtn.click();
          }
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 60);
      });
    });
  }
}
