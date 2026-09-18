/**
 * eventsManager.js
 * Campus Scrims & Tournaments view manager
 * Matches Screenshot 4: Upcoming/Live/Completed tabs, ₹400 prize pool badge, capacity meter, registration
 */

let allEvents = [];
let activeStatusTab = 'upcoming';
let activeGameFilter = 'all';

export function initEventsManager() {
  const container = document.getElementById('view-events');
  if (!container) return;

  renderEventsScaffold(container);
  fetchEvents();

  window.addEventListener('korg:viewChanged', (e) => {
    if (e.detail && e.detail.view === 'events') {
      const targetGame = e.detail.game || activeGameFilter;
      if (e.detail.game) {
        filterEventsByGame(e.detail.game);
      }
      fetchEvents(targetGame);
    }
  });

  window.addEventListener('korg:eventsUpdated', (e) => {
    if (e.detail && Array.isArray(e.detail.events)) {
      allEvents = e.detail.events;
      renderEventCards(filterEvents());
    } else {
      fetchEvents();
    }
  });
}

export function filterEventsByGame(gameId) {
  if (!gameId) return;
  activeGameFilter = gameId;

  // Auto-switch status tab if no events exist in the current tab for this game
  if (gameId !== 'all' && allEvents && allEvents.length > 0) {
    const hasInCurrentTab = allEvents.some(ev => ev.game === gameId && (!activeStatusTab || ev.status === activeStatusTab));
    if (!hasInCurrentTab) {
      const matching = allEvents.filter(ev => ev.game === gameId);
      if (matching.length > 0) {
        const preferred = matching.find(e => e.status === 'upcoming')?.status ||
                          matching.find(e => e.status === 'live')?.status ||
                          matching[0].status;
        if (preferred) {
          activeStatusTab = preferred;
        }
      }
    }
  }

  // Update status tabs UI
  const container = document.getElementById('view-events');
  if (container) {
    container.querySelectorAll('[data-event-tab]').forEach(tab => {
      tab.classList.toggle('active', tab.getAttribute('data-event-tab') === activeStatusTab);
    });

    // Update filter pills UI
    container.querySelectorAll('#events-filter-bar .korg-filter-pill').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-game') === gameId);
    });
  }

  renderEventCards(filterEvents());
}

if (typeof window !== 'undefined') {
  window.filterEventsByGame = filterEventsByGame;
}

function renderEventsScaffold(container) {
  container.innerHTML = `
    <div class="korg-view-header">
      <div class="korg-view-title-row">
        <div>
          <h1 class="korg-view-title">
            <span>CAMPUS SCRIMS & TOURNAMENTS</span>
          </h1>
          <p class="korg-view-subtitle">
            Compete in daily scrims, weekly cups, and major campus championships for verified prize pools and Combat Points.
          </p>
        </div>
      </div>

      <!-- Navigation Status Tabs -->
      <div class="korg-events-status-tabs">
        <button class="korg-admin-tab-btn active" data-event-tab="upcoming">Upcoming</button>
        <button class="korg-admin-tab-btn" data-event-tab="live">Live Now</button>
        <button class="korg-admin-tab-btn" data-event-tab="completed">Completed</button>
      </div>

      <!-- Filter pills -->
      <div class="korg-filter-bar" id="events-filter-bar">
        <button class="korg-filter-pill active" data-game="all">All Games</button>
        <button class="korg-filter-pill" data-game="freefire">Free Fire</button>
        <button class="korg-filter-pill" data-game="bgmi">BGMI</button>
        <button class="korg-filter-pill" data-game="valorant">Valorant</button>
        <button class="korg-filter-pill" data-game="mobalegends">Mobile Legends</button>
      </div>
    </div>

    <!-- Events Grid -->
    <div class="korg-events-grid" id="events-grid-container">
      <div style="color: #94a3b8; padding: 2rem; text-align: center; grid-column: 1 / -1;">
        Loading scrims and tournaments...
      </div>
    </div>

    <!-- Quick Register Modal for Events -->
    <div id="modal-event-register" class="korg-modal-overlay">
      <div class="korg-modal-box">
        <button class="korg-modal-close" id="btn-close-event-register">&times;</button>
        <h2 style="color: #fff; margin-top: 0; font-size: 1.4rem; display: flex; align-items: center; gap: 0.5rem;">
          <span>🏆</span> Register for Tournament
        </h2>
        <p id="event-register-subtitle" style="color: #94a3b8; font-size: 0.85rem; margin-bottom: 1.5rem;">
          Secure your squad's slot before registration closes.
        </p>

        <form id="form-event-register" style="display: flex; flex-direction: column; gap: 1rem;">
          <input type="hidden" id="event-reg-target-id" value="" />
          <div>
            <label class="korg-admin-label">Squad / Team Name</label>
            <input type="text" id="event-reg-team" class="korg-admin-input" placeholder="e.g. Apex Predators" required />
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div>
              <label class="korg-admin-label">Captain IGN / Name</label>
              <input type="text" id="event-reg-captain" class="korg-admin-input" placeholder="Captain name" required />
            </div>
            <div>
              <label class="korg-admin-label">In-Game UID / ID</label>
              <input type="text" id="event-reg-gameid" class="korg-admin-input" placeholder="e.g. 1029384756" required />
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div>
              <label class="korg-admin-label">Contact Email</label>
              <input type="email" id="event-reg-email" class="korg-admin-input" placeholder="student@campus.edu" required />
            </div>
            <div>
              <label class="korg-admin-label">WhatsApp / Phone</label>
              <input type="tel" id="event-reg-phone" class="korg-admin-input" placeholder="+91 98765 43210" required />
            </div>
          </div>

          <button type="submit" class="korg-btn-primary" style="margin-top: 0.5rem; justify-content: center;">
            Confirm Registration
          </button>
        </form>
      </div>
    </div>
  `;

  // Status tab buttons
  container.querySelectorAll('[data-event-tab]').forEach(tab => {
    tab.addEventListener('click', () => {
      container.querySelectorAll('[data-event-tab]').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      activeStatusTab = tab.getAttribute('data-event-tab');
      renderEventCards(filterEvents());
    });
  });

  // Filter pills
  container.querySelectorAll('#events-filter-bar .korg-filter-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      const selectedGame = btn.getAttribute('data-game');
      filterEventsByGame(selectedGame);
    });
  });

  // Registration Modal Events
  const regModal = document.getElementById('modal-event-register');
  const btnCloseReg = document.getElementById('btn-close-event-register');
  if (btnCloseReg && regModal) {
    btnCloseReg.addEventListener('click', () => regModal.classList.remove('open'));
  }

  const formReg = document.getElementById('form-event-register');
  if (formReg) {
    formReg.addEventListener('submit', async (e) => {
      e.preventDefault();
      const eventId = document.getElementById('event-reg-target-id').value;
      const teamName = document.getElementById('event-reg-team').value.trim();
      const captainName = document.getElementById('event-reg-captain').value.trim();
      const gameId = document.getElementById('event-reg-gameid').value.trim();
      const email = document.getElementById('event-reg-email').value.trim();
      const phone = document.getElementById('event-reg-phone').value.trim();

      try {
        const res = await fetch('/api/tournaments/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tournamentId: eventId,
            teamName,
            captainName,
            gameId,
            gameType: 'freefire',
            email,
            phone
          })
        });

        const data = await res.json();
        if (data.success) {
          regModal.classList.remove('open');
          formReg.reset();
          // Locally increment registration count for feedback
          const ev = allEvents.find(ev => ev.id === eventId);
          if (ev) ev.registeredSquads = (ev.registeredSquads || 0) + 1;
          renderEventCards(filterEvents());

          showToast(`Squad "${teamName}" registered successfully! Slot confirmed.`, 'success');
        } else {
          alert(data.error || 'Registration failed');
        }
      } catch (err) {
        console.error(err);
        alert('Error submitting registration');
      }
    });
  }
}

export async function fetchEvents(targetGame = null) {
  try {
    const res = await fetch('/api/events');
    const result = await res.json();
    if (result.success && Array.isArray(result.data)) {
      allEvents = result.data;
      if (targetGame && targetGame !== 'all') {
        filterEventsByGame(targetGame);
      } else {
        renderEventCards(filterEvents());
      }
      window.dispatchEvent(new CustomEvent('korg:eventsUpdated', { detail: { events: allEvents } }));
    }
  } catch (e) {
    console.error('Error fetching events:', e);
  }
}

function filterEvents() {
  return allEvents.filter(ev => {
    const matchStatus = !activeStatusTab || ev.status === activeStatusTab;
    const matchGame = activeGameFilter === 'all' || ev.game === activeGameFilter;
    return matchStatus && matchGame;
  });
}

function renderEventCards(events) {
  const container = document.getElementById('events-grid-container');
  if (!container) return;

  if (!events || events.length === 0) {
    const gameLabel = activeGameFilter === 'all' ? 'All Games' : activeGameFilter.toUpperCase();
    container.innerHTML = `
      <div style="color: #94a3b8; padding: 3rem 1.5rem; text-align: center; grid-column: 1 / -1; background: rgba(13,17,23,0.5); border-radius: 14px; border: 1px dashed rgba(255,255,255,0.12);">
        <div style="font-size: 2.2rem; margin-bottom: 0.6rem;">⚔️</div>
        <h3 style="color: #ffffff; margin-bottom: 0.4rem; font-size: 1.25rem;">No events in "${activeStatusTab.toUpperCase()}" for ${gameLabel} right now.</h3>
        <p style="color: #94a3b8; font-size: 0.88rem; max-width: 480px; margin: 0 auto 1.4rem;">Check the other status tabs (Upcoming, Live Now, or Completed) or browse all collegiate tournaments.</p>
        <button class="korg-btn-primary" id="btn-events-show-all" style="margin: 0 auto;">Show All Tournaments</button>
      </div>
    `;
    document.getElementById('btn-events-show-all')?.addEventListener('click', () => {
      filterEventsByGame('all');
    });
    return;
  }

  container.innerHTML = events.map(ev => {
    const regCount = ev.registeredSquads || 0;
    const maxCount = ev.maxSquads || 24;
    const percentage = Math.min(100, Math.round((regCount / maxCount) * 100));

    return `
      <div class="korg-event-card" data-event-id="${ev.id || ev._id}">
        <div class="korg-event-top">
          <div class="korg-event-header-left">
            <div class="korg-event-badge-row">
              <span class="korg-event-badge">${ev.badge || 'TOURNAMENT'}</span>
              <span class="korg-event-badge" style="background: rgba(0,240,255,0.15); border-color: rgba(0,240,255,0.4); color: #00f0ff;">
                ${ev.tag || 'OPEN FOR ALL'}
              </span>
            </div>
            <h3 class="korg-event-title">${ev.title}</h3>
            <div class="korg-event-date">
              <span>📅</span>
              <span>${ev.date}</span>
            </div>
          </div>

          <div class="korg-prize-pool-pill">
            <span>🏆</span>
            <span>${ev.prizePool || '₹400'}</span>
          </div>
        </div>

        <p style="color: #cbd5e1; font-size: 0.84rem; line-height: 1.4; margin: 0;">
          ${ev.description || 'Collegiate squad competition. Battle for verified prize pool and Combat Points.'}
        </p>

        <div class="korg-capacity-section">
          <div class="korg-capacity-header">
            <span>Registration Capacity</span>
            <span style="color: #00f0ff; font-weight: 700;">${regCount} / ${maxCount} Squads</span>
          </div>
          <div class="korg-capacity-track">
            <div class="korg-capacity-fill" style="width: ${percentage}%;"></div>
          </div>
        </div>

        <div class="korg-event-actions">
          ${ev.status === 'completed'
            ? `<span style="color: #22c55e; font-weight: 700; font-size: 0.9rem;">Winner: ${ev.winner || 'Champion Squad'}</span>`
            : `<button class="korg-btn-primary" data-register-event="${ev.id}" style="flex: 1; justify-content: center;">
                Register Squad
              </button>
              <button class="korg-btn-outline" data-event-details="${ev.id}">
                Rules
              </button>`
          }
        </div>
      </div>
    `;
  }).join('');

  // Attach register click
  container.querySelectorAll('[data-register-event]').forEach(btn => {
    btn.addEventListener('click', () => {
      const evId = btn.getAttribute('data-register-event');
      const ev = allEvents.find(e => e.id === evId);
      if (!ev) return;

      const modal = document.getElementById('modal-event-register');
      const targetInput = document.getElementById('event-reg-target-id');
      const subtitle = document.getElementById('event-register-subtitle');

      if (modal && targetInput) {
        targetInput.value = evId;
        if (subtitle) {
          subtitle.textContent = `Registering for "${ev.title}" — Prize Pool: ${ev.prizePool}`;
        }
        modal.classList.add('open');
      }
    });
  });

  // Attach rules click
  container.querySelectorAll('[data-event-details]').forEach(btn => {
    btn.addEventListener('click', () => {
      alert("📋 Tournament Rules:\n- All squad members must be registered.\n- Emulators are strictly prohibited.\n- Screenshot verification required after each match.\n- Check in on Discord 15 minutes prior to start time.");
    });
  });
}

function showToast(msg, type = 'success') {
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
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}
