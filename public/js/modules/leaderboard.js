/**
 * leaderboard.js
 * Match-Specific Competitive Standings & Combat Points (CP) Leaderboard
 * - Standings belong to specific matches rather than an all-time list
 * - Points can only be increased for ongoing (live) matches
 * - Completed match standings remain viewable for 10 days only before auto-deletion
 */

let standingsData = [];
let availableMatches = [];
let currentMatch = null;
let currentMatchId = null;
let activeGameFilter = 'all';

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
            <span>COMPETITIVE MATCH STANDINGS</span>
          </h1>
          <p class="korg-view-subtitle">
            Match-specific performance rankings & Combat Points (CP). Points can only be awarded during live ongoing games. Concluded match standings are archived for 10 days before automatic deletion.
          </p>
        </div>
      </div>

      <!-- Match Selector Pills -->
      <div style="margin-top: 1.5rem; margin-bottom: 0.8rem;">
        <div style="font-size: 0.78rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.5rem;">
          <span>🎯 Select Match / Tournament</span>
        </div>
        <div id="standings-matches-bar" style="display: flex; gap: 0.6rem; overflow-x: auto; padding-bottom: 0.5rem; flex-wrap: wrap;">
          <span style="color: #64748b; font-size: 0.85rem; padding: 0.4rem 0.6rem;">Loading matches...</span>
        </div>
      </div>

      <!-- Filter pills (Games) -->
      <div class="korg-filter-bar" id="standings-filter-bar" style="margin-top: 0.8rem;">
        <button class="korg-filter-pill active" data-game="all">All Games</button>
        <button class="korg-filter-pill" data-game="freefire">Free Fire</button>
        <button class="korg-filter-pill" data-game="bgmi">BGMI</button>
        <button class="korg-filter-pill" data-game="valorant">Valorant</button>
        <button class="korg-filter-pill" data-game="mobalegends">Mobile Legends</button>
      </div>
    </div>

    <!-- Active Match Overview Card -->
    <div id="standings-match-banner" style="margin-bottom: 1.5rem;"></div>

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
              <th style="text-align: right;">Match Combat Points (CP)</th>
            </tr>
          </thead>
          <tbody id="standings-table-body">
            <tr>
              <td colspan="8" style="text-align: center; color: #94a3b8; padding: 2.5rem;">
                Loading match standings...
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `;

  // Bind game filter buttons
  container.querySelectorAll('#standings-filter-bar .korg-filter-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('#standings-filter-bar .korg-filter-pill').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeGameFilter = btn.getAttribute('data-game');
      fetchStandings(currentMatchId);
    });
  });
}

export async function fetchStandings(targetMatchId = null) {
  const tbody = document.getElementById('standings-table-body');
  const matchesBar = document.getElementById('standings-matches-bar');
  const banner = document.getElementById('standings-match-banner');
  if (!tbody) return;

  try {
    let url = '/api/standings?';
    if (targetMatchId) url += `matchId=${encodeURIComponent(targetMatchId)}&`;
    else if (currentMatchId) url += `matchId=${encodeURIComponent(currentMatchId)}&`;
    if (activeGameFilter && activeGameFilter !== 'all') url += `game=${encodeURIComponent(activeGameFilter)}`;

    const res = await fetch(url);
    const result = await res.json();

    if (result.success) {
      currentMatch = result.match;
      currentMatchId = result.match ? result.match.id : null;
      availableMatches = result.availableMatches || [];
      standingsData = result.data || [];

      renderMatchSelector(availableMatches, matchesBar);
      renderMatchBanner(currentMatch, banner, result.notice);
      renderTableRows(standingsData, tbody, currentMatch);
    } else {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: #ef4444; padding: 2rem;">${result.error || 'Failed to load standings.'}</td></tr>`;
    }
  } catch (e) {
    console.error('Error fetching standings:', e);
    if (tbody) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: #ef4444; padding: 2rem;">Server communication error.</td></tr>`;
    }
  }
}

function renderMatchSelector(matches, container) {
  if (!container) return;

  if (!matches || matches.length === 0) {
    container.innerHTML = `<span style="color: #64748b; font-size: 0.82rem; padding: 0.3rem 0.6rem;">No ongoing matches or recent match archives found.</span>`;
    return;
  }

  container.innerHTML = matches.map(m => {
    const isSelected = currentMatch && (currentMatch.id === m.id);
    const isLive = m.isLive || m.status === 'live';
    const isCompleted = m.isCompleted || m.status === 'completed';

    let statusPill = '';
    if (isLive) {
      statusPill = `<span style="background: #ef4444; color: #fff; font-size: 0.65rem; font-weight: 800; padding: 0.15rem 0.4rem; border-radius: 4px; animation: korgPulse 1.5s infinite;">● LIVE</span>`;
    } else if (isCompleted) {
      const daysText = m.daysRemaining ? `${m.daysRemaining}d left` : 'Archived';
      statusPill = `<span style="background: rgba(255,255,255,0.08); color: #94a3b8; font-size: 0.65rem; padding: 0.15rem 0.4rem; border-radius: 4px;">⏱️ ${daysText}</span>`;
    }

    const selectedStyle = isSelected
      ? 'background: rgba(0, 240, 255, 0.15); border-color: #00f0ff; color: #fff; box-shadow: 0 0 12px rgba(0, 240, 255, 0.3);'
      : 'background: rgba(15, 23, 42, 0.7); border-color: rgba(255, 255, 255, 0.1); color: #cbd5e1;';

    return `
      <button class="adm-match-select-btn" data-match-id="${m.id}" style="display: flex; align-items: center; gap: 0.5rem; padding: 0.45rem 0.8rem; border-radius: 8px; border: 1px solid; font-size: 0.8rem; cursor: pointer; transition: all 0.2s; white-space: nowrap; ${selectedStyle}">
        <span style="font-weight: 700;">${m.title}</span>
        ${statusPill}
      </button>
    `;
  }).join('');

  container.querySelectorAll('.adm-match-select-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const matchId = btn.getAttribute('data-match-id');
      currentMatchId = matchId;
      fetchStandings(matchId);
    });
  });
}

function renderMatchBanner(match, container, notice) {
  if (!container) return;

  if (!match) {
    container.innerHTML = `
      <div style="background: rgba(15,23,42,0.6); border: 1px dashed rgba(255,255,255,0.12); border-radius: 12px; padding: 1.2rem; text-align: center; color: #94a3b8;">
        <h3 style="color: #fff; margin: 0 0 0.3rem; font-size: 1.05rem;">No Active or Recent Match Selected</h3>
        <p style="margin: 0; font-size: 0.85rem;">Select an ongoing or recent match above to inspect its standings.</p>
      </div>
    `;
    return;
  }

  const isLive = match.status === 'live';
  const isCompleted = match.status === 'completed';

  let statusBadge = '';
  let statusBanner = '';

  if (isLive) {
    statusBadge = `
      <span style="display: inline-flex; align-items: center; gap: 0.4rem; background: rgba(239,68,68,0.15); border: 1px solid rgba(239,68,68,0.5); color: #ef4444; padding: 0.3rem 0.7rem; border-radius: 20px; font-size: 0.75rem; font-weight: 800; letter-spacing: 0.05em;">
        <span style="width: 8px; height: 8px; border-radius: 50%; background: #ef4444; animation: korgPulse 1.2s infinite;"></span>
        LIVE ONGOING MATCH
      </span>
    `;
    statusBanner = `
      <div style="margin-top: 0.8rem; padding: 0.6rem 0.9rem; background: rgba(0, 240, 255, 0.08); border-left: 3px solid #00f0ff; border-radius: 4px; font-size: 0.82rem; color: #38bdf8;">
        ⚡ <strong>Live Scoring Active:</strong> Points are currently being awarded by the tournament referee/admin for this match.
      </div>
    `;
  } else if (isCompleted) {
    const daysLeft = match.daysRemaining || 10;
    statusBadge = `
      <span style="display: inline-flex; align-items: center; gap: 0.4rem; background: rgba(148,163,184,0.15); border: 1px solid rgba(148,163,184,0.3); color: #cbd5e1; padding: 0.3rem 0.7rem; border-radius: 20px; font-size: 0.75rem; font-weight: 700;">
        🏁 COMPLETED & ARCHIVED
      </span>
    `;
    statusBanner = `
      <div style="margin-top: 0.8rem; padding: 0.6rem 0.9rem; background: rgba(234, 179, 8, 0.08); border-left: 3px solid #eab308; border-radius: 4px; font-size: 0.82rem; color: #fde047; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
        <div>
          ⏱️ <strong>10-Day Retention Notice:</strong> Concluded match standings will automatically be deleted in <strong>${daysLeft} day${daysLeft === 1 ? '' : 's'}</strong>.
        </div>
        <span style="color: #94a3b8; font-size: 0.78rem;">Points Locked</span>
      </div>
    `;
  }

  container.innerHTML = `
    <div style="background: linear-gradient(135deg, rgba(15,23,42,0.85), rgba(30,41,59,0.7)); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 1.2rem 1.5rem; backdrop-filter: blur(12px);">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; flex-wrap: wrap;">
        <div>
          <div style="display: flex; align-items: center; gap: 0.6rem; margin-bottom: 0.4rem;">
            ${statusBadge}
            <span class="korg-pill-tag korg-pill-type" style="margin: 0;">${match.gameName || match.game}</span>
          </div>
          <h2 style="color: #fff; margin: 0 0 0.4rem; font-size: 1.35rem; font-weight: 800; letter-spacing: 0.02em;">
            ${match.title}
          </h2>
          <div style="display: flex; align-items: center; gap: 1rem; font-size: 0.84rem; color: #94a3b8;">
            <span>📅 ${match.date}</span>
            <span style="color: #ffd700; font-weight: 700;">🏆 Prize Pool: ${match.prizePool || '₹400'}</span>
          </div>
        </div>
      </div>
      ${statusBanner}
      ${notice ? `<div style="margin-top: 0.6rem; font-size: 0.8rem; color: #cbd5e1;">${notice}</div>` : ''}
    </div>
  `;
}

function renderTableRows(players, tbody, match) {
  if (!players || players.length === 0) {
    const isLive = match && match.status === 'live';
    tbody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align: center; color: #94a3b8; padding: 3rem 2rem;">
          <div style="font-size: 1.8rem; margin-bottom: 0.5rem;">${isLive ? '⚡' : '📋'}</div>
          <strong style="color: #fff; font-size: 1.05rem;">
            ${isLive ? 'Live Match in Progress!' : 'No standings recorded for this match.'}
          </strong>
          <p style="margin: 0.4rem 0 0; font-size: 0.85rem; color: #64748b;">
            ${isLive
              ? 'Combat Points will appear as the admin or match referee awards points to participating players.'
              : 'Standings for completed matches remain accessible for 10 days after conclusion.'}
          </p>
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
