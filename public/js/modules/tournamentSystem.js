/**
 * Kugofox Gaming Arena - Tournament & Bracket Engine
 * Integrated with MongoDB backend API
 */

import { sound } from './soundEngine.js';
import { TOURNAMENTS_DATA } from '../data/tournamentsData.js';

export class TournamentSystem {
  constructor(app) {
    this.app = app;
    this.activeFilter = 'all';
    this.selectedTourneyId = TOURNAMENTS_DATA[0].id;
    this.userPredictions = JSON.parse(localStorage.getItem('kugofox_predictions') || '{}');
    this.userRegistrations = JSON.parse(localStorage.getItem('kugofox_registrations') || '[]');
    this.tournaments = [...TOURNAMENTS_DATA];
  }

  async init(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;
    
    // Fetch latest data from MongoDB API
    await this.fetchTournamentsFromDB();
    await this.fetchRegistrationsFromDB();
    this.render();
  }

  async fetchTournamentsFromDB() {
    try {
      const res = await fetch('/api/tournaments');
      if (res.ok) {
        const json = await res.json();
        if (json.data && json.data.length > 0) {
          this.tournaments = json.data;
        }
      }
    } catch (e) {
      console.warn('[TournamentSystem] Using local tournament cache:', e.message);
    }
  }

  async fetchRegistrationsFromDB() {
    try {
      const res = await fetch('/api/tournaments/registrations');
      if (res.ok) {
        const json = await res.json();
        if (json.data && json.data.length > 0) {
          this.userRegistrations = json.data;
        }
      }
    } catch (e) {
      console.warn('[TournamentSystem] Using local registration cache:', e.message);
    }
  }

  setFilter(gameId) {
    this.activeFilter = gameId;
    const available = this.getFilteredTournaments();
    if (available.length > 0 && !available.some(t => t.id === this.selectedTourneyId)) {
      this.selectedTourneyId = available[0].id;
    }
    this.render();
  }

  getFilteredTournaments() {
    if (this.activeFilter === 'all') return this.tournaments;
    return this.tournaments.filter(t => t.gameId === this.activeFilter);
  }

  render() {
    const tournaments = this.getFilteredTournaments();
    const currentTourney = this.tournaments.find(t => t.id === this.selectedTourneyId) || tournaments[0];

    this.container.innerHTML = `
      <div class="tournament-engine">
        <div class="tourney-top-bar">
          <div class="tourney-selector-chips">
            ${tournaments.map(t => `
              <button class="tourney-chip-btn ${t.id === currentTourney.id ? 'active' : ''}" data-id="${t.id}">
                <span class="chip-dot status-${t.status.toLowerCase().replace(' ', '-')}"></span>
                <span class="chip-title">${t.title}</span>
                <span class="chip-prize">${t.prizePool}</span>
              </button>
            `).join('')}
          </div>

          <button id="open-register-modal-btn" class="btn-kugofox">
            <span>🛡️</span> Register Squad (MongoDB)
          </button>
        </div>

        <div class="tourney-spotlight-card">
          <div class="spotlight-badge-row">
            <span class="badge-status status-${currentTourney.status.toLowerCase().replace(' ', '-')}">${currentTourney.status}</span>
            <span class="badge-tier">${currentTourney.tier}</span>
            <span class="badge-time">⏳ Live Countdown: ${currentTourney.timeRemaining}</span>
          </div>

          <div class="spotlight-main">
            <div>
              <h2 class="spotlight-title">${currentTourney.title}</h2>
              <p class="spotlight-desc">${currentTourney.description}</p>
              <div class="spotlight-tags">
                <span class="s-tag">🎮 Format: <strong>${currentTourney.format}</strong></span>
                <span class="s-tag">🏆 Prize Pool: <strong class="text-neon">${currentTourney.prizePool}</strong></span>
                <span class="s-tag">👥 Field: <strong>${currentTourney.teamsCount} Seeded</strong></span>
              </div>
            </div>

            <div class="spotlight-actions">
              <button id="predict-vote-btn" class="btn-ghost">
                🎯 Cheer for Grand Finalist
              </button>
            </div>
          </div>
        </div>

        <div class="bracket-wrapper">
          <div class="bracket-header">
            <div class="bh-col">Quarter Finals</div>
            <div class="bh-col">Semi Finals</div>
            <div class="bh-col">Grand Championship</div>
          </div>

          <div class="bracket-tree">
            <div class="bracket-column round-qf">
              ${(currentTourney.bracket.quarterFinals || []).map(m => this.renderMatchCard(m)).join('')}
              ${(!currentTourney.bracket.quarterFinals || currentTourney.bracket.quarterFinals.length === 0) ? `
                <div class="battle-royale-lobby-note">
                  <h4>🪂 Battle Royale Point Ladder</h4>
                  <p>1 pt per Kill • Placement multipliers: 1st (10 pts), 2nd (6 pts), 3rd (5 pts).</p>
                </div>
              ` : ''}
            </div>

            <div class="bracket-column round-sf">
              ${(currentTourney.bracket.semiFinals || []).map(m => this.renderMatchCard(m)).join('')}
            </div>

            <div class="bracket-column round-gf">
              ${currentTourney.bracket.grandFinal ? this.renderGrandFinalCard(currentTourney.bracket.grandFinal) : ''}
            </div>
          </div>
        </div>

        ${this.userRegistrations.length > 0 ? `
          <div class="my-registrations-block">
            <h4>🎟️ Verified Squad Passes (Synced to MongoDB)</h4>
            <div class="registered-passes-grid">
              ${this.userRegistrations.map((reg, idx) => `
                <div class="hologram-pass-card">
                  <div class="pass-header">
                    <span class="pass-chip">OFFICIAL ENTRY</span>
                    <span class="pass-game">${reg.game.toUpperCase()}</span>
                  </div>
                  <div class="pass-body">
                    <h3 class="pass-team">[${reg.tag}] ${reg.teamName}</h3>
                    <div class="pass-captain">Captain: <strong>${reg.captain}</strong> (${reg.discord})</div>
                    <div class="pass-roster">Roster: ${reg.members.filter(Boolean).join(' • ')}</div>
                  </div>
                  <div class="pass-barcode">||| | |||| | ||| |||| || | ${10000 + idx}</div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    `;

    this.attachEventListeners();
  }

  renderMatchCard(match) {
    const isVoted = this.userPredictions[match.matchId];
    return `
      <div class="bracket-match-card ${match.status === 'LIVE NOW' ? 'is-live' : ''}" data-match-id="${match.matchId}">
        <div class="bm-header">
          <span class="bm-id">${match.matchId.toUpperCase()}</span>
          <span class="bm-status">${match.status}</span>
        </div>
        <div class="bm-team ${match.winner === match.team1.name ? 'winner' : ''} ${isVoted === match.team1.name ? 'voted-team' : ''}">
          <span class="t-name">${match.team1.name}</span>
          <span class="t-score">${match.team1.score}</span>
        </div>
        <div class="bm-team ${match.winner === match.team2.name ? 'winner' : ''} ${isVoted === match.team2.name ? 'voted-team' : ''}">
          <span class="t-name">${match.team2.name}</span>
          <span class="t-score">${match.team2.score}</span>
        </div>
        ${match.currentMap ? `<div class="bm-map-note">📍 ${match.currentMap}</div>` : ''}
      </div>
    `;
  }

  renderGrandFinalCard(match) {
    const isVoted = this.userPredictions[match.matchId];
    return `
      <div class="bracket-gf-card is-live" data-match-id="${match.matchId}">
        <div class="gf-crown">👑 GRAND FINALS</div>
        <div class="gf-teams-row">
          <div class="gf-team-box ${isVoted === match.team1.name ? 'voted-team' : ''}">
            <div class="gf-logo">${match.team1.logo || '🛡️'}</div>
            <div class="gf-name">${match.team1.name}</div>
            <div class="gf-score text-neon">${match.team1.score}</div>
            <button class="vote-team-btn" data-match="${match.matchId}" data-team="${match.team1.name}">
              ${isVoted === match.team1.name ? 'Cheering 🦊' : 'Cheer Team'}
            </button>
          </div>

          <div class="gf-vs">VS</div>

          <div class="gf-team-box ${isVoted === match.team2.name ? 'voted-team' : ''}">
            <div class="gf-logo">${match.team2.logo || '⚡'}</div>
            <div class="gf-name">${match.team2.name}</div>
            <div class="gf-score text-neon">${match.team2.score}</div>
            <button class="vote-team-btn" data-match="${match.matchId}" data-team="${match.team2.name}">
              ${isVoted === match.team2.name ? 'Cheering 🦊' : 'Cheer Team'}
            </button>
          </div>
        </div>
        <div class="gf-details">
          <span class="gf-map-status">🔥 ${match.currentMap || 'Decider Map in Progress'}</span>
          <span class="gf-status-pulse">🔴 ${match.status}</span>
        </div>
      </div>
    `;
  }

  attachEventListeners() {
    this.container.querySelectorAll('.tourney-chip-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        sound.playClick();
        this.selectedTourneyId = btn.dataset.id;
        this.render();
      });
    });

    this.container.querySelectorAll('.vote-team-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        sound.playVictory();
        const matchId = btn.dataset.match;
        const team = btn.dataset.team;
        this.userPredictions[matchId] = team;
        localStorage.setItem('kugofox_predictions', JSON.stringify(this.userPredictions));

        // Save vote to MongoDB
        try {
          await fetch('/api/tournaments/vote', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ matchId, team })
          });
        } catch (err) {
          console.warn('[MongoDB Vote]:', err.message);
        }

        this.app.showToast(`Cheering for ${team}! Synced to MongoDB.`, 'success');
        this.render();
      });
    });

    const regBtn = this.container.querySelector('#open-register-modal-btn');
    if (regBtn) {
      regBtn.addEventListener('click', () => {
        sound.playClick();
        this.openRegistrationModal();
      });
    }

    const predictBtn = this.container.querySelector('#predict-vote-btn');
    if (predictBtn) {
      predictBtn.addEventListener('click', () => {
        sound.playClick();
        const firstLiveBtn = this.container.querySelector('.vote-team-btn');
        if (firstLiveBtn) {
          firstLiveBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      });
    }
  }

  openRegistrationModal() {
    const modalOverlay = document.getElementById('modal-overlay');
    const modalContent = document.getElementById('modal-content');
    if (!modalOverlay || !modalContent) return;

    modalContent.innerHTML = `
      <div class="reg-modal-box">
        <div class="modal-header">
          <h3 class="title-glow">🛡️ Register Official Arena Squad</h3>
          <button id="close-modal-btn" class="close-btn">×</button>
        </div>
        <p class="modal-sub">Squad dossiers are permanently saved into MongoDB and verified for tournament seeding.</p>

        <form id="team-reg-form" class="reg-form">
          <div class="form-row">
            <div class="form-group">
              <label>Tournament Title</label>
              <select id="reg-game" required>
                <option value="freefire">Free Fire (Clash Squad 4v4)</option>
                <option value="bgmi">BGMI (Squad Battle Royale)</option>
                <option value="valorant">Valorant (5v5)</option>
                <option value="mobalegends">MOBA Legends (5v5)</option>
              </select>
            </div>
            <div class="form-group">
              <label>Team Tag (e.g. FOX)</label>
              <input type="text" id="reg-tag" maxlength="5" placeholder="FOX" required>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Team Full Name</label>
              <input type="text" id="reg-team-name" placeholder="Kugofox Strikers" required>
            </div>
            <div class="form-group">
              <label>Captain IGN / Handle</label>
              <input type="text" id="reg-captain" placeholder="FoxLeader#1337" required>
            </div>
          </div>

          <div class="form-group">
            <label>Captain Discord / Telegram Tag</label>
            <input type="text" id="reg-discord" placeholder="foxcaptain#0001" required>
          </div>

          <div class="form-group">
            <label>Roster Members (Player Handles)</label>
            <div class="roster-inputs">
              <input type="text" class="roster-member" placeholder="Player 2 IGN">
              <input type="text" class="roster-member" placeholder="Player 3 IGN">
              <input type="text" class="roster-member" placeholder="Player 4 IGN">
              <input type="text" class="roster-member" placeholder="Player 5 IGN (Optional)">
            </div>
          </div>

          <div class="form-actions">
            <button type="submit" class="btn-kugofox btn-full">
              💾 Save to MongoDB & Issue Pass
            </button>
          </div>
        </form>
      </div>
    `;

    modalOverlay.style.display = 'flex';

    document.getElementById('close-modal-btn').addEventListener('click', () => {
      modalOverlay.style.display = 'none';
    });

    document.getElementById('team-reg-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const game = document.getElementById('reg-game').value;
      const tag = document.getElementById('reg-tag').value.toUpperCase();
      const teamName = document.getElementById('reg-team-name').value;
      const captain = document.getElementById('reg-captain').value;
      const discord = document.getElementById('reg-discord').value;
      const memberInputs = Array.from(document.querySelectorAll('.roster-member'));
      const members = [captain, ...memberInputs.map(i => i.value.trim()).filter(Boolean)];

      const newRegistration = {
        game,
        tag,
        teamName,
        captain,
        discord,
        members,
        timestamp: new Date().toISOString()
      };

      try {
        const res = await fetch('/api/tournaments/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newRegistration)
        });
        const data = await res.json();
        if (data.success && data.data) {
          this.userRegistrations.unshift(data.data);
        } else {
          this.userRegistrations.unshift(newRegistration);
        }
      } catch (err) {
        this.userRegistrations.unshift(newRegistration);
      }

      localStorage.setItem('kugofox_registrations', JSON.stringify(this.userRegistrations));

      sound.playVictory();
      this.app.showToast(`[${tag}] ${teamName} registered to MongoDB!`, 'success');
      modalOverlay.style.display = 'none';
      this.render();
    });
  }
}
