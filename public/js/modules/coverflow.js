/**
 * Kogofox Gaming Arena - 3D Coverflow Gallery
 * Direct replication of korg.buzz Campus Gaming Gallery
 */

import { sound } from './soundEngine.js';
import { GAMES_DATA } from '../data/gamesData.js';

export class CoverflowGallery {
  constructor(app) {
    this.app = app;
    this.currentIndex = 0; // 0: Free Fire, 1: MOBA Legends, 2: Valorant, 3: PUBG, 4: Clash Royale
    this.games = Object.keys(GAMES_DATA); // ['freefire', 'mobalegends', 'valorant', 'pubg', 'clashroyale']
    this.isDragging = false;
    this.startX = 0;
    this.dragThreshold = 40;
  }

  init(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    this.render();
    this.attachEvents();
  }

  render() {
    this.container.innerHTML = `
      <div class="coverflow-section">
        <div class="coverflow-header">
          <div class="cf-title-col">
            <span class="cf-icon">🎮</span>
            <h3 class="cf-heading">Campus Gaming Gallery</h3>
          </div>
          <div class="cf-nav-tools">
            <span class="cf-drag-hint">↔ Drag / Swipe</span>
            <button class="cf-arrow-btn" id="cf-prev-btn" title="Previous Arena" aria-label="Previous">
              ‹
            </button>
            <button class="cf-arrow-btn" id="cf-next-btn" title="Next Arena" aria-label="Next">
              ›
            </button>
          </div>
        </div>

        <div class="coverflow-viewport" id="cf-viewport">
          <div class="coverflow-track" id="cf-track">
            ${this.games.map((key, idx) => {
              const g = GAMES_DATA[key];
              return `
                <div class="coverflow-card ${idx === this.currentIndex ? 'active-card' : ''}" 
                     data-index="${idx}" 
                     data-game="${g.id}">
                  <div class="cf-card-inner">
                    <img src="assets/banners/${g.id}.jpg" alt="${g.name} Arena" class="cf-banner-img">
                    <div class="cf-card-gradient"></div>

                    <div class="cf-card-overlay">
                      <div class="cf-card-top">
                        <img src="${g.logo}" alt="${g.name} Logo" class="cf-game-logo">
                        <span class="cf-badge-pill">${g.badge}</span>
                      </div>

                      <div class="cf-card-info">
                        <h4 class="cf-game-title">${g.name}</h4>
                        <p class="cf-game-tagline">${g.tagline}</p>
                        <div class="cf-card-action">
                          <button class="cf-enter-btn" data-game="${g.id}">
                            <span>ENTER ARENA</span> ➔
                          </button>
                          <span class="cf-prize-tag">Prize: ${g.prizePool}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Dot Pagination -->
        <div class="coverflow-dots-bar" id="cf-dots">
          ${this.games.map((_, idx) => `
            <button class="cf-dot ${idx === this.currentIndex ? 'active' : ''}" data-index="${idx}" aria-label="Slide ${idx + 1}"></button>
          `).join('')}
        </div>
      </div>
    `;

    this.updateCardTransforms();
  }

  updateCardTransforms() {
    const cards = this.container.querySelectorAll('.coverflow-card');
    const total = this.games.length;

    cards.forEach((card, idx) => {
      let offset = idx - this.currentIndex;

      card.classList.toggle('active-card', offset === 0);

      // 3D positioning calculation
      if (offset === 0) {
        card.style.transform = `translateX(0%) translateZ(120px) scale(1.08)`;
        card.style.opacity = '1';
        card.style.zIndex = '10';
        card.style.filter = 'brightness(1.05) drop-shadow(0 20px 40px rgba(0, 0, 0, 0.9)) drop-shadow(0 0 25px rgba(0, 240, 255, 0.3))';
        card.style.pointerEvents = 'auto';
      } else if (offset === -1 || (offset === total - 1 && total > 2)) {
        // Immediate left
        card.style.transform = `translateX(-58%) translateZ(20px) rotateY(34deg) scale(0.86)`;
        card.style.opacity = '0.72';
        card.style.zIndex = '6';
        card.style.filter = 'brightness(0.65) drop-shadow(0 10px 25px rgba(0,0,0,0.8))';
        card.style.pointerEvents = 'auto';
      } else if (offset === 1 || (offset === -(total - 1) && total > 2)) {
        // Immediate right
        card.style.transform = `translateX(58%) translateZ(20px) rotateY(-34deg) scale(0.86)`;
        card.style.opacity = '0.72';
        card.style.zIndex = '6';
        card.style.filter = 'brightness(0.65) drop-shadow(0 10px 25px rgba(0,0,0,0.8))';
        card.style.pointerEvents = 'auto';
      } else if (offset < -1) {
        // Far left
        card.style.transform = `translateX(-95%) translateZ(-80px) rotateY(46deg) scale(0.72)`;
        card.style.opacity = '0.35';
        card.style.zIndex = '2';
        card.style.filter = 'brightness(0.4) blur(1px)';
        card.style.pointerEvents = 'auto';
      } else {
        // Far right
        card.style.transform = `translateX(95%) translateZ(-80px) rotateY(-46deg) scale(0.72)`;
        card.style.opacity = '0.35';
        card.style.zIndex = '2';
        card.style.filter = 'brightness(0.4) blur(1px)';
        card.style.pointerEvents = 'auto';
      }
    });

    // Update dots
    const dots = this.container.querySelectorAll('.cf-dot');
    dots.forEach((dot, idx) => {
      dot.classList.toggle('active', idx === this.currentIndex);
    });
  }

  goTo(index) {
    const total = this.games.length;
    this.currentIndex = (index + total) % total;
    sound.playTabSwitch();
    this.updateCardTransforms();

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
    const prevBtn = this.container.querySelector('#cf-prev-btn');
    const nextBtn = this.container.querySelector('#cf-next-btn');

    prevBtn?.addEventListener('click', () => this.prev());
    nextBtn?.addEventListener('click', () => this.next());

    // Card click
    const cards = this.container.querySelectorAll('.coverflow-card');
    cards.forEach(card => {
      card.addEventListener('click', (e) => {
        const idx = parseInt(card.dataset.index, 10);
        if (idx !== this.currentIndex) {
          this.goTo(idx);
        } else if (e.target.closest('.cf-enter-btn')) {
          const gameId = card.dataset.game;
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
        }
      });
    });

    // Dots click
    const dots = this.container.querySelectorAll('.cf-dot');
    dots.forEach(dot => {
      dot.addEventListener('click', () => {
        const idx = parseInt(dot.dataset.index, 10);
        this.goTo(idx);
      });
    });

    // Drag / Swipe
    const viewport = this.container.querySelector('#cf-viewport');
    if (!viewport) return;

    let isDown = false;
    let startX = 0;

    const handleStart = (clientX) => {
      isDown = true;
      startX = clientX;
    };

    const handleEnd = (clientX) => {
      if (!isDown) return;
      isDown = false;
      const diffX = clientX - startX;
      if (diffX > this.dragThreshold) {
        this.prev();
      } else if (diffX < -this.dragThreshold) {
        this.next();
      }
    };

    viewport.addEventListener('mousedown', (e) => handleStart(e.clientX));
    window.addEventListener('mouseup', (e) => handleEnd(e.clientX));

    viewport.addEventListener('touchstart', (e) => {
      if (e.touches && e.touches[0]) handleStart(e.touches[0].clientX);
    }, { passive: true });

    viewport.addEventListener('touchend', (e) => {
      if (e.changedTouches && e.changedTouches[0]) handleEnd(e.changedTouches[0].clientX);
    }, { passive: true });
  }
}
