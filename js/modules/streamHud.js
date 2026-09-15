/**
 * Kogofox Gaming Arena - Live Spectator Broadcast Feed
 * Connected to MongoDB live chat collection
 */

import { sound } from './soundEngine.js';

export class StreamHud {
  constructor(app) {
    this.app = app;
    this.currentChannel = 'freefire';
    this.chatMessages = [
      { user: 'RadiantDemon', badge: 'VIP', text: 'THAT FLICK ON C-SITE WAS DISGUSTING!! 🔥', time: '19:10' },
      { user: 'ErangelSniper', badge: 'PRO', text: 'AWM collateral incoming in the final circle!', time: '19:11' },
      { user: 'FoxFanatic', badge: 'FAN', text: 'KOGOFOX RUNNING THE BRACKET TODAY 🦊🦊🦊', time: '19:12' }
    ];

    this.streams = {
      valorant: {
        title: "VCT Radiant Invitational: Sentinels X vs LOUD Fury",
        game: "Valorant • Map 3 Haven (OT 13-13)",
        viewers: "148,290",
        roundStatus: "ROUND 27 • SPIKE PLANTED ON C",
        commentary: "Commentator A: 'LOUD is wrapping through garage! He needs the defuse in 3.5 seconds!'",
        hudStats: [
          { label: "Spike Timer", value: "00:07s", alert: true },
          { label: "Alive", value: "2v1 Clutched" },
          { label: "Top Fragger", value: "TenZ_X (28 Kills)" }
        ]
      },
      pubg: {
        title: "Erangel Survival Cup: NAVI vs FaZe Final Circle",
        game: "PUBG • Erangel Phase 7 Water Town",
        viewers: "112,400",
        roundStatus: "PHASE 7 BLUE ZONE SHRINKING (3 SQUADS REMAIN)",
        commentary: "Commentator B: 'NAVI has the high-ground ridge! Smoke grenades deploying across the road!'",
        hudStats: [
          { label: "Alive Players", value: "8 / 100", alert: true },
          { label: "Circle DMG", value: "12 HP/sec" },
          { label: "Airdrop Loot", value: "AWM + Level 3 Helmet" }
        ]
      },
      freefire: {
        title: "Booyah Clash Squad Finals: LOUD FF vs Kogofox Rushers",
        game: "Free Fire • Factory Bo7 Round 7 Match Point",
        viewers: "189,550",
        roundStatus: "MATCH POINT • 1V1 TIEBREAKER",
        commentary: "Commentator C: 'Double Gloo Wall reset! He pulls out the M1887 shotgun for the jump shot!'",
        hudStats: [
          { label: "Round Score", value: "3 - 3", alert: true },
          { label: "Zone Timer", value: "00:15s" },
          { label: "Rusher MVP", value: "FoxStriker (14 KOs)" }
        ]
      },
      mobalegends: {
        title: "Mythic Glory Cup: ONIC Nova vs Blacklist Vanguard",
        game: "MOBA Legends • Game 4 (18:42 min)",
        viewers: "224,100",
        roundStatus: "ENHANCED LORD CONTEST AT RIVER PIT",
        commentary: "Commentator D: 'Retribution is ready! The Ling swoops from the pit wall and STEALS THE LORD!'",
        hudStats: [
          { label: "Lord HP", value: "14,500 HP", alert: true },
          { label: "Kill Score", value: "19 - 17" },
          { label: "Gold Lead", value: "+4.2k ONIC" }
        ]
      },
      clashroyale: {
        title: "Crown Masters Grand Prix: Mohamed Light vs Mugi",
        game: "Clash Royale • Overtime Triple Elixir",
        viewers: "95,800",
        roundStatus: "TOWER HP: 218 vs 304 • TRIPLE ELIXIR",
        commentary: "Commentator E: 'Miner sent to the back corner! Poison spell covers the tower! Can the Log finish it?!'",
        hudStats: [
          { label: "Overtime Left", value: "00:24s", alert: true },
          { label: "King Tower", value: "1-1 Crowns" },
          { label: "Elixir Speed", value: "3x Surge" }
        ]
      }
    };
  }

  async init(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;
    
    // Fetch live messages from MongoDB
    try {
      const res = await fetch('/api/chat');
      if (res.ok) {
        const data = await res.json();
        if (data.data && data.data.length > 0) {
          this.chatMessages = data.data;
        }
      }
    } catch (e) {
      console.warn('[StreamHud] Chat cache active');
    }

    this.render();
    this.startChatSimulator();
  }

  setChannel(gameId) {
    if (this.streams[gameId]) {
      this.currentChannel = gameId;
      this.render();
    }
  }

  render() {
    const stream = this.streams[this.currentChannel] || this.streams.valorant;

    this.container.innerHTML = `
      <div class="stream-hud-container">
        <div class="stream-stage">
          <div class="stage-overlay-top">
            <div class="live-tag"><span class="pulse-dot"></span> LIVE BROADCAST</div>
            <div class="stream-title-text">${stream.title}</div>
            <div class="viewer-count">👁️ ${stream.viewers} watching</div>
          </div>

          <div class="stage-visual-canvas">
            <div class="cyber-scanlines"></div>
            <div class="stream-center-hud">
              <div class="hud-tournament-logo">🦊 KOGOFOX ARENA BROADCAST</div>
              <div class="hud-match-title">${stream.game}</div>
              <div class="hud-match-state">${stream.roundStatus}</div>
              <div class="hud-stats-ticker">
                ${stream.hudStats.map(s => `
                  <div class="h-stat-card ${s.alert ? 'alert' : ''}">
                    <span class="h-lbl">${s.label}:</span>
                    <strong class="h-val">${s.value}</strong>
                  </div>
                `).join('')}
              </div>
            </div>

            <div class="commentary-ticker-bar">
              <span class="mic-icon">🎙️</span>
              <span class="commentary-line" id="live-commentary-text">${stream.commentary}</span>
            </div>
          </div>

          <div class="stage-channel-bar">
            <span class="ch-label">SWITCH ARENA FEED:</span>
            <div class="ch-buttons">
              <button class="ch-btn ${this.currentChannel === 'valorant' ? 'active' : ''}" data-ch="valorant">🎯 Valorant</button>
              <button class="ch-btn ${this.currentChannel === 'pubg' ? 'active' : ''}" data-ch="pubg">🪂 PUBG</button>
              <button class="ch-btn ${this.currentChannel === 'freefire' ? 'active' : ''}" data-ch="freefire">🔥 Free Fire</button>
              <button class="ch-btn ${this.currentChannel === 'mobalegends' ? 'active' : ''}" data-ch="mobalegends">⚔️ MOBA Legends</button>
              <button class="ch-btn ${this.currentChannel === 'clashroyale' ? 'active' : ''}" data-ch="clashroyale">👑 Clash Royale</button>
            </div>
          </div>
        </div>

        <div class="stream-chat-box">
          <div class="chat-header">
            <span>💬 Live Arena Spectator Chat</span>
            <span class="chat-speed">MONGODB SYNC</span>
          </div>

          <div class="chat-messages-container" id="stream-chat-msgs">
            ${this.chatMessages.map(m => `
              <div class="chat-line">
                <span class="c-time">${m.time}</span>
                <span class="c-badge badge-${(m.badge || 'fan').toLowerCase()}">${m.badge || 'FAN'}</span>
                <span class="c-user">${m.user}:</span>
                <span class="c-text">${m.text}</span>
              </div>
            `).join('')}
          </div>

          <form id="chat-input-form" class="chat-form">
            <input type="text" id="chat-user-input" placeholder="Cheer for your team or send GG..." autocomplete="off" maxlength="120">
            <button type="submit" class="btn-chat-send">Send</button>
          </form>
        </div>
      </div>
    `;

    this.container.querySelectorAll('.ch-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        sound.playTabSwitch();
        this.setChannel(btn.dataset.ch);
      });
    });

    const form = this.container.querySelector('#chat-input-form');
    const input = this.container.querySelector('#chat-user-input');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const text = input.value.trim();
      if (!text) return;

      sound.playClick();
      const msgObj = {
        user: 'You (Kogofox)',
        badge: 'ARENA',
        text: text,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      this.addChatMessage(msgObj);
      input.value = '';

      // Save to MongoDB
      try {
        await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(msgObj)
        });
      } catch (err) {
        console.warn('[MongoDB Chat]:', err.message);
      }
    });
  }

  addChatMessage(msgObj) {
    this.chatMessages.push(msgObj);
    if (this.chatMessages.length > 30) this.chatMessages.shift();
    const chatContainer = document.getElementById('stream-chat-msgs');
    if (!chatContainer) return;

    const div = document.createElement('div');
    div.className = 'chat-line new-msg';
    div.innerHTML = `
      <span class="c-time">${msgObj.time}</span>
      <span class="c-badge badge-${(msgObj.badge || 'fan').toLowerCase()}">${msgObj.badge || 'FAN'}</span>
      <span class="c-user">${msgObj.user}:</span>
      <span class="c-text">${msgObj.text}</span>
    `;
    chatContainer.appendChild(div);
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }

  startChatSimulator() {
    const randomComments = [
      { user: 'NeonClutcher', badge: 'FAN', text: 'WHAT WAS THAT REACTION SPEED?!?' },
      { user: 'VandalTrophy', badge: 'PRO', text: '13-13 on Haven OT is peak esports!' },
      { user: 'BooyahQueen', badge: 'VIP', text: 'Clash Squad rush is unmatched today 🔥' },
      { user: 'ShadowMage', badge: 'FAN', text: 'GG WP to both teams!' },
      { user: 'AirdropHunter', badge: 'PRO', text: 'Final blue zone closing in 10 seconds!' },
      { user: 'KogoHype', badge: 'ARENA', text: 'KOGOFOX ARENA CHAMPIONSHIP IS WILD 🦊🏆' }
    ];

    setInterval(() => {
      if (Math.random() > 0.45) {
        const rand = randomComments[Math.floor(Math.random() * randomComments.length)];
        this.addChatMessage({
          user: rand.user,
          badge: rand.badge,
          text: rand.text,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
      }
    }, 5000);
  }
}
