/**
 * adminPanel.js
 * Admin Panel Controller
 * Allows controlling upcoming events, updating prize pools, and awarding Combat Points (CP) to players.
 */

import { fetchEvents } from './eventsManager.js';
import { fetchStandings } from './leaderboard.js';

let isAdminAuthenticated = false;
let currentAdminTab = 'events';
let cachedEvents = [];
let cachedPlayers = [];

export function initAdminPanel() {
  const container = document.getElementById('view-admin');
  if (!container) return;

  // Check existing session token
  const token = sessionStorage.getItem('korg_admin_token');
  if (token) {
    isAdminAuthenticated = true;
  }

  renderAdminView(container);

  window.addEventListener('korg:viewChanged', (e) => {
    if (e.detail && e.detail.view === 'admin' && isAdminAuthenticated) {
      loadAdminData();
    }
  });
}

function renderAdminView(container) {
  if (!isAdminAuthenticated) {
    // Try to auto-populate email from currentUser if stored
    let prefillEmail = '';
    try {
      const storedUser = localStorage.getItem('korg_user');
      if (storedUser) {
        const u = JSON.parse(storedUser);
        if (u && u.email) prefillEmail = u.email;
      }
    } catch (e) {}

    // Show email & password admin login box
    container.innerHTML = `
      <div class="korg-admin-auth-wrapper">
        <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">🛡️</div>
        <h3>Admin Command Center</h3>
        <p style="color: #94a3b8; font-size: 0.85rem; margin-bottom: 1.5rem; line-height: 1.5;">
          Restricted access. Only authorized administrator logins (<strong style="color: #00f0ff;">rpmohit9@gmail.com</strong>, <strong style="color: #00f0ff;">mkgsani9@gmail.com</strong>) can unlock the command center.
        </p>

        <form id="admin-login-form" style="display: flex; flex-direction: column; gap: 1rem; text-align: left;">
          <div>
            <label class="korg-admin-label">Admin Email</label>
            <input type="email" id="admin-email-input" class="korg-admin-input" placeholder="e.g. rpmohit9@gmail.com" value="${prefillEmail}" required autocomplete="username" />
          </div>

          <div>
            <label class="korg-admin-label">Admin Password</label>
            <input type="password" id="admin-password-input" class="korg-admin-input" placeholder="Enter admin password" required autocomplete="current-password" />
          </div>

          <button type="submit" class="korg-btn-primary" style="width: 100%; justify-content: center; margin-top: 0.5rem;">
            Unlock Admin Panel
          </button>
        </form>
        <p id="admin-auth-error" style="color: #ef4444; font-size: 0.82rem; margin-top: 1rem; display: none;"></p>
      </div>
    `;

    const form = document.getElementById('admin-login-form');
    const emailInput = document.getElementById('admin-email-input');
    const passInput = document.getElementById('admin-password-input');
    const err = document.getElementById('admin-auth-error');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = emailInput.value.trim();
      const password = passInput.value.trim();
      try {
        const res = await fetch('/api/admin/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (data.success && data.token) {
          sessionStorage.setItem('korg_admin_token', data.token);
          sessionStorage.setItem('korg_admin_email', data.adminEmail || email);
          isAdminAuthenticated = true;
          renderAdminView(container);
          loadAdminData();
          window.dispatchEvent(new CustomEvent('korg:adminLoggedIn', { detail: { email: data.adminEmail || email } }));
        } else {
          err.textContent = data.error || 'Access denied. Invalid email or password.';
          err.style.display = 'block';
        }
      } catch (ex) {
        err.textContent = 'Server connection error.';
        err.style.display = 'block';
      }
    });

    return;
  }

  // Render full admin interface
  container.innerHTML = `
    <div class="korg-view-header">
      <div class="korg-view-title-row">
        <div>
          <h1 class="korg-view-title">
            <span>⚙️ ARENA CONTROL PANEL</span>
          </h1>
          <p class="korg-view-subtitle">
            Manage upcoming tournaments, adjust prize pools, and award Combat Points (CP) to campus competitors.
          </p>
        </div>
        <div style="display: flex; gap: 0.75rem;">
          <button id="admin-logout-btn" class="korg-btn-outline" style="color: #ef4444; border-color: rgba(239,68,68,0.3);">
            Lock Admin Panel
          </button>
        </div>
      </div>

      <!-- Navigation Admin Tabs -->
      <div class="korg-admin-tabs">
        <button class="korg-admin-tab-btn active" data-admin-tab="events">🏆 Event & Prize Pool Manager</button>
        <button class="korg-admin-tab-btn" data-admin-tab="points">⚡ Player Points & Standings</button>
      </div>
    </div>

    <!-- Admin Dashboard Body -->
    <div class="korg-admin-dashboard">

      <!-- 1. EVENT & PRIZE POOL SECTION -->
      <div class="korg-admin-section active" id="admin-sec-events">

        <!-- Create / Publish Event Form -->
        <div class="korg-admin-form-card">
          <h3 style="color: #fff; margin: 0 0 0.5rem; font-size: 1.2rem; display: flex; align-items: center; gap: 0.5rem;">
            <span>➕</span> Publish New Tournament or Scrim
          </h3>

          <form id="admin-create-event-form" style="display: flex; flex-direction: column; gap: 1rem;">
            <div class="korg-admin-form-row">
              <div>
                <label class="korg-admin-label">Tournament / Scrim Title</label>
                <input type="text" id="adm-ev-title" class="korg-admin-input" placeholder="e.g. FREEFIRE CHAMPIONSHIP" required />
              </div>
              <div>
                <label class="korg-admin-label">Game Title</label>
                <select id="adm-ev-game" class="korg-admin-input" style="background: #0f172a;">
                  <option value="freefire">Free Fire</option>
                  <option value="bgmi">BGMI</option>
                  <option value="valorant">Valorant</option>
                  <option value="mobalegends">Mobile Legends</option>
                </select>
              </div>
            </div>

            <div class="korg-admin-form-row">
              <div>
                <label class="korg-admin-label">Date & Time</label>
                <input type="text" id="adm-ev-date" class="korg-admin-input" placeholder="e.g. Thursday, 24 Sep 2026, 6:30 PM IST" required />
              </div>
              <div>
                <label class="korg-admin-label">Prize Pool (e.g. ₹400, ₹1,200)</label>
                <input type="text" id="adm-ev-prize" class="korg-admin-input" placeholder="₹400" required />
              </div>
              <div>
                <label class="korg-admin-label">Max Squads Slot</label>
                <input type="number" id="adm-ev-max" class="korg-admin-input" value="24" min="2" max="100" />
              </div>
            </div>

            <div class="korg-admin-form-row">
              <div>
                <label class="korg-admin-label">Badge Tag</label>
                <select id="adm-ev-badge" class="korg-admin-input" style="background: #0f172a;">
                  <option value="TOURNAMENT">TOURNAMENT</option>
                  <option value="SCRIMS">SCRIMS</option>
                  <option value="CUSTOM">CUSTOM</option>
                </select>
              </div>
              <div>
                <label class="korg-admin-label">Access Tag</label>
                <select id="adm-ev-tag" class="korg-admin-input" style="background: #0f172a;">
                  <option value="OPEN FOR ALL">OPEN FOR ALL</option>
                  <option value="CAMPUS EXCLUSIVE">CAMPUS EXCLUSIVE</option>
                  <option value="VERIFIED TEAMS">VERIFIED TEAMS</option>
                </select>
              </div>
              <div>
                <label class="korg-admin-label">Initial Status</label>
                <select id="adm-ev-status" class="korg-admin-input" style="background: #0f172a;">
                  <option value="upcoming">Upcoming</option>
                  <option value="live">Live Now</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>

            <div>
              <label class="korg-admin-label">Description / Format Details</label>
              <input type="text" id="adm-ev-desc" class="korg-admin-input" placeholder="Official collegiate squad championship. 24 teams battle across Bermuda & Purgatory." />
            </div>

            <button type="submit" class="korg-btn-primary" style="align-self: flex-start;">
              Publish Event to Public Schedule
            </button>
          </form>
        </div>

        <!-- Live Events Table with Prize Pool Quick Editor -->
        <div class="korg-standings-card">
          <div style="padding: 1.2rem 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.08); display: flex; justify-content: space-between; align-items: center;">
            <h3 style="color: #fff; margin: 0; font-size: 1.1rem;">Manage Existing Events & Modify Prize Pools</h3>
            <button id="adm-refresh-events-btn" class="korg-btn-outline" style="font-size: 0.75rem; padding: 0.3rem 0.7rem;">
              ↻ Refresh List
            </button>
          </div>
          <div class="korg-standings-table-wrapper">
            <table class="korg-standings-table">
              <thead>
                <tr>
                  <th>Event Title</th>
                  <th>Game</th>
                  <th>Date & Time</th>
                  <th>Current Prize Pool</th>
                  <th>Slots</th>
                  <th>Status</th>
                  <th style="text-align: right;">Actions</th>
                </tr>
              </thead>
              <tbody id="adm-events-table-body">
                <tr><td colspan="7" style="text-align: center; color: #94a3b8; padding: 2rem;">Loading events...</td></tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>

      <!-- 2. PLAYER POINTS SECTION -->
      <div class="korg-admin-section" id="admin-sec-points">

        <!-- Award Points Form Card -->
        <div class="korg-admin-form-card">
          <h3 style="color: #fff; margin: 0 0 0.5rem; font-size: 1.2rem; display: flex; align-items: center; gap: 0.5rem;">
            <span>⚡</span> Award / Modify Player Combat Points (CP)
          </h3>
          <p style="color: #94a3b8; font-size: 0.85rem; margin: 0 0 1rem;">
            Select an existing player or enter their @handle/name to award or deduct CP and update match stats.
          </p>

          <form id="admin-award-points-form" style="display: flex; flex-direction: column; gap: 1rem;">
            <div class="korg-admin-form-row">
              <div>
                <label class="korg-admin-label">Player @Handle or Name</label>
                <input type="text" id="adm-pt-identifier" class="korg-admin-input" placeholder="e.g. @skie or Prince Nanda" required list="adm-players-datalist" />
                <datalist id="adm-players-datalist"></datalist>
              </div>
              <div>
                <label class="korg-admin-label">Points to Add / Deduct (+CP / -CP)</label>
                <input type="number" id="adm-pt-delta" class="korg-admin-input" placeholder="e.g. 25 or -10" required />
              </div>
            </div>

            <!-- Preset Points Buttons -->
            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
              <span style="font-size: 0.76rem; color: #94a3b8; align-self: center; margin-right: 0.3rem;">Presets:</span>
              <button type="button" class="korg-btn-outline adm-preset-btn" data-preset="10">+10 (Match Win)</button>
              <button type="button" class="korg-btn-outline adm-preset-btn" data-preset="25">+25 (Scrim MVP)</button>
              <button type="button" class="korg-btn-outline adm-preset-btn" data-preset="50">+50 (Weekly Winner)</button>
              <button type="button" class="korg-btn-outline adm-preset-btn" data-preset="100">+100 (Championship)</button>
              <button type="button" class="korg-btn-outline adm-preset-btn" data-preset="-10" style="color: #ef4444;">-10 (Penalty)</button>
            </div>

            <div class="korg-admin-form-row">
              <div>
                <label class="korg-admin-label">Increment Matches (+1)</label>
                <input type="number" id="adm-pt-matches" class="korg-admin-input" value="1" min="0" />
              </div>
              <div>
                <label class="korg-admin-label">Increment Wins (+1)</label>
                <input type="number" id="adm-pt-wins" class="korg-admin-input" value="1" min="0" />
              </div>
              <div>
                <label class="korg-admin-label">Department</label>
                <input type="text" id="adm-pt-dept" class="korg-admin-input" placeholder="e.g. Computer Science" />
              </div>
            </div>

            <button type="submit" class="korg-btn-primary" style="align-self: flex-start;">
              Apply Points & Update Standings
            </button>
          </form>
        </div>

        <!-- Live Standings Snapshot with Admin Controls -->
        <div class="korg-standings-card">
          <div style="padding: 1.2rem 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.08); display: flex; justify-content: space-between; align-items: center;">
            <h3 style="color: #fff; margin: 0; font-size: 1.1rem;">Current Leaderboard Points Roster</h3>
            <button id="adm-refresh-standings-btn" class="korg-btn-outline" style="font-size: 0.75rem; padding: 0.3rem 0.7rem;">
              ↻ Refresh Standings
            </button>
          </div>
          <div class="korg-standings-table-wrapper">
            <table class="korg-standings-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Player</th>
                  <th>Tier</th>
                  <th>Matches</th>
                  <th>Wins</th>
                  <th>Win Rate</th>
                  <th>Combat Points (CP)</th>
                  <th style="text-align: right;">Quick +CP</th>
                </tr>
              </thead>
              <tbody id="adm-standings-table-body">
                <tr><td colspan="8" style="text-align: center; color: #94a3b8; padding: 2rem;">Loading standings...</td></tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  `;

  // Attach Admin Tabs
  container.querySelectorAll('[data-admin-tab]').forEach(tab => {
    tab.addEventListener('click', () => {
      container.querySelectorAll('[data-admin-tab]').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const target = tab.getAttribute('data-admin-tab');
      document.querySelectorAll('.korg-admin-section').forEach(s => s.classList.remove('active'));
      const sec = document.getElementById(`admin-sec-${target}`);
      if (sec) sec.classList.add('active');
    });
  });

  // Logout
  const logoutBtn = document.getElementById('admin-logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      sessionStorage.removeItem('korg_admin_token');
      isAdminAuthenticated = false;
      renderAdminView(container);
    });
  }

  // Preset buttons
  container.querySelectorAll('.adm-preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const preset = btn.getAttribute('data-preset');
      const input = document.getElementById('adm-pt-delta');
      if (input) input.value = preset;
    });
  });

  // Form: Create Event
  const formCreateEvent = document.getElementById('admin-create-event-form');
  if (formCreateEvent) {
    formCreateEvent.addEventListener('submit', async (e) => {
      e.preventDefault();
      const title = document.getElementById('adm-ev-title').value.trim();
      const game = document.getElementById('adm-ev-game').value;
      const date = document.getElementById('adm-ev-date').value.trim();
      const prizePool = document.getElementById('adm-ev-prize').value.trim();
      const maxSquads = parseInt(document.getElementById('adm-ev-max').value, 10) || 24;
      const badge = document.getElementById('adm-ev-badge').value;
      const tag = document.getElementById('adm-ev-tag').value;
      const status = document.getElementById('adm-ev-status').value;
      const description = document.getElementById('adm-ev-desc').value.trim();

      const gameNames = {
        freefire: 'Free Fire',
        bgmi: 'BGMI',
        valorant: 'Valorant',
        mobalegends: 'Mobile Legends'
      };

      try {
        const res = await fetch('/api/admin/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            game,
            gameName: gameNames[game] || 'eSports',
            date,
            prizePool,
            maxSquads,
            registeredSquads: 0,
            badge,
            tag,
            status,
            description,
            icon: `assets/logos/${game}.png`
          })
        });
        const data = await res.json();
        if (data.success) {
          formCreateEvent.reset();
          showAdminToast(`Event "${title}" published with prize pool ${prizePool}!`);
          loadAdminEvents();
          fetchEvents(); // update public events module
        } else {
          alert(data.error || 'Failed to save event');
        }
      } catch (err) {
        console.error(err);
        alert('Server error creating event');
      }
    });
  }

  // Form: Award Points
  const formAwardPoints = document.getElementById('admin-award-points-form');
  if (formAwardPoints) {
    formAwardPoints.addEventListener('submit', async (e) => {
      e.preventDefault();
      const identifier = document.getElementById('adm-pt-identifier').value.trim();
      const pointsDelta = parseInt(document.getElementById('adm-pt-delta').value, 10);
      const matches = parseInt(document.getElementById('adm-pt-matches').value, 10) || 0;
      const wins = parseInt(document.getElementById('adm-pt-wins').value, 10) || 0;
      const dept = document.getElementById('adm-pt-dept').value.trim();

      try {
        const res = await fetch('/api/admin/players/points', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            identifier,
            pointsDelta,
            details: { matches, wins, dept }
          })
        });
        const data = await res.json();
        if (data.success) {
          formAwardPoints.reset();
          showAdminToast(data.message || `Awarded CP to ${identifier}!`);
          loadAdminStandings();
          fetchStandings(); // update public standings table
        } else {
          alert(data.error || 'Failed to award points');
        }
      } catch (err) {
        console.error(err);
        alert('Server error awarding points');
      }
    });
  }

  // Refresh buttons
  const btnRefEvents = document.getElementById('adm-refresh-events-btn');
  if (btnRefEvents) btnRefEvents.addEventListener('click', loadAdminEvents);

  const btnRefStandings = document.getElementById('adm-refresh-standings-btn');
  if (btnRefStandings) btnRefStandings.addEventListener('click', loadAdminStandings);

  loadAdminData();
}

async function loadAdminData() {
  await Promise.all([loadAdminEvents(), loadAdminStandings()]);
}

async function loadAdminEvents() {
  const tbody = document.getElementById('adm-events-table-body');
  if (!tbody) return;

  try {
    const res = await fetch('/api/events');
    const data = await res.json();
    if (data.success && Array.isArray(data.data)) {
      cachedEvents = data.data;
      renderAdminEventsTable(cachedEvents, tbody);
    }
  } catch (e) {
    console.error('Error loading admin events:', e);
  }
}

function renderAdminEventsTable(events, tbody) {
  if (!events || events.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: #94a3b8; padding: 2rem;">No events created yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = events.map(ev => {
    const evId = ev.id || ev._id;
    return `
    <tr data-admin-ev-id="${evId}">
      <td>
        <strong style="color: #fff;">${ev.title}</strong>
      </td>
      <td><span class="korg-pill-tag korg-pill-type">${ev.gameName || ev.game}</span></td>
      <td style="font-size: 0.82rem; color: #94a3b8;">${ev.date}</td>
      <td>
        <div style="display: flex; align-items: center; gap: 0.4rem;">
          <input type="text" class="korg-admin-input adm-prize-input" value="${ev.prizePool || '₹400'}" style="width: 90px; margin-bottom: 0; padding: 0.35rem 0.5rem; font-size: 0.85rem;" />
          <button class="korg-btn-outline adm-update-prize-btn" data-ev-id="${evId}" style="padding: 0.35rem 0.6rem; font-size: 0.75rem;">
            Save
          </button>
        </div>
      </td>
      <td style="font-size: 0.85rem; color: #cbd5e1;">${ev.registeredSquads || 0} / ${ev.maxSquads || 24}</td>
      <td>
        <select class="korg-admin-input adm-status-select" data-ev-id="${evId}" style="width: 110px; margin-bottom: 0; padding: 0.3rem; font-size: 0.8rem; background: #0f172a;">
          <option value="upcoming" ${ev.status === 'upcoming' ? 'selected' : ''}>Upcoming</option>
          <option value="live" ${ev.status === 'live' ? 'selected' : ''}>Live</option>
          <option value="completed" ${ev.status === 'completed' ? 'selected' : ''}>Completed</option>
        </select>
      </td>
      <td style="text-align: right;">
        <button class="korg-btn-outline adm-delete-ev-btn" data-ev-id="${evId}" style="color: #ef4444; border-color: rgba(239,68,68,0.3); padding: 0.3rem 0.6rem; font-size: 0.75rem;">
          Delete
        </button>
      </td>
    </tr>
  `;
  }).join('');

  // Attach Save Prize button
  tbody.querySelectorAll('.adm-update-prize-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const evId = btn.getAttribute('data-ev-id');
      const row = btn.closest('tr');
      const input = row.querySelector('.adm-prize-input');
      const newPrize = input.value.trim();

      try {
        const res = await fetch('/api/admin/events/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: evId, prizePool: newPrize })
        });
        const data = await res.json();
        if (data.success) {
          showAdminToast(`Prize pool updated to ${newPrize}!`);
          fetchEvents(); // sync public view
        } else {
          alert('Failed to update prize pool');
        }
      } catch (err) {
        alert('Server error updating prize pool');
      }
    });
  });

  // Attach Status Change dropdown
  tbody.querySelectorAll('.adm-status-select').forEach(sel => {
    sel.addEventListener('change', async () => {
      const evId = sel.getAttribute('data-ev-id');
      const newStatus = sel.value;

      try {
        const res = await fetch('/api/admin/events/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: evId, status: newStatus })
        });
        const data = await res.json();
        if (data.success) {
          showAdminToast(`Event status updated to "${newStatus}"!`);
          fetchEvents();
        }
      } catch (err) {
        alert('Error updating status');
      }
    });
  });

  // Attach Delete Event
  tbody.querySelectorAll('.adm-delete-ev-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const evId = btn.getAttribute('data-ev-id');
      if (!confirm('Are you sure you want to delete this tournament?')) return;

      try {
        const res = await fetch('/api/admin/events/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: evId })
        });
        const data = await res.json();
        if (data.success) {
          showAdminToast('Event deleted.');
          loadAdminEvents();
          fetchEvents();
        }
      } catch (err) {
        alert('Error deleting event');
      }
    });
  });
}

async function loadAdminStandings() {
  const tbody = document.getElementById('adm-standings-table-body');
  const datalist = document.getElementById('adm-players-datalist');
  if (!tbody) return;

  try {
    const res = await fetch('/api/standings');
    const data = await res.json();
    if (data.success && Array.isArray(data.data)) {
      cachedPlayers = data.data;

      // Update datalist for auto-complete
      if (datalist) {
        datalist.innerHTML = cachedPlayers.map(p => `
          <option value="${p.handle}">${p.name} (${p.dept || 'Campus'})</option>
        `).join('');
      }

      renderAdminStandingsTable(cachedPlayers, tbody);
    }
  } catch (e) {
    console.error('Error loading admin standings:', e);
  }
}

function renderAdminStandingsTable(players, tbody) {
  if (!players || players.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: #94a3b8; padding: 2rem;">No players in standings.</td></tr>`;
    return;
  }

  tbody.innerHTML = players.map(p => `
    <tr>
      <td class="korg-rank-cell">#${p.rank}</td>
      <td>
        <div class="korg-player-cell">
          <div class="korg-player-avatar" style="width: 32px; height: 32px; font-size: 1rem;">${p.avatar || '🎮'}</div>
          <div class="korg-player-meta">
            <span class="korg-player-name" style="font-size: 0.88rem;">${p.name}</span>
            <span class="korg-player-sub">${p.handle}</span>
          </div>
        </div>
      </td>
      <td><span class="korg-tier-badge">${p.tier || 'Bronze'}</span></td>
      <td style="text-align: center;">${p.matches || 0}</td>
      <td style="text-align: center;">${p.wins || 0}</td>
      <td style="text-align: center; color: #38bdf8;">${p.winRate || '0%'}</td>
      <td><span class="korg-cp-pill" style="font-size: 0.82rem; padding: 0.2rem 0.5rem;">${p.cp || 0} CP</span></td>
      <td style="text-align: right;">
        <button class="korg-btn-outline adm-quick-award-btn" data-player-handle="${p.handle}" data-delta="25" style="padding: 0.25rem 0.6rem; font-size: 0.72rem; color: #00f0ff; border-color: rgba(0,240,255,0.3);">
          +25 CP
        </button>
      </td>
    </tr>
  `).join('');

  // Attach quick award listeners
  tbody.querySelectorAll('.adm-quick-award-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const handle = btn.getAttribute('data-player-handle');
      const delta = parseInt(btn.getAttribute('data-delta'), 10);

      try {
        const res = await fetch('/api/admin/players/points', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            identifier: handle,
            pointsDelta: delta,
            details: { matches: 1, wins: 1 }
          })
        });
        const data = await res.json();
        if (data.success) {
          showAdminToast(`+${delta} CP awarded to ${handle}!`);
          loadAdminStandings();
          fetchStandings();
        }
      } catch (err) {
        alert('Error awarding quick points');
      }
    });
  });
}

function showAdminToast(msg) {
  const toast = document.createElement('div');
  toast.style.position = 'fixed';
  toast.style.bottom = '2rem';
  toast.style.right = '2rem';
  toast.style.background = '#00f0ff';
  toast.style.color = '#030508';
  toast.style.padding = '0.75rem 1.4rem';
  toast.style.borderRadius = '8px';
  toast.style.fontWeight = '700';
  toast.style.zIndex = '99999';
  toast.style.boxShadow = '0 10px 30px rgba(0,240,255,0.4)';
  toast.textContent = `🛡️ ${msg}`;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}
