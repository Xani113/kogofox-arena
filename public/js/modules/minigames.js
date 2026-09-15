/**
 * Kugofox Gaming Arena - Tactical Simulators & Minigames
 * Clean, skill-focused tools without coin dependencies
 */

import { sound } from './soundEngine.js';
import { GAMES_DATA } from '../data/gamesData.js';

export class MiniGameManager {
  constructor(app) {
    this.app = app;
    this.reflexState = {
      active: false,
      waiting: false,
      startTime: 0,
      timeoutId: null,
      bestScore: localStorage.getItem('kugofox_reflex_best') || null
    };
    this.crDeck = [];
    this.mobaDraft = {
      blue: [],
      red: []
    };
  }

  /* ---------------- VALORANT REFLEX AIM TRAINER ---------------- */
  initReflexTrainer(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
      <div class="trainer-box">
        <div class="trainer-header">
          <div>
            <h4 class="title-glow">🎯 Radiant Aim & Reflex Drill</h4>
            <p class="subtitle">Click the target as fast as humanly possible when it turns NEON CYAN!</p>
          </div>
          <div class="best-score-badge">
            <span>PERSONAL BEST: </span>
            <strong id="reflex-best-val" class="text-neon">${this.reflexState.bestScore ? this.reflexState.bestScore + ' ms' : '--'}</strong>
          </div>
        </div>
        
        <div id="reflex-target-area" class="reflex-arena">
          <div id="reflex-crosshair" class="crosshair-target">
            <div class="ch-circle"></div>
            <div class="ch-center"></div>
          </div>
          <div id="reflex-msg" class="reflex-msg">CLICK TO ARM SENSORS</div>
        </div>

        <div class="trainer-stats" id="reflex-stats-panel">
          <div class="stat-pill"><span class="label">Status:</span> <span id="reflex-status" class="val text-muted">IDLE</span></div>
          <div class="stat-pill"><span class="label">Last Reflex:</span> <span id="reflex-last" class="val">--</span></div>
          <div class="stat-pill"><span class="label">Tier Grade:</span> <span id="reflex-tier" class="val text-cyan">UNRANKED</span></div>
        </div>
      </div>
    `;

    const arena = document.getElementById('reflex-target-area');
    const msg = document.getElementById('reflex-msg');
    const crosshair = document.getElementById('reflex-crosshair');
    const statusVal = document.getElementById('reflex-status');
    const lastVal = document.getElementById('reflex-last');
    const tierVal = document.getElementById('reflex-tier');
    const bestVal = document.getElementById('reflex-best-val');

    arena.addEventListener('click', () => {
      sound.playClick();

      if (!this.reflexState.active && !this.reflexState.waiting) {
        this.reflexState.waiting = true;
        arena.className = 'reflex-arena waiting';
        msg.textContent = 'WAIT FOR TARGET LOCK...';
        statusVal.textContent = 'STANDBY';
        statusVal.className = 'val text-warning';

        const maxX = arena.clientWidth - 80;
        const maxY = arena.clientHeight - 80;
        const randX = Math.max(20, Math.floor(Math.random() * maxX));
        const randY = Math.max(20, Math.floor(Math.random() * maxY));
        crosshair.style.left = `${randX}px`;
        crosshair.style.top = `${randY}px`;
        crosshair.classList.remove('active-target');

        const delay = Math.floor(Math.random() * 2000) + 1200;
        this.reflexState.timeoutId = setTimeout(() => {
          this.reflexState.waiting = false;
          this.reflexState.active = true;
          this.reflexState.startTime = performance.now();
          arena.className = 'reflex-arena fire-ready';
          msg.textContent = '⚡ FIRE NOW! ⚡';
          statusVal.textContent = 'TARGET ACQUIRED';
          statusVal.className = 'val text-neon';
          crosshair.classList.add('active-target');
          sound.playBeep();
        }, delay);

      } else if (this.reflexState.waiting) {
        clearTimeout(this.reflexState.timeoutId);
        this.reflexState.waiting = false;
        arena.className = 'reflex-arena misfire';
        msg.textContent = '❌ MISFIRE! TOO EARLY! CLICK TO RETRY';
        statusVal.textContent = 'PENALTY';
        statusVal.className = 'val text-danger';

      } else if (this.reflexState.active) {
        const reactionTime = Math.round(performance.now() - this.reflexState.startTime);
        this.reflexState.active = false;
        sound.playHeadshot();

        arena.className = 'reflex-arena hit';
        crosshair.classList.remove('active-target');
        msg.textContent = `🎯 HIT! ${reactionTime} ms`;
        statusVal.textContent = 'CONFIRMED HIT';
        statusVal.className = 'val text-success';
        lastVal.textContent = `${reactionTime} ms`;

        let tier = 'Gold ⚔️';
        if (reactionTime < 190) tier = 'Radiant 🔥';
        else if (reactionTime < 230) tier = 'Immortal ⚡';
        else if (reactionTime < 280) tier = 'Ascendant 💎';
        else if (reactionTime < 330) tier = 'Diamond 🔷';
        else if (reactionTime < 400) tier = 'Platinum 🛡️';

        tierVal.textContent = tier;

        if (!this.reflexState.bestScore || reactionTime < this.reflexState.bestScore) {
          this.reflexState.bestScore = reactionTime;
          localStorage.setItem('kugofox_reflex_best', reactionTime);
          bestVal.textContent = `${reactionTime} ms`;
          sound.playVictory();
          this.app.showToast(`New Personal Record: ${reactionTime} ms!`, 'success');
        } else {
          this.app.showToast(`Target acquired in ${reactionTime} ms`, 'info');
        }
      }
    });
  }

  /* ---------------- CLASH ROYALE DECK BUILDER ---------------- */
  initClashDeckBuilder(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const cards = GAMES_DATA.clashroyale.cards;
    this.crDeck = [cards[0], cards[2], cards[3], cards[4], cards[5], cards[6], cards[9], cards[10]];

    const renderDeckUI = () => {
      const avgElixir = (this.crDeck.reduce((acc, c) => acc + c.elixir, 0) / (this.crDeck.length || 1)).toFixed(1);
      
      let archetype = 'Balanced Control';
      if (avgElixir < 3.2) archetype = 'Fast Cycle / Spell Bait';
      else if (avgElixir > 4.2) archetype = 'Heavy Beatdown';
      else if (this.crDeck.some(c => c.name === 'P.E.K.K.A' || c.name === 'Mega Knight')) archetype = 'Bridge Spam / Counter Push';

      container.innerHTML = `
        <div class="deck-builder-box">
          <div class="deck-header">
            <div>
              <h4 class="title-glow">👑 8-Card Deck Laboratory</h4>
              <p class="subtitle">Assemble your tournament deck, calculate elixir cycle speed & test match synergy.</p>
            </div>
            <div class="deck-metrics">
              <div class="metric-card">
                <span class="m-label">Avg Elixir</span>
                <span class="m-val text-neon" id="deck-avg-elixir">${avgElixir} 💧</span>
              </div>
              <div class="metric-card">
                <span class="m-label">Archetype</span>
                <span class="m-val text-magenta">${archetype}</span>
              </div>
            </div>
          </div>

          <div class="active-deck-section">
            <div class="section-title-sm">Current Battle Deck (${this.crDeck.length}/8 cards)</div>
            <div class="deck-grid" id="current-deck-slots">
              ${this.crDeck.map((card, idx) => `
                <div class="cr-card-slot filled" data-idx="${idx}" title="Click to remove ${card.name}">
                  <div class="elixir-drop">${card.elixir}</div>
                  <div class="card-name-tag">${card.name}</div>
                  <div class="card-role">${card.role.split('/')[0]}</div>
                  <button class="remove-card-btn" data-idx="${idx}">×</button>
                </div>
              `).join('')}
              ${Array.from({ length: 8 - this.crDeck.length }).map(() => `
                <div class="cr-card-slot empty">
                  <div class="empty-icon">+</div>
                  <div class="empty-label">Select Card</div>
                </div>
              `).join('')}
            </div>
          </div>

          <div class="card-collection-section">
            <div class="section-title-sm">Card Collection (Click card to add/remove)</div>
            <div class="collection-scroll">
              ${cards.map(card => {
                const inDeck = this.crDeck.some(c => c.id === card.id);
                return `
                  <div class="cr-card-item ${inDeck ? 'already-selected' : ''}" data-id="${card.id}">
                    <div class="elixir-badge">${card.elixir} 💧</div>
                    <div class="cr-item-info">
                      <div class="cr-item-name">${card.name}</div>
                      <div class="cr-item-type">${card.rarity} • ${card.type}</div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <div class="deck-actions-bar">
            <button id="sim-deck-battle-btn" class="btn-kugofox">
              ⚔️ Test Deck Match Simulation
            </button>
            <button id="reset-deck-btn" class="btn-ghost">
              🔄 Reset to Meta Deck
            </button>
          </div>

          <div id="deck-sim-results" class="deck-sim-results" style="display:none;"></div>
        </div>
      `;

      container.querySelectorAll('.remove-card-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const idx = parseInt(btn.dataset.idx);
          this.crDeck.splice(idx, 1);
          sound.playClick();
          renderDeckUI();
        });
      });

      container.querySelectorAll('.cr-card-item').forEach(item => {
        item.addEventListener('click', () => {
          const cardId = item.dataset.id;
          const cardObj = cards.find(c => c.id === cardId);
          if (this.crDeck.some(c => c.id === cardId)) {
            this.crDeck = this.crDeck.filter(c => c.id !== cardId);
          } else {
            if (this.crDeck.length >= 8) {
              alert('Deck has maximum 8 cards! Remove one first.');
              return;
            }
            this.crDeck.push(cardObj);
          }
          sound.playClick();
          renderDeckUI();
        });
      });

      const simBtn = container.querySelector('#sim-deck-battle-btn');
      const resetBtn = container.querySelector('#reset-deck-btn');
      const simResults = container.querySelector('#deck-sim-results');

      resetBtn.addEventListener('click', () => {
        this.crDeck = [cards[0], cards[2], cards[3], cards[4], cards[5], cards[6], cards[9], cards[10]];
        sound.playTabSwitch();
        renderDeckUI();
      });

      simBtn.addEventListener('click', () => {
        if (this.crDeck.length < 8) {
          alert('You must select 8 cards before testing your deck!');
          return;
        }
        sound.playVictory();
        simResults.style.display = 'block';

        const hasTank = this.crDeck.some(c => c.name === 'P.E.K.K.A' || c.name === 'Mega Knight' || c.name === 'Knight');
        const hasAir = this.crDeck.some(c => c.target.includes('Air'));
        let score = 75;
        if (hasTank) score += 12;
        if (hasAir) score += 13;

        simResults.innerHTML = `
          <div class="sim-banner">
            <h5>⚔️ Arena Match Simulation Results</h5>
            <div class="match-score-display">
              <span class="crown-badge">👑 3 - 1</span> <span class="badge-win">VICTORY</span>
            </div>
            <p class="sim-analysis">
              Synergy Rating: <strong class="text-neon">${score}/100</strong> • Opponent: <em>LavaLoon Beatdown</em>.<br>
              Frontline held with ${this.crDeck[0].name}. Solid elixir cycle in double overtime secured 3 crowns!
            </p>
          </div>
        `;
        this.app.showToast('Deck battle test successful: 3-1 Victory!', 'success');
      });
    };

    renderDeckUI();
  }

  /* ---------------- MOBA LEGENDS DRAFT SIMULATOR ---------------- */
  initMobaDraftSim(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const heroes = GAMES_DATA.mobalegends.heroes;
    const blueTeam = [];
    const redTeam = [];

    const renderDraftUI = () => {
      container.innerHTML = `
        <div class="moba-draft-box">
          <div class="draft-header">
            <div>
              <h4 class="title-glow">⚔️ 5v5 Pro Draft & Ban Arena</h4>
              <p class="subtitle">Draft 5 heroes per team to simulate pro tournament composition.</p>
            </div>
            <button id="reset-draft-btn" class="btn-ghost-sm">Reset Draft</button>
          </div>

          <div class="draft-teams-grid">
            <div class="draft-team blue-side">
              <div class="team-side-title text-cyan">🟦 Blue Team (${blueTeam.length}/5)</div>
              <div class="draft-slots-list">
                ${[0,1,2,3,4].map(idx => {
                  const h = blueTeam[idx];
                  return h ? `
                    <div class="draft-hero-card">
                      <span class="hero-icon">${h.icon}</span>
                      <div class="hero-text">
                        <strong class="hero-name">${h.name}</strong>
                        <span class="hero-lane">${h.lane} • ${h.role}</span>
                      </div>
                    </div>
                  ` : `
                    <div class="draft-hero-card empty">Slot ${idx+1}: Awaiting Pick</div>
                  `;
                }).join('')}
              </div>
            </div>

            <div class="draft-vs-bar">
              <div class="vs-text">VS</div>
              <div class="draft-synergy-indicator">
                <span class="syn-label">Draft Status:</span>
                <span class="syn-val text-neon">${blueTeam.length === 5 && redTeam.length === 5 ? 'COMPLETED' : 'IN PROGRESS'}</span>
              </div>
            </div>

            <div class="draft-team red-side">
              <div class="team-side-title text-magenta">🟥 Red Team (${redTeam.length}/5)</div>
              <div class="draft-slots-list">
                ${[0,1,2,3,4].map(idx => {
                  const h = redTeam[idx];
                  return h ? `
                    <div class="draft-hero-card">
                      <span class="hero-icon">${h.icon}</span>
                      <div class="hero-text">
                        <strong class="hero-name">${h.name}</strong>
                        <span class="hero-lane">${h.lane} • ${h.role}</span>
                      </div>
                    </div>
                  ` : `
                    <div class="draft-hero-card empty">Slot ${idx+1}: Awaiting Pick</div>
                  `;
                }).join('')}
              </div>
            </div>
          </div>

          <div class="draft-hero-pool">
            <div class="pool-header">Pick Hero (Alternates Blue / Red):</div>
            <div class="heroes-chip-grid">
              ${heroes.map(hero => {
                const isPicked = blueTeam.some(h => h.name === hero.name) || redTeam.some(h => h.name === hero.name);
                return `
                  <button class="hero-chip-btn ${isPicked ? 'picked' : ''}" data-name="${hero.name}" ${isPicked ? 'disabled' : ''}>
                    <span>${hero.icon}</span>
                    <span>${hero.name}</span>
                    <small>(${hero.role})</small>
                  </button>
                `;
              }).join('')}
            </div>
          </div>
        </div>
      `;

      container.querySelectorAll('.hero-chip-btn:not([disabled])').forEach(btn => {
        btn.addEventListener('click', () => {
          const heroName = btn.dataset.name;
          const hero = heroes.find(h => h.name === heroName);
          if (!hero) return;

          if (blueTeam.length <= redTeam.length && blueTeam.length < 5) {
            blueTeam.push(hero);
          } else if (redTeam.length < 5) {
            redTeam.push(hero);
          }
          sound.playClick();

          if (blueTeam.length === 5 && redTeam.length === 5) {
            sound.playVictory();
            this.app.showToast('5v5 Tournament Draft Complete!', 'success');
          }
          renderDraftUI();
        });
      });

      const resetBtn = container.querySelector('#reset-draft-btn');
      if (resetBtn) {
        resetBtn.addEventListener('click', () => {
          blueTeam.length = 0;
          redTeam.length = 0;
          sound.playTabSwitch();
          renderDraftUI();
        });
      }
    };

    renderDraftUI();
  }

  /* ---------------- PUBG DROP RADAR ROULETTE ---------------- */
  initPubgDropRoulette(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const drops = GAMES_DATA.pubg.dropZones;

    container.innerHTML = `
      <div class="pubg-radar-box">
        <div class="radar-header">
          <div>
            <h4 class="title-glow">🪂 Erangel Drop Zone Radar</h4>
            <p class="subtitle">Spin the Kugofox tactical trajectory radar to calculate your optimal drop location!</p>
          </div>
        </div>

        <div class="radar-visual-arena">
          <div class="radar-sweep-circle" id="pubg-radar-circle">
            <div class="sweep-line"></div>
            <div class="radar-crosshair-lines"></div>
            <div id="radar-selected-target" class="radar-target-marker">📍</div>
          </div>

          <div class="radar-intel-card" id="radar-intel-display">
            <div class="intel-badge">TACTICAL INTEL READY</div>
            <h3 id="intel-location-name">POCHINKI</h3>
            <div class="intel-meta">
              <span>Risk: <strong class="text-danger" id="intel-risk">EXTREME</strong></span> • 
              <span>Loot: <strong class="text-warning" id="intel-loot">Tier 3</strong></span> • 
              <span>Map: <strong class="text-cyan" id="intel-map">Erangel</strong></span>
            </div>
            <p class="intel-desc" id="intel-desc">
              Dense urban hot-drop in center of map with immediate street CQB. High survival reward!
            </p>
            <button id="spin-radar-btn" class="btn-kugofox">
              🎯 Spin Tactical Radar
            </button>
          </div>
        </div>
      </div>
    `;

    const spinBtn = container.querySelector('#spin-radar-btn');
    const circle = container.querySelector('#pubg-radar-circle');
    const locName = container.querySelector('#intel-location-name');
    const riskVal = container.querySelector('#intel-risk');
    const lootVal = container.querySelector('#intel-loot');
    const mapVal = container.querySelector('#intel-map');
    const descVal = container.querySelector('#intel-desc');

    spinBtn.addEventListener('click', () => {
      sound.playBeep();
      circle.classList.add('spinning');
      spinBtn.disabled = true;
      spinBtn.textContent = 'CALCULATING DROP VECTOR...';

      let counter = 0;
      const interval = setInterval(() => {
        const randDrop = drops[Math.floor(Math.random() * drops.length)];
        locName.textContent = randDrop.name;
        counter++;
        if (counter > 8) {
          clearInterval(interval);
          circle.classList.remove('spinning');
          const finalDrop = drops[Math.floor(Math.random() * drops.length)];
          locName.textContent = finalDrop.name;
          riskVal.textContent = finalDrop.risk;
          lootVal.textContent = finalDrop.lootTier;
          mapVal.textContent = finalDrop.map;
          descVal.textContent = finalDrop.desc;

          spinBtn.disabled = false;
          spinBtn.textContent = '🎯 Spin Tactical Radar';
          sound.playVictory();
          this.app.showToast(`Drop location locked: ${finalDrop.name}!`, 'info');
        }
      }, 100);
    });
  }
}
