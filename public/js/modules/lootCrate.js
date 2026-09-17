/**
 * Kugofox Gaming Arena - Cyber Loot Crate System
 */

import { sound } from './soundEngine.js';

export class LootCrateSystem {
  constructor(app) {
    this.app = app;
    this.isOpening = false;
    this.inventory = JSON.parse(localStorage.getItem('kugofox_inventory') || '[]');

    this.lootTable = [
      { id: "loot-1", name: "Radiant Vandal: Kogo-Fox Edition", game: "Valorant", rarity: "Radiant", type: "Weapon Skin", icon: "🔫", value: 500 },
      { id: "loot-2", name: "Glacial Flame M416", game: "BGMI", rarity: "Legendary", type: "Weapon Skin", icon: "🎯", value: 350 },
      { id: "loot-3", name: "Cyber Alok: Neon DJ Matrix", game: "Free Fire", rarity: "Legendary", type: "Character Skin", icon: "🎧", value: 350 },
      { id: "loot-4", name: "Fanny Cyber Blade Master", game: "MOBA Legends", rarity: "Mythic", type: "Hero Skin", icon: "⚔️", value: 600 },
      { id: "loot-5", name: "Glacier AWM Hologram", game: "BGMI", rarity: "Epic", type: "Weapon Skin", icon: "💎", value: 250 },
      { id: "loot-6", name: "Spike Defusal Holographic Tag", game: "Valorant", rarity: "Epic", type: "Gun Buddy", icon: "💣", value: 150 },
      { id: "loot-7", name: "Level 3 Spetsnaz Gold Helmet", game: "BGMI", rarity: "Rare", type: "Cosmetic", icon: "🪖", value: 100 },
      { id: "loot-8", name: "Booyah Ultra Pass Voucher", game: "Free Fire", rarity: "Epic", type: "Battle Pass", icon: "🎟️", value: 200 },
      { id: "loot-9", name: "Conqueror Title Golden Badge", game: "BGMI", rarity: "Rare", type: "Emotes", icon: "🏆", value: 120 }
    ];
  }

  init(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;
    this.render();
  }

  render() {
    this.container.innerHTML = `
      <div class="loot-crate-hub">
        <div class="crate-hero-card">
          <div class="crate-header">
            <div>
              <h3 class="title-glow">📦 Kugofox Cyber Matrix Crate</h3>
              <p class="subtitle">Crack open the high-tier arena container for legendary weapon skins, badges & bonuses.</p>
            </div>
            <div class="crate-cost-tag">
              <span>Cost: <strong>100 K-Coins</strong></span>
            </div>
          </div>

          <div class="crate-visual-stage" id="crate-animation-stage">
            <div class="crate-cube" id="cyber-crate-cube">
              <div class="cube-face front">🦊</div>
              <div class="cube-face back">⚡</div>
              <div class="cube-face right">💎</div>
              <div class="cube-face left">🔥</div>
              <div class="cube-face top">👑</div>
              <div class="cube-face bottom">🎮</div>
            </div>
            <div class="crate-glow-ring"></div>
            <div class="crate-open-particles" id="crate-particles"></div>
          </div>

          <div class="crate-actions">
            <button id="open-crate-btn" class="btn-kugofox btn-glow btn-lg" ${this.app.coins < 100 ? 'disabled' : ''}>
              🔓 Open Matrix Crate (100 Coins)
            </button>
          </div>

          <div id="reward-reveal-modal" class="reward-reveal-card" style="display:none;"></div>
        </div>

        <!-- Unlocked Vault / Inventory -->
        <div class="vault-container">
          <div class="vault-header">
            <h4>🏆 Your Arena Vault (${this.inventory.length} Unlocked)</h4>
            <span class="vault-sub">Items synced to your Kugofox profile</span>
          </div>

          <div class="vault-grid">
            ${this.inventory.length === 0 ? `
              <div class="vault-empty">
                <span>📦</span>
                <p>Your vault is empty. Open your first Cyber Crate above to unlock rare collectibles!</p>
              </div>
            ` : this.inventory.map(item => `
              <div class="vault-item-card rarity-${item.rarity.toLowerCase()}">
                <div class="v-icon">${item.icon}</div>
                <div class="v-info">
                  <div class="v-rarity">${item.rarity} • ${item.game}</div>
                  <strong class="v-name">${item.name}</strong>
                  <div class="v-type">${item.type}</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    const openBtn = this.container.querySelector('#open-crate-btn');
    const cube = this.container.querySelector('#cyber-crate-cube');
    const rewardCard = this.container.querySelector('#reward-reveal-modal');

    if (openBtn) {
      openBtn.addEventListener('click', () => {
        if (this.app.coins < 100) {
          alert('You need at least 100 K-Coins to open a Cyber Crate! Complete daily quests or mini-games to earn more.');
          return;
        }

        this.app.deductCoins(100);
        sound.playLootOpen();

        openBtn.disabled = true;
        openBtn.textContent = 'DECRYPTING CYBER VAULT...';
        cube.classList.add('crate-opening-anim');
        rewardCard.style.display = 'none';

        setTimeout(() => {
          cube.classList.remove('crate-opening-anim');
          
          // Pick random reward
          const randItem = this.lootTable[Math.floor(Math.random() * this.lootTable.length)];
          this.inventory.unshift(randItem);
          localStorage.setItem('kugofox_inventory', JSON.stringify(this.inventory));

          rewardCard.innerHTML = `
            <div class="reward-content rarity-${randItem.rarity.toLowerCase()}">
              <div class="reward-flare">✨ NEW DROP UNLOCKED ✨</div>
              <div class="reward-icon-huge">${randItem.icon}</div>
              <div class="reward-rarity-pill">${randItem.rarity} • ${randItem.game}</div>
              <h3 class="reward-title">${randItem.name}</h3>
              <p class="reward-desc">${randItem.type} added to your permanent Kugofox Vault!</p>
              <button id="claim-reward-btn" class="btn-kugofox">Claim & Equip</button>
            </div>
          `;
          rewardCard.style.display = 'block';

          this.container.querySelector('#claim-reward-btn').addEventListener('click', () => {
            sound.playClick();
            this.render();
          });

          openBtn.disabled = false;
          openBtn.textContent = '🔓 Open Matrix Crate (100 Coins)';
        }, 1500);
      });
    }
  }
}
