/**
 * Kugofox Gaming Arena - Leaderboard Module
 */

import { sound } from './soundEngine.js';
import { LEADERBOARD_DATA } from '../data/leaderboardData.js';

export class LeaderboardManager {
  constructor(app) {
    this.app = app;
    this.activeFilter = 'global';
    this.searchTerm = '';
  }

  init(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;
    this.render();
  }

  setFilter(filterId) {
    this.activeFilter = filterId;
    this.render();
  }

  render() {
    const rawList = LEADERBOARD_DATA[this.activeFilter] || LEADERBOARD_DATA.global;
    const filteredList = rawList.filter(player => 
      player.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      (player.team && player.team.toLowerCase().includes(this.searchTerm.toLowerCase()))
    );

    this.container.innerHTML = `
      <div class="leaderboard-hub">
        <div class="lb-header">
          <div>
            <h3 class="title-glow">🏆 Elite Competitor Leaderboard</h3>
            <p class="subtitle">Global & title rankings updated in real-time after verified tournament matches.</p>
          </div>

          <div class="lb-controls">
            <div class="lb-search-box">
              <input type="text" id="lb-search-input" placeholder="Search player or team..." value="${this.searchTerm}">
            </div>
          </div>
        </div>

        <div class="lb-filter-tabs">
          <button class="lb-tab-btn ${this.activeFilter === 'global' ? 'active' : ''}" data-filter="global">🌐 Global All-Stars</button>
          <button class="lb-tab-btn ${this.activeFilter === 'freefire' ? 'active' : ''}" data-filter="freefire"><img src="assets/logos/freefire.png" class="chip-game-logo" alt="Free Fire"> Free Fire</button>
          <button class="lb-tab-btn ${this.activeFilter === 'mobalegends' ? 'active' : ''}" data-filter="mobalegends"><img src="assets/logos/mobalegends.png" class="chip-game-logo" alt="MOBA Legends"> MOBA Legends</button>
          <button class="lb-tab-btn ${this.activeFilter === 'valorant' ? 'active' : ''}" data-filter="valorant"><img src="assets/logos/valorant.png" class="chip-game-logo" alt="Valorant"> Valorant</button>
          <button class="lb-tab-btn ${this.activeFilter === 'pubg' ? 'active' : ''}" data-filter="pubg"><img src="assets/logos/pubg.png" class="chip-game-logo" alt="PUBG"> PUBG</button>
          <button class="lb-tab-btn ${this.activeFilter === 'clashroyale' ? 'active' : ''}" data-filter="clashroyale"><img src="assets/logos/clashroyale.png" class="chip-game-logo" alt="Clash Royale"> Clash Royale</button>
        </div>

        <div class="lb-table-wrapper">
          <table class="lb-table">
            <thead>
              <tr>
                <th class="th-rank">Rank</th>
                <th class="th-player">Competitor</th>
                <th class="th-tier">Competitive Tier</th>
                <th class="th-winrate">Win Rate</th>
                <th class="th-stat">Primary Specialization</th>
                <th class="th-team">Team Org</th>
                <th class="th-action">Dossier</th>
              </tr>
            </thead>
            <tbody>
              ${filteredList.map(p => `
                <tr class="lb-row ${p.rank <= 3 ? 'top-podium rank-' + p.rank : ''}">
                  <td class="td-rank">
                    ${p.rank === 1 ? '<span class="crown-icon gold">🥇 #1</span>' :
                      p.rank === 2 ? '<span class="crown-icon silver">🥈 #2</span>' :
                      p.rank === 3 ? '<span class="crown-icon bronze">🥉 #3</span>' :
                      `#${p.rank}`}
                  </td>
                  <td class="td-player">
                    <div class="player-cell">
                      <span class="p-flag">${p.country || '🌐'}</span>
                      <div class="p-names">
                        <strong class="p-ign">${p.name}</strong>
                        <span class="p-tag text-muted">${p.tag || ''}</span>
                      </div>
                    </div>
                  </td>
                  <td class="td-tier">
                    <span class="tier-pill">${p.tier}</span>
                  </td>
                  <td class="td-winrate">
                    <span class="winrate-val text-neon">${p.winRate}</span>
                  </td>
                  <td class="td-stat">
                    ${p.main || p.mainWeapon || p.mainChar || p.mainHero || p.favoriteCard || p.game || '--'}
                  </td>
                  <td class="td-team">
                    <span class="team-badge">${p.team || 'Free Agent'}</span>
                  </td>
                  <td class="td-action">
                    <button class="inspect-player-btn" data-player="${p.name}">Inspect</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    // Event listeners
    this.container.querySelectorAll('.lb-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        sound.playTabSwitch();
        this.setFilter(btn.dataset.filter);
      });
    });

    const searchInput = this.container.querySelector('#lb-search-input');
    searchInput.addEventListener('input', (e) => {
      this.searchTerm = e.target.value;
      this.render();
    });

    this.container.querySelectorAll('.inspect-player-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        sound.playClick();
        const pName = btn.dataset.player;
        const player = rawList.find(p => p.name === pName);
        if (player) this.openPlayerDossier(player);
      });
    });
  }

  openPlayerDossier(player) {
    const modalOverlay = document.getElementById('modal-overlay');
    const modalContent = document.getElementById('modal-content');
    if (!modalOverlay || !modalContent) return;

    modalContent.innerHTML = `
      <div class="player-dossier-card">
        <div class="modal-header">
          <h3 class="title-glow">🎖️ Verified Competitor Dossier</h3>
          <button id="close-modal-btn" class="close-btn">×</button>
        </div>

        <div class="dossier-hero">
          <div class="dossier-avatar">${player.avatar || '🦊'}</div>
          <div>
            <h2 class="dossier-name">${player.name} <span class="text-neon">${player.tag || ''}</span> ${player.country || ''}</h2>
            <p class="dossier-team">Team: <strong>${player.team || 'Independent Pro'}</strong> • Rank: <strong>${player.tier}</strong></p>
          </div>
        </div>

        <div class="dossier-grid">
          <div class="dossier-stat-box">
            <span class="dsb-lbl">Rating Elo</span>
            <strong class="dsb-val text-neon">${player.rating || '2750'}</strong>
          </div>
          <div class="dossier-stat-box">
            <span class="dsb-lbl">Win Ratio</span>
            <strong class="dsb-val text-warning">${player.winRate}</strong>
          </div>
          <div class="dossier-stat-box">
            <span class="dsb-lbl">Main Specialization</span>
            <strong class="dsb-val text-cyan">${player.main || player.mainWeapon || player.mainChar || player.mainHero || player.favoriteCard || player.game}</strong>
          </div>
          <div class="dossier-stat-box">
            <span class="dsb-lbl">Career Arena Earnings</span>
            <strong class="dsb-val text-success">${player.earnings || '$25,000+'}</strong>
          </div>
        </div>

        <div class="dossier-achievements">
          <h4>🏅 Verified Arena Honors</h4>
          <div class="achieve-tags">
            <span class="a-tag">⭐ MVP Award Stage 1</span>
            <span class="a-tag">🎯 First Blood Specialist</span>
            <span class="a-tag">🛡️ Grand Finalist 2026</span>
            <span class="a-tag">👑 Kugofox Hall of Fame</span>
          </div>
        </div>
      </div>
    `;

    modalOverlay.style.display = 'flex';
    document.getElementById('close-modal-btn').addEventListener('click', () => {
      modalOverlay.style.display = 'none';
    });
  }
}
