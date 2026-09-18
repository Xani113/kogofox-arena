/**
 * Kugofox Gaming Arena - Announcement Ticker Manager
 * Dynamic top bar that:
 * 1. Only appears when an event is 'upcoming' or 'live'
 * 2. Stays active until the live day ends, then automatically hides once it ends
 * 3. Provides a small cross (×) symbol to allow users to dismiss the ticker
 * 4. Automatically re-evaluates when events are updated/created/deleted in the admin panel
 */

import { switchView } from './viewController.js';
import { sound } from './soundEngine.js?v=2.4.1';

/**
 * Robustly parse event dates (e.g. "28 sep 2026,6 pm", "12th sep", "2026-09-30", etc.)
 * Returns the Date object representing when the event/live day ends.
 */
export function parseEventEndDate(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const str = dateStr.trim();
  if (!str) return null;

  // Try standard parse
  let d = new Date(str);
  if (!isNaN(d.getTime())) {
    if (!/\d{1,2}:\d{2}|\d{1,2}\s*(am|pm)/i.test(str)) {
      d.setHours(23, 59, 59, 999);
    }
    return d;
  }

  // Clean strings like "28 sep 2026,6 pm" -> "28 sep 2026 6:00 pm"
  let clean = str
    .replace(/(\d+)(st|nd|rd|th)/gi, '$1')
    .replace(/,/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  clean = clean.replace(/(\b\d{1,2})\s*(am|pm)\b/gi, '$1:00 $2');

  d = new Date(clean);
  if (!isNaN(d.getTime())) {
    return d;
  }

  // Fallback regex for "Day Month [Year] [Time]"
  const match = clean.match(/(\d{1,2})\s+([a-zA-Z]{3,9})(?:\s+(\d{4}))?/i);
  if (match) {
    const day = parseInt(match[1], 10);
    const monthStr = match[2].toLowerCase();
    const year = match[3] ? parseInt(match[3], 10) : new Date().getFullYear();
    const months = ["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"];
    const monthIdx = months.findIndex(m => monthStr.startsWith(m));
    if (monthIdx !== -1) {
      const timeMatch = clean.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
      let hours = 23;
      let minutes = 59;
      if (timeMatch && timeMatch[3]) {
        let h = parseInt(timeMatch[1], 10);
        const mins = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
        const meridian = timeMatch[3].toLowerCase();
        if (meridian === 'pm' && h < 12) h += 12;
        if (meridian === 'am' && h === 12) h = 0;
        hours = h;
        minutes = mins;
      }
      return new Date(year, monthIdx, day, hours, minutes, 59, 999);
    }
  }

  return null;
}

/**
 * Determine if an event is currently active (upcoming or live, and not ended).
 */
export function isEventActive(event) {
  if (!event) return false;
  const status = (event.status || '').toLowerCase().trim();

  // Completed events are never shown in announcement ticker
  if (status === 'completed' || event.completedAt) {
    return false;
  }

  const now = new Date();

  // Live match stays active throughout its live day
  if (status === 'live') {
    const endDate = parseEventEndDate(event.date);
    if (endDate && now > endDate) {
      return false; // Live day has ended
    }
    return true;
  }

  // Upcoming event stays active until event date passes
  if (status === 'upcoming') {
    const endDate = parseEventEndDate(event.date);
    if (endDate && now > endDate) {
      return false; // Date has passed
    }
    return true;
  }

  return false;
}

/**
 * Refresh and update the announcement ticker DOM element.
 */
export async function updateAnnouncementTicker(providedEvents = null) {
  const tickerEl = document.getElementById('korg-announcement-ticker');
  if (!tickerEl) return;

  try {
    let events = providedEvents;
    if (!events) {
      const res = await fetch('/api/events');
      if (res.ok) {
        const json = await res.json();
        if (json && json.success && Array.isArray(json.data)) {
          events = json.data;
        }
      }
    }

    if (!Array.isArray(events) || events.length === 0) {
      tickerEl.style.display = 'none';
      return;
    }

    // Filter events that are upcoming or live and haven't ended
    const activeEvents = events.filter(isEventActive);

    if (activeEvents.length === 0) {
      tickerEl.style.display = 'none';
      return;
    }

    // Sort: Live events first, then upcoming events closest to today
    activeEvents.sort((a, b) => {
      if (a.status === 'live' && b.status !== 'live') return -1;
      if (b.status === 'live' && a.status !== 'live') return 1;
      const dateA = parseEventEndDate(a.date) || new Date(8640000000000000);
      const dateB = parseEventEndDate(b.date) || new Date(8640000000000000);
      return dateA - dateB;
    });

    const activeEvent = activeEvents[0];
    const eventId = activeEvent.id || activeEvent._id || 'event_current';
    const dismissKey = `korg_dismissed_ticker_${eventId}`;

    // Respect user's dismissal for this session
    if (sessionStorage.getItem(dismissKey) === 'true') {
      tickerEl.style.display = 'none';
      return;
    }

    const dot = tickerEl.querySelector('.korg-ticker-dot');
    const textSpan = tickerEl.querySelector('#korg-ticker-text');
    const ctaBtn = tickerEl.querySelector('#ticker-cta-btn');
    const closeBtn = tickerEl.querySelector('#ticker-close-btn');

    const isLive = activeEvent.status === 'live';

    if (dot) {
      if (isLive) {
        dot.style.background = '#ef4444';
        dot.style.boxShadow = '0 0 10px #ef4444, 0 0 20px #f87171';
      } else {
        dot.style.background = '#a855f7';
        dot.style.boxShadow = '0 0 10px #a855f7, 0 0 20px #c084fc';
      }
    }

    if (textSpan) {
      if (isLive) {
        textSpan.innerHTML = `<span>🔴 <strong>LIVE NOW:</strong> ${activeEvent.title} (${activeEvent.gameName || activeEvent.game || 'Arena'}) • Battle In Progress!</span>`;
      } else {
        const dateNote = activeEvent.date ? ` till ${activeEvent.date}` : '';
        textSpan.innerHTML = `<span>🟣 <strong>${activeEvent.title}</strong> registration open${dateNote}</span>`;
      }
    }

    if (ctaBtn) {
      ctaBtn.textContent = isLive ? 'Watch Live ➔' : 'Register Now ➔';
      ctaBtn.onclick = (e) => {
        e.preventDefault();
        try { sound.playClick?.(); } catch (err) {}
        switchView('events');
      };
    }

    if (closeBtn) {
      closeBtn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        try { sound.playClick?.(); } catch (err) {}
        sessionStorage.setItem(dismissKey, 'true');
        tickerEl.classList.remove('visible');
        tickerEl.classList.add('dismissed');
        setTimeout(() => {
          tickerEl.style.display = 'none';
        }, 250);
      };
    }

    // Display ticker with clean fade in
    tickerEl.style.display = 'flex';
    requestAnimationFrame(() => {
      tickerEl.classList.remove('dismissed');
      tickerEl.classList.add('visible');
    });

  } catch (err) {
    console.warn('[Ticker] Announcement update warning:', err.message);
    tickerEl.classList.remove('visible');
    tickerEl.classList.add('dismissed');
    tickerEl.style.display = 'none';
  }
}

/**
 * Initialize ticker and bind global event listeners.
 */
export function initAnnouncementTicker() {
  const tickerEl = document.getElementById('korg-announcement-ticker');
  if (!tickerEl) return;

  // Initial fetch and check
  updateAnnouncementTicker();

  // Listen to events update dispatched by admin panel or events manager
  window.addEventListener('korg:eventsUpdated', (e) => {
    const events = e.detail && e.detail.events ? e.detail.events : null;
    updateAnnouncementTicker(events);
  });
}
