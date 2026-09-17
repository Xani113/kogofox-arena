/**
 * Kugofox Gaming Arena - Official Battle Arenas Slider
 * High-performance horizontal card slider replicating Image 1 reference
 * 4 Titles: Free Fire, BGMI, Valorant, MOBA Legends
 */

import { sound } from './soundEngine.js';
import { GAMES_DATA } from '../data/gamesData.js';

export class CoverflowGallery {
  constructor(app) {
    this.app = app;
    this.currentIndex = 0;
    // Exactly 4 titles in requested order
    this.games = ['freefire', 'bgmi', 'valorant', 'mobalegends'];
    this.isDragging = false;
    this.startX = 0;
    this.scrollLeft = 0;
  }

  init(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    this.render();
    this.attachEvents();
  }

  render() {
    this.container.innerHTML = `
      <div class="battle-arenas-section" id="battle-arenas-hub">
        <!-- Top Section Header matching Image 1 -->
        <div class="battle-arenas-header">
          <div class="ba-title-group">
            <span class="ba-icon">🎮</span>
            <h2 class="ba-heading">Official Battle Arenas</h2>
          </div>

          <!-- Circular Navigation Buttons matching Image 1 -->
          <div class="ba-nav-controls">
            <button class="ba-circle-btn" id="ba-prev-btn" title="Previous Arena" aria-label="Previous Arena">
              ‹
            </button>
            <button class="ba-circle-btn" id="ba-next-btn" title="Next Arena" aria-label="Next Arena">
              ›
            </button>
          </div>
        </div>

        <!-- Horizontal Scroll Viewport & Card Track -->
        <div class="battle-arenas-viewport" id="ba-viewport">
          <div class="battle-arenas-track" id="ba-track">
            ${this.games.map((key, idx) => {
              const g = GAMES_DATA[key];
              if (!g) return '';
              const isSelected = idx === this.currentIndex;
              return `
                <div class="arena-card ${isSelected ? 'active-card' : ''}" 
                     data-index="${idx}" 
                     data-game="${g.id}"
                     id="arena-card-${g.id}">
                  <div class="arena-card-inner">
                    <img src="${g.banner || 'assets/banners/' + g.id + '.jpg'}" 
                         alt="${g.name} Battle Arena" 
                         class="arena-banner-img"
                         loading="lazy">
                    <div class="arena-card-gradient"></div>

                    <div class="arena-card-overlay">
                      <div class="arena-card-top">
                        <span class="arena-badge-pill">${g.badge || 'CHAMPIONSHIP'}</span>
                        <span class="arena-prize-tag">Prize: ${g.prizePool || '$25,000'}</span>
                      </div>

                      <div class="arena-card-bottom">
                        <div class="arena-info-left">
                          <h4 class="arena-game-title">${g.name}</h4>
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

  goTo(index, smoothScroll = true) {
    const total = this.games.length;
    this.currentIndex = (index + total) % total;
    sound.playTabSwitch();
    this.updateActiveCardUI();

    const activeCard = this.container.querySelector(`.arena-card[data-index="${this.currentIndex}"]`);
    const viewport = this.container.querySelector('#ba-viewport');

    if (activeCard && viewport && smoothScroll) {
      activeCard.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest'
      });
    }

    // Sync active game in app
    const activeGameKey = this.games[this.currentIndex];
    if (this.app && this.app.setGameFilter) {
      this.app.setGameFilter(activeGameKey, false);
    }
  }

  next() {
    this.goTo(this.currentIndex + 1);
  }

  prev() {
    this.goTo(this.currentIndex - 1);
  }

  attachEvents() {
    const prevBtn = this.container.querySelector('#ba-prev-btn');
    const nextBtn = this.container.querySelector('#ba-next-btn');
    const viewport = this.container.querySelector('#ba-viewport');

    prevBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      if (viewport) {
        viewport.scrollBy({ left: -360, behavior: 'smooth' });
      }
      this.prev();
    });

    nextBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      if (viewport) {
        viewport.scrollBy({ left: 360, behavior: 'smooth' });
      }
      this.next();
    });

    // Card interactions
    const cards = this.container.querySelectorAll('.arena-card');
    cards.forEach(card => {
      card.addEventListener('click', (e) => {
        const idx = parseInt(card.dataset.index, 10);
        const gameId = card.dataset.game;

        if (e.target.closest('.arena-enter-btn')) {
          e.stopPropagation();
          sound.playClick();
          if (this.app && this.app.regModal) {
            this.app.regModal.open(gameId);
          } else {
            const minigameSec = document.getElementById('section-minigames');
            if (minigameSec) {
              minigameSec.scrollIntoView({ behavior: 'smooth' });
              const tabBtn = document.querySelector(`.mg-tab[data-mg="${gameId}"]`);
              if (tabBtn) tabBtn.click();
            }
          }
          return;
        }

        this.goTo(idx);
      });
    });

    // Mouse drag scrolling
    if (viewport) {
      let isDown = false;
      let startX = 0;
      let scrollLeft = 0;

      viewport.addEventListener('mousedown', (e) => {
        isDown = true;
        viewport.classList.add('dragging');
        startX = e.pageX - viewport.offsetLeft;
        scrollLeft = viewport.scrollLeft;
      });

      viewport.addEventListener('mouseleave', () => {
        isDown = false;
        viewport.classList.remove('dragging');
      });

      viewport.addEventListener('mouseup', () => {
        isDown = false;
        viewport.classList.remove('dragging');
      });

      viewport.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - viewport.offsetLeft;
        const walk = (x - startX) * 1.5;
        viewport.scrollLeft = scrollLeft - walk;
      });
    }
  }
}
