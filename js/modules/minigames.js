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

  /* ---------------- CLASH ROYALE (REMOVED) ---------------- */
  initClashDeckBuilder() {}


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

  /* ---------------- BGMI DROP RADAR & TACTICAL LAB ---------------- */
  initBgmiDropLab(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const bgmiData = GAMES_DATA.bgmi || GAMES_DATA.freefire;
    const drops = bgmiData.dropZones || [
      { name: "Pochinki", map: "Erangel", risk: "EXTREME", lootTier: "Tier 3", desc: "Dense urban hot-drop in center of map with immediate street CQB." },
      { name: "Military Base (Sosnovka)", map: "Erangel", risk: "MAXIMUM", lootTier: "Tier 3+", desc: "Airfield radar towers, crates, Level 3 armor and military sniper spawns." },
      { name: "School & Apartments", map: "Erangel", risk: "VERY HIGH", lootTier: "Tier 3", desc: "High octane indoor firefights, rooftop sniping dominance." },
      { name: "Georgopol Containers", map: "Erangel", risk: "HIGH", lootTier: "Tier 3", desc: "Labyrinth of shipping crates with abundant assault rifles and optics." },
      { name: "Pecado Casino", map: "Miramar", risk: "EXTREME", lootTier: "Tier 3+", desc: "The deadliest multi-floor boxing ring and hotel brawl in the desert." },
      { name: "Bootcamp", map: "Sanhok", risk: "INSANE", lootTier: "Tier 3+", desc: "Main central fortress where 20+ players contest weapons inside 15 seconds." }
    ];

    container.innerHTML = `
      <div class="pubg-radar-box">
        <div class="radar-header">
          <div>
            <h4 class="title-glow">🪂 BGMI Tactical Drop Zone Radar</h4>
            <p class="subtitle">Spin the Kugofox tactical trajectory radar to calculate your optimal squad drop location!</p>
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

  initPubgDropRoulette(containerId) {
    return this.initBgmiDropLab(containerId);
  }
}
