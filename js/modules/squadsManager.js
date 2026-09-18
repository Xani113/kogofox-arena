/**
 * squadsManager.js
 * Player Finder & Squads LFG view manager
 * Matches Screenshot 1: squads roster, slots meter, mic badge, and join requests
 */

let currentSquads = [];
let activeGameFilter = 'all';

export function getAuthUser() {
  try {
    const raw = localStorage.getItem('korg_user_session') || localStorage.getItem('korg_user');
    if (raw) {
      const user = JSON.parse(raw);
      if (user && (user.id || user.email || user.username)) {
        return user;
      }
    }
  } catch (e) {}
  if (window.kugofoxApp && window.kugofoxApp.currentUser) {
    return window.kugofoxApp.currentUser;
  }
  if (window.kugofox && window.kugofox.currentUser) {
    return window.kugofox.currentUser;
  }
  return null;
}

export function openCreateSquadModal(user = null) {
  const createModal = document.getElementById('modal-create-squad');
  if (!createModal) return;

  const currentUser = user || getAuthUser();
  const leaderInput = document.getElementById('new-squad-leader');
  if (leaderInput && currentUser) {
    const preferredName = currentUser.username || currentUser.fullName || currentUser.inGameName || '';
    if (preferredName) {
      leaderInput.value = preferredName;
    }
  }

  createModal.classList.add('open');
  setTimeout(() => {
    document.getElementById('new-squad-name')?.focus();
  }, 100);
}

export function handleCreateSquadClick() {
  const user = getAuthUser();
  if (!user) {
    // 1. Not logged in! Set pending action flag to resume immediately after login/signup
    sessionStorage.setItem('korg_pending_action', 'create_squad');

    // 2. Alert notification toast
    showNotification('Please log in or sign up first to create a squad.', 'info');

    // 3. Redirect to login / sign up modal
    const app = window.kugofoxApp || window.kugofox;
    if (app && app.authModal) {
      app.authModal.open('login', 'Please log in or create an account to create your squad.');
    } else {
      window.location.hash = 'login';
      document.getElementById('sign-in-btn')?.click();
    }
    return;
  }

  // Already logged in! Open create squad modal directly
  openCreateSquadModal(user);
}

export function initSquadsManager() {
  const container = document.getElementById('view-squads');
  if (!container) return;

  // Render scaffold
  renderSquadsScaffold(container);

  // Initial fetch
  fetchSquads();

  // Listen for view switch to squads
  window.addEventListener('korg:viewChanged', (e) => {
    if (e.detail && e.detail.view === 'squads') {
      fetchSquads();
    }
  });

  // Automatically resume squad creation when user finishes logging in or signing up
  window.addEventListener('korg:userLoggedIn', (e) => {
    const pending = sessionStorage.getItem('korg_pending_action');
    if (pending === 'create_squad') {
      sessionStorage.removeItem('korg_pending_action');
      if (typeof window.switchView === 'function') {
        window.switchView('squads');
      }
      setTimeout(() => {
        openCreateSquadModal(e.detail?.user);
        showNotification('Signed in! You can now create your squad.', 'success');
      }, 400);
    }
  });
}

function renderSquadsScaffold(container) {
  container.innerHTML = `
    <div class="korg-view-header">
      <div class="korg-view-title-row">
        <div>
          <h1 class="korg-view-title">
            <span>PLAYER FINDER</span>
            <span style="color: #00f0ff; font-weight: 400; font-size: 1.4rem;">/ Squads LFG</span>
          </h1>
          <p class="korg-view-subtitle">
            Find teammates, join campus squads, or recruit players for upcoming scrims and collegiate tournaments.
          </p>
        </div>
        <button id="btn-create-squad-modal" class="korg-btn-primary">
          <span style="font-size: 1.1rem;">+</span> Create Squad
        </button>
      </div>

      <!-- Filter pills -->
      <div class="korg-filter-bar" id="squads-filter-bar">
        <button class="korg-filter-pill active" data-game="all">All Games</button>
        <button class="korg-filter-pill" data-game="freefire">Free Fire</button>
        <button class="korg-filter-pill" data-game="bgmi">BGMI</button>
        <button class="korg-filter-pill" data-game="valorant">Valorant</button>
        <button class="korg-filter-pill" data-game="mobalegends">Mobile Legends</button>
      </div>
    </div>

    <!-- Squads Card Grid -->
    <div class="korg-squads-grid" id="squads-grid-container">
      <div style="color: #94a3b8; padding: 2rem; text-align: center; grid-column: 1 / -1;">
        Loading active campus squads...
      </div>
    </div>

    <!-- Create Squad Modal -->
    <div id="modal-create-squad" class="korg-modal-overlay">
      <div class="korg-modal-box">
        <button class="korg-modal-close" id="btn-close-create-squad">&times;</button>
        <h2 style="color: #fff; margin-top: 0; font-size: 1.4rem; display: flex; align-items: center; gap: 0.5rem;">
          <span>⚡</span> Create New Squad
        </h2>
        <p style="color: #94a3b8; font-size: 0.85rem; margin-bottom: 1.5rem;">
          Recruit campus teammates for upcoming tournaments and scrim matches.
        </p>

        <form id="form-create-squad" style="display: flex; flex-direction: column; gap: 1rem;">
          <div>
            <label class="korg-admin-label">Squad Name</label>
            <input type="text" id="new-squad-name" class="korg-admin-input" placeholder="e.g. Shadow Vipers" required />
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div>
              <label class="korg-admin-label">Game Title</label>
              <select id="new-squad-game" class="korg-admin-input" style="background: #0f172a;">
                <option value="freefire">Free Fire</option>
                <option value="bgmi">BGMI</option>
                <option value="valorant">Valorant</option>
                <option value="mobalegends">Mobile Legends</option>
              </select>
            </div>
            <div>
              <label class="korg-admin-label">Total Slots</label>
              <select id="new-squad-slots" class="korg-admin-input" style="background: #0f172a;">
                <option value="4">4 Players (Squad)</option>
                <option value="2">2 Players (Duo)</option>
                <option value="5">5 Players (MOBA / Tactical)</option>
                <option value="6">6 Players (Squad + Subs)</option>
              </select>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div>
              <label class="korg-admin-label">Leader IGN / Name</label>
              <input type="text" id="new-squad-leader" class="korg-admin-input" placeholder="Your in-game name" required />
            </div>
            <div>
              <label class="korg-admin-label">Mic Required</label>
              <select id="new-squad-mic" class="korg-admin-input" style="background: #0f172a;">
                <option value="true">Yes (MIC ON)</option>
                <option value="false">No (MIC OPTIONAL)</option>
              </select>
            </div>
          </div>

          <button type="submit" class="korg-btn-primary" style="margin-top: 0.5rem; justify-content: center;">
            Confirm & Publish Squad
          </button>
        </form>
      </div>
    </div>

    <!-- Join Squad Prompt Modal -->
    <div id="modal-join-squad" class="korg-modal-overlay">
      <div class="korg-modal-box">
        <button class="korg-modal-close" id="btn-close-join-squad">&times;</button>
        <h2 style="color: #fff; margin-top: 0; font-size: 1.4rem; display: flex; align-items: center; gap: 0.5rem;">
          <span>🎯</span> Request to Join Squad
        </h2>
        <p id="join-squad-subtitle" style="color: #94a3b8; font-size: 0.85rem; margin-bottom: 1.5rem;">
          Submit your application to the squad captain.
        </p>

        <form id="form-join-squad" style="display: flex; flex-direction: column; gap: 1rem;">
          <input type="hidden" id="join-squad-target-id" value="" />
          <div>
            <label class="korg-admin-label">Your IGN / Name</label>
            <input type="text" id="join-player-name" class="korg-admin-input" placeholder="e.g. Vortex_99" required />
          </div>

          <div>
            <label class="korg-admin-label">Preferred Role</label>
            <select id="join-player-role" class="korg-admin-input" style="background: #0f172a;">
              <option value="Assaulter / Rusher">Assaulter / Rusher</option>
              <option value="Sniper">Sniper</option>
              <option value="Support / Healer">Support / Healer</option>
              <option value="Scout / Flanker">Scout / Flanker</option>
              <option value="Strategist">Strategist</option>
            </select>
          </div>

          <button type="submit" class="korg-btn-primary" style="margin-top: 0.5rem; justify-content: center;">
            Send Join Request
          </button>
        </form>
      </div>
    </div>
  `;

  // Filter clicks
  container.querySelectorAll('#squads-filter-bar .korg-filter-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('#squads-filter-bar .korg-filter-pill').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeGameFilter = btn.getAttribute('data-game');
      fetchSquads();
    });
  });

  // Modal events
  const createModal = document.getElementById('modal-create-squad');
  const btnOpenCreate = document.getElementById('btn-create-squad-modal');
  const btnCloseCreate = document.getElementById('btn-close-create-squad');

  if (btnOpenCreate && createModal) {
    btnOpenCreate.addEventListener('click', () => handleCreateSquadClick());
  }
  if (btnCloseCreate && createModal) {
    btnCloseCreate.addEventListener('click', () => createModal.classList.remove('open'));
  }

  const joinModal = document.getElementById('modal-join-squad');
  const btnCloseJoin = document.getElementById('btn-close-join-squad');
  if (btnCloseJoin && joinModal) {
    btnCloseJoin.addEventListener('click', () => joinModal.classList.remove('open'));
  }

  // Create Squad Form Submit
  const formCreate = document.getElementById('form-create-squad');
  if (formCreate) {
    formCreate.addEventListener('submit', async (e) => {
      e.preventDefault();

      const user = getAuthUser();
      if (!user) {
        sessionStorage.setItem('korg_pending_action', 'create_squad');
        if (createModal) createModal.classList.remove('open');
        showNotification('Please log in or sign up first to create your squad.', 'info');
        const app = window.kugofoxApp || window.kugofox;
        if (app && app.authModal) {
          app.authModal.open('login', 'Please log in or create an account to create your squad.');
        } else {
          window.location.hash = 'login';
          document.getElementById('sign-in-btn')?.click();
        }
        return;
      }

      const squadName = document.getElementById('new-squad-name').value.trim();
      const game = document.getElementById('new-squad-game').value;
      const totalSlots = parseInt(document.getElementById('new-squad-slots').value, 10);
      const leader = document.getElementById('new-squad-leader').value.trim() || user.username || user.fullName || 'Captain';
      const micRequired = document.getElementById('new-squad-mic').value === 'true';

      const gameNames = {
        freefire: 'Free Fire',
        bgmi: 'BGMI',
        valorant: 'Valorant',
        mobalegends: 'Mobile Legends'
      };

      const token = localStorage.getItem('korg_auth_token');
      const isHttpAvatar = typeof user.avatar === 'string' && (user.avatar.startsWith('http://') || user.avatar.startsWith('https://'));

      try {
        const res = await fetch('/api/squads', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: JSON.stringify({
            name: squadName,
            game,
            gameName: gameNames[game] || 'eSports',
            totalSlots,
            leader,
            micRequired,
            creatorId: user.id || null,
            creatorEmail: user.email || null,
            avatarImg: isHttpAvatar ? user.avatar : null,
            avatarIcon: !isHttpAvatar && user.avatar ? user.avatar : null,
            color: ['#00b4d8', '#7b2cbf', '#ff4655', '#22c55e'][Math.floor(Math.random() * 4)],
            roster: [{
              name: leader,
              role: 'Captain / IGL',
              avatar: (!isHttpAvatar && user.avatar) ? user.avatar : '👑'
            }]
          })
        });

        const data = await res.json();
        if (data.success) {
          createModal.classList.remove('open');
          formCreate.reset();
          showNotification(`Squad "${squadName}" created successfully!`, 'success');
          fetchSquads();
        } else {
          alert(data.error || 'Failed to create squad');
        }
      } catch (err) {
        console.error(err);
        alert('Network error while creating squad');
      }
    });
  }

  // Join Squad Form Submit
  const formJoin = document.getElementById('form-join-squad');
  if (formJoin) {
    formJoin.addEventListener('submit', async (e) => {
      e.preventDefault();
      const squadId = document.getElementById('join-squad-target-id').value;
      const playerName = document.getElementById('join-player-name').value.trim();
      const playerRole = document.getElementById('join-player-role').value;

      try {
        const res = await fetch('/api/squads/join', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            squadId,
            name: playerName,
            role: playerRole,
            avatar: '🎮'
          })
        });

        const data = await res.json();
        if (data.success) {
          joinModal.classList.remove('open');
          formJoin.reset();
          showNotification(`Joined squad "${data.data.name}"!`, 'success');
          fetchSquads();
        } else {
          alert(data.message || 'Could not join squad');
        }
      } catch (err) {
        console.error(err);
        alert('Network error while joining squad');
      }
    });
  }
}

export async function fetchSquads() {
  const container = document.getElementById('squads-grid-container');
  if (!container) return;

  try {
    const url = activeGameFilter && activeGameFilter !== 'all'
      ? `/api/squads?game=${activeGameFilter}`
      : '/api/squads';
    const res = await fetch(url);
    const result = await res.json();

    if (result.success && Array.isArray(result.data)) {
      currentSquads = result.data;
      renderSquadCards(currentSquads, container);
    } else {
      container.innerHTML = `<div style="color: #ef4444; padding: 2rem;">Failed to load squads.</div>`;
    }
  } catch (e) {
    console.error('Error fetching squads:', e);
  }
}

function renderSquadCards(squads, container) {
  if (!squads || squads.length === 0) {
    container.innerHTML = `
      <div style="color: #94a3b8; padding: 4rem 2rem; text-align: center; grid-column: 1 / -1; background: rgba(13,17,23,0.65); border: 1px dashed rgba(0, 240, 255, 0.25); border-radius: 14px; display: flex; flex-direction: column; align-items: center; gap: 1rem; box-shadow: 0 10px 30px rgba(0,0,0,0.4);">
        <div style="font-size: 3rem; filter: drop-shadow(0 0 16px rgba(0,240,255,0.4));">🛡️</div>
        <h3 style="color: #fff; font-size: 1.35rem; margin: 0; font-weight: 700; letter-spacing: 0.5px;">NO ACTIVE SQUADS FOUND</h3>
        <p style="margin: 0; max-width: 480px; font-size: 0.92rem; line-height: 1.6; color: #94a3b8;">
          All pre-made squads have been cleared. Be the first to build a squad, recruit campus teammates, and conquer collegiate tournaments!
        </p>
        <button id="btn-create-squad-empty" class="korg-btn-primary" style="margin-top: 0.6rem; padding: 0.75rem 1.75rem; font-size: 0.95rem;">
          <span style="font-size: 1.1rem;">+</span> Create First Squad
        </button>
      </div>
    `;
    const emptyBtn = container.querySelector('#btn-create-squad-empty');
    if (emptyBtn) {
      emptyBtn.addEventListener('click', () => handleCreateSquadClick());
    }
    return;
  }

  container.innerHTML = squads.map(sq => {
    const isFull = (sq.filledSlots || 0) >= (sq.totalSlots || 4);
    const letter = sq.letter || (sq.name ? sq.name[0].toUpperCase() : 'S');
    const color = sq.color || '#ff4655';

    // Build slot dots
    const dots = [];
    for (let i = 0; i < (sq.totalSlots || 4); i++) {
      if (i < (sq.filledSlots || 0)) {
        dots.push(`<span class="korg-slot-dot filled"></span>`);
      } else {
        dots.push(`<span class="korg-slot-dot empty"></span>`);
      }
    }

    // Avatar preview
    let avatarMarkup = '';
    if (sq.avatarImg) {
      avatarMarkup = `<img src="${sq.avatarImg}" alt="${sq.name}" class="korg-squad-avatar" style="object-fit: cover;" />`;
    } else if (sq.avatarIcon) {
      avatarMarkup = `<div class="korg-squad-avatar" style="background: rgba(255,255,255,0.08);">${sq.avatarIcon}</div>`;
    } else {
      avatarMarkup = `<div class="korg-squad-avatar" style="background: ${color};">${letter}</div>`;
    }

    // Roster members
    const rosterList = (sq.roster || []).map(m => `
      <div class="korg-roster-member">
        <div class="korg-roster-member-left">
          <span>${m.avatar || '👤'}</span>
          <span>${m.name}</span>
        </div>
        <span class="korg-roster-member-role">${m.role || 'Member'}</span>
      </div>
    `).join('');

    return `
      <div class="korg-squad-card" data-squad-id="${sq.id}">
        <div class="korg-squad-card-top">
          <div class="korg-squad-identity">
            ${avatarMarkup}
            <div class="korg-squad-names">
              <h3 class="korg-squad-title">${sq.name}</h3>
              <span class="korg-squad-game">${sq.gameName || 'eSports'}</span>
            </div>
          </div>
          <div class="korg-squad-badges">
            <span class="korg-pill-tag korg-pill-type">${sq.type || 'SQUAD'}</span>
            <span class="korg-pill-tag ${isFull ? 'korg-pill-full' : 'korg-pill-open'}">
              ${isFull ? 'FULL' : 'OPEN'}
            </span>
            <span class="korg-pill-tag korg-pill-mic">
              <span>🎙️</span> ${sq.micRequired ? 'MIC ON' : 'MIC OFF'}
            </span>
          </div>
        </div>

        <div class="korg-squad-mid">
          <div class="korg-slots-wrapper">
            <span class="korg-slots-label">SLOTS: ${sq.filledSlots || 0} / ${sq.totalSlots || 4}</span>
            <div class="korg-slot-dots">
              ${dots.join('')}
            </div>
          </div>
          <div class="korg-squad-leader">
            Leader: <strong>${sq.leader || 'Captain'}</strong>
          </div>
        </div>

        <div class="korg-squad-bottom">
          <button class="korg-roster-btn" data-toggle-roster="${sq.id}">
            <span>Roster (${sq.roster ? sq.roster.length : sq.filledSlots || 0})</span>
            <span class="korg-caret" style="transition: transform 0.2s;">▾</span>
          </button>
          <button class="korg-join-squad-btn" data-join-squad="${sq.id}" ${isFull ? 'disabled' : ''}>
            ${isFull ? 'Squad Full' : 'Request to Join'}
          </button>
        </div>

        <!-- Collapsible Roster list -->
        <div class="korg-roster-drawer" id="roster-drawer-${sq.id}">
          ${rosterList}
        </div>
      </div>
    `;
  }).join('');

  // Attach toggle roster listeners
  container.querySelectorAll('[data-toggle-roster]').forEach(btn => {
    btn.addEventListener('click', () => {
      const sqId = btn.getAttribute('data-toggle-roster');
      const drawer = document.getElementById(`roster-drawer-${sqId}`);
      const caret = btn.querySelector('.korg-caret');
      if (drawer) {
        drawer.classList.toggle('open');
        if (caret) {
          caret.style.transform = drawer.classList.contains('open') ? 'rotate(180deg)' : 'rotate(0deg)';
        }
      }
    });
  });

  // Attach join squad listeners
  container.querySelectorAll('[data-join-squad]').forEach(btn => {
    btn.addEventListener('click', () => {
      const sqId = btn.getAttribute('data-join-squad');
      const squad = currentSquads.find(s => s.id === sqId);
      if (!squad) return;

      const joinModal = document.getElementById('modal-join-squad');
      const joinTargetInput = document.getElementById('join-squad-target-id');
      const subtitle = document.getElementById('join-squad-subtitle');

      if (joinModal && joinTargetInput) {
        joinTargetInput.value = sqId;
        if (subtitle) {
          subtitle.textContent = `Apply to join ${squad.name} (${squad.gameName}) led by ${squad.leader}.`;
        }
        joinModal.classList.add('open');
      }
    });
  });
}

function showNotification(msg, type = 'info') {
  const toast = document.createElement('div');
  toast.style.position = 'fixed';
  toast.style.bottom = '2rem';
  toast.style.right = '2rem';
  toast.style.background = type === 'success' ? '#10b981' : '#00f0ff';
  toast.style.color = '#030508';
  toast.style.padding = '0.75rem 1.4rem';
  toast.style.borderRadius = '8px';
  toast.style.fontWeight = '700';
  toast.style.zIndex = '9999';
  toast.style.boxShadow = '0 10px 25px rgba(0,0,0,0.5)';
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}
