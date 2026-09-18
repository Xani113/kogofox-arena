/**
 * leaderboard.js
 * Competitive Standings & Combat Points (CP) Leaderboard
 * Matches Screenshot 2: Rank, Player, Tier, Matches, Wins, Best, Win Rate, Combat Points (CP)
 */

let standingsData = [];
let activeGameFilter = 'all';
let searchQuery = '';

export function initLeaderboard(containerId = 'view-leaderboard') {
  const container = document.getElementById(containerId);
  if (!container) return;

  renderLeaderboardScaffold(container);
  fetchStandings();

  window.addEventListener('korg:viewChanged', (e) => {
    if (e.detail && (e.detail.view === 'leaderboard' || e.detail.view === 'standings')) {
      fetchStandings();
    }
  });
}

function renderLeaderboardScaffold(container) {
  container.innerHTML = `
    <div class="korg-view-header">
      <div class="korg-view-title-row">
        <div>
          <h1 class="korg-view-title">
            <span>COMPETITIVE STANDINGS</span>
          </h1>
          <p class="korg-view-subtitle">
            Official campus collegiate rankings based on tournament results, previous match scrim performance, and Combat Points (CP).
          </p>
        </div>
      </div>

      <!-- Filter pills -->
      <div class="korg-filter-bar" id="standings-filter-bar">
        <button class="korg-filter-pill active" data-game="all">All Games</button>
        <button class="korg-filter-pill" data-game="freefire">Free Fire</button>
        <button class="korg-filter-pill" data-game="bgmi">BGMI</button>
        <button class="korg-filter-pill" data-game="valorant">Valorant</button>
        <button class="korg-filter-pill" data-game="mobalegends">Mobile Legends</button>
      </div>
    </div>

    <!-- Standings Table Card -->
    <div class="korg-standings-card">
      <div class="korg-standings-table-wrapper">
        <table class="korg-standings-table">
          <thead>
            <tr>
              <th style="width: 50px;">#</th>
              <th>Player</th>
              <th>Tier</th>
              <th style="text-align: center;">Matches</th>
              <th style="text-align: center;">Wins</th>
              <th style="text-align: center;">Best</th>
              <th style="text-align: center;">Win Rate</th>
              <th style="text-align: right;">Combat Points (CP)</th>
            </tr>
          </thead>
          <tbody id="standings-table-body">
            <tr>
              <td colspan="8" style="text-align: center; color: #94a3b8; padding: 2.5rem;">
                Loading collegiate standings...
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `;

  // Bind filter buttons
  container.querySelectorAll('#standings-filter-bar .korg-filter-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('#standings-filter-bar .korg-filter-pill').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeGameFilter = btn.getAttribute('data-game');
      fetchStandings();
    });
  });
}

export async function fetchStandings() {
  const tbody = document.getElementById('standings-table-body');
  if (!tbody) return;

  try {
    const url = activeGameFilter && activeGameFilter !== 'all'
      ? `/api/standings?game=${activeGameFilter}`
      : '/api/standings';

    const res = await fetch(url);
    const result = await res.json();

    if (result.success && Array.isArray(result.data)) {
      standingsData = result.data;
      renderTableRows(standingsData, tbody);
    } else {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: #ef4444; padding: 2rem;">Failed to load standings.</td></tr>`;
    }
  } catch (e) {
    console.error('Error fetching standings:', e);
  }
}

function renderTableRows(players, tbody) {
  if (!players || players.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align: center; color: #94a3b8; padding: 2.5rem;">
          No competitor standings found for this game category.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = players.map(p => {
    let rankBadge = `#${p.rank}`;
    if (p.rank === 1) rankBadge = `<span class="korg-rank-badge korg-rank-1">1</span>`;
    else if (p.rank === 2) rankBadge = `<span class="korg-rank-badge korg-rank-2">2</span>`;
    else if (p.rank === 3) rankBadge = `<span class="korg-rank-badge korg-rank-3">3</span>`;

    return `
      <tr>
        <td class="korg-rank-cell">${rankBadge}</td>
        <td>
          <div class="korg-player-cell">
            <div class="korg-player-avatar">${p.avatar || '🎮'}</div>
            <div class="korg-player-meta">
              <span class="korg-player-name">${p.name}</span>
              <span class="korg-player-sub">${p.handle || ''} • ${p.dept || 'Campus Arena'}</span>
            </div>
          </div>
        </td>
        <td>
          <span class="korg-tier-badge">${p.tier || 'Bronze'}</span>
        </td>
        <td style="text-align: center; font-weight: 600;">${p.matches || 0}</td>
        <td style="text-align: center; font-weight: 600;">${p.wins || 0}</td>
        <td style="text-align: center; color: #94a3b8;">${p.bestFinish || '1st'}</td>
        <td style="text-align: center; color: #38bdf8; font-weight: 700;">${p.winRate || '0%'}</td>
        <td style="text-align: right;">
          <span class="korg-cp-pill">${p.cp || 0} CP</span>
        </td>
      </tr>
    `;
  }).join('');
}

// Backward compatibility class for old invocation if needed
export class LeaderboardManager {
  constructor(app) {
    this.app = app;
  }
  init(containerId) {
    initLeaderboard(containerId || 'view-leaderboard');
  }
}
