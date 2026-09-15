/**
 * Kugofox Gaming Arena - Cyberpunk Headphone Interactive Controller
 * Features:
 * - 3D Mouse Parallax Tilt & Gyro Dynamics
 * - Interactive RGB Chromatic Lighting Modes (Click to cycle colors)
 * - Sound Engine Integration (Procedural Cyber Sub-Bass Pulse & Chimes)
 * - Sonic Acoustic Wave Pulsing & Realtime Equalizer
 * - 360 Spatial Audio HUD Mode Toggle
 */

import { sound } from './soundEngine.js';

export class CyberHeadphoneController {
  constructor(app) {
    this.app = app;
    this.container = null;
    this.wrapper = null;
    this.svg = null;
    
    this.colorModes = [
      {
        id: 'cyber-neon',
        name: 'CYBER NEON',
        primary: '#00f0ff',
        secondary: '#ff2a85',
        glow: 'rgba(0, 240, 255, 0.75)',
        desc: '7.1 Spatial Neon Matrix'
      },
      {
        id: 'fox-ember',
        name: 'FOX EMBER',
        primary: '#ff6a00',
        secondary: '#ffd000',
        glow: 'rgba(255, 106, 0, 0.75)',
        desc: 'Sub-Bass Overdrive +12dB'
      },
      {
        id: 'matrix-green',
        name: 'MATRIX ACID',
        primary: '#00ff88',
        secondary: '#00b4d8',
        glow: 'rgba(0, 255, 136, 0.75)',
        desc: 'Ultra Low Latency 1.2ms'
      },
      {
        id: 'void-purple',
        name: 'VOID PURPLE',
        primary: '#c084fc',
        secondary: '#38bdf8',
        glow: 'rgba(192, 132, 252, 0.75)',
        desc: 'Hi-Res Studio Master'
      },
      {
        id: 'chroma-rainbow',
        name: 'CHROMA RGB',
        primary: '#00f0ff',
        secondary: '#a855f7',
        glow: 'rgba(0, 240, 255, 0.85)',
        desc: 'Dynamic Chroma Spectrum'
      }
    ];

    this.currentModeIdx = 0;
    this.spatialAudioEnabled = true;
    this.isPulsing = false;
  }

  init(containerId = 'hero-headphone-col') {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    this.wrapper = this.container.querySelector('.cyber-headphone-wrapper');
    this.svg = this.container.querySelector('.cyber-headphone-svg');

    if (!this.wrapper) return;

    this.applyColorMode(this.colorModes[0]);
    this.bindMouseTilt();
    this.bindInteractions();
    this.initEqualizerPulse();
  }

  applyColorMode(mode) {
    if (!this.wrapper) return;

    this.wrapper.style.setProperty('--hp-led-primary', mode.primary);
    this.wrapper.style.setProperty('--hp-led-secondary', mode.secondary);
    this.wrapper.style.setProperty('--hp-glow', mode.glow);

    // Update HUD Badge if present
    const rgbBadge = document.getElementById('hp-rgb-badge-text');
    if (rgbBadge) {
      rgbBadge.textContent = mode.name;
      rgbBadge.style.color = mode.primary;
    }

    const rgbDot = document.getElementById('hp-rgb-badge-dot');
    if (rgbDot) {
      rgbDot.style.background = mode.primary;
      rgbDot.style.boxShadow = `0 0 12px ${mode.primary}`;
    }

    // Dynamic gradient stops inside SVG
    const stop1 = document.getElementById('hp-grad-stop1');
    const stop2 = document.getElementById('hp-grad-stop2');
    if (stop1) stop1.setAttribute('stop-color', mode.primary);
    if (stop2) stop2.setAttribute('stop-color', mode.secondary);

    const glowFilterColor = document.getElementById('hp-glow-color');
    if (glowFilterColor) glowFilterColor.setAttribute('flood-color', mode.primary);

    // Chroma rainbow class toggle
    this.wrapper.classList.toggle('mode-chroma-rainbow', mode.id === 'chroma-rainbow');
  }

  cycleColorMode() {
    this.currentModeIdx = (this.currentModeIdx + 1) % this.colorModes.length;
    const mode = this.colorModes[this.currentModeIdx];
    this.applyColorMode(mode);

    sound.playHeadphoneChime();
    this.triggerPulseAnimation();
    // Toast popup removed as per user instruction: "dont make the popup after color changing"
  }

  triggerBassDrop() {
    sound.playHeadphoneBeat();
    this.triggerPulseAnimation();
    // Toast popup removed as per user instruction
  }

  toggleSpatialAudio() {
    this.spatialAudioEnabled = !this.spatialAudioEnabled;
    sound.playClick();
    
    const spatialBtn = document.getElementById('hp-btn-spatial');
    if (spatialBtn) {
      spatialBtn.classList.toggle('active', this.spatialAudioEnabled);
      spatialBtn.innerHTML = this.spatialAudioEnabled 
        ? `<span class="btn-dot active"></span> 360° SPATIAL: ON`
        : `<span class="btn-dot"></span> 360° SPATIAL: OFF`;
    }

    const waves = this.wrapper?.querySelectorAll('.sonic-pulse-ring, .sonic-wave-arc');
    waves?.forEach(wave => {
      wave.style.opacity = this.spatialAudioEnabled ? '1' : '0.15';
    });
    // Toast popup removed as per user instruction
  }

  triggerPulseAnimation() {
    if (!this.wrapper) return;

    this.wrapper.classList.remove('headphone-pulse-active');
    // Force reflow
    void this.wrapper.offsetWidth;
    this.wrapper.classList.add('headphone-pulse-active');

    // Radiate acoustic waves
    const waves = this.wrapper.querySelectorAll('.sonic-wave-arc');
    waves.forEach((w, i) => {
      w.style.animation = 'none';
      void w.offsetWidth;
      w.style.animation = `sonicPulseWave 1s cubic-bezier(0.15, 0.85, 0.35, 1.2) ${i * 0.1}s forwards`;
    });

    setTimeout(() => {
      this.wrapper.classList.remove('headphone-pulse-active');
    }, 1000);
  }

  bindMouseTilt() {
    if (!this.container || !this.wrapper) return;

    // Track mouse over entire hero section for immersive responsiveness
    const trackingArea = this.container.closest('.korg-hero-section') || this.container;

    let targetRotX = 0;
    let targetRotY = 0;
    let currentRotX = 0;
    let currentRotY = 0;
    let rafId = null;

    const onMouseMove = (e) => {
      const rect = trackingArea.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const normX = Math.max(-1, Math.min(1, (x / rect.width - 0.5) * 2));
      const normY = Math.max(-1, Math.min(1, (y / rect.height - 0.5) * 2));

      // Subtle, sleek 3D perspective tilt ("little movable")
      targetRotX = -normY * 12;
      targetRotY = normX * 16;
    };

    const onMouseLeave = () => {
      targetRotX = 0;
      targetRotY = 0;
    };

    const updateTilt = () => {
      // Silky smooth organic interpolation
      currentRotX += (targetRotX - currentRotX) * 0.08;
      currentRotY += (targetRotY - currentRotY) * 0.08;

      this.wrapper.style.transform = `perspective(1100px) rotateX(${currentRotX.toFixed(2)}deg) rotateY(${currentRotY.toFixed(2)}deg)`;

      rafId = requestAnimationFrame(updateTilt);
    };

    trackingArea.addEventListener('mousemove', onMouseMove);
    trackingArea.addEventListener('mouseleave', onMouseLeave);
    rafId = requestAnimationFrame(updateTilt);
  }

  bindInteractions() {
    // Direct click on headphone art cycles RGB mode & plays bass beat
    if (this.wrapper) {
      this.wrapper.addEventListener('click', (e) => {
        // If not clicking on an interactive control button inside
        if (e.target.closest('.hp-interactive-btn')) return;
        this.cycleColorMode();
      });
    }

    // Quick action buttons
    document.getElementById('hp-btn-rgb')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.cycleColorMode();
    });

    document.getElementById('hp-btn-bass')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.triggerBassDrop();
    });

    document.getElementById('hp-btn-spatial')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleSpatialAudio();
    });
  }

  initEqualizerPulse() {
    const bars = this.wrapper?.querySelectorAll('.hp-eq-bar');
    if (!bars || bars.length === 0) return;

    setInterval(() => {
      bars.forEach(bar => {
        const heightMultiplier = Math.random() * 0.9 + 0.3;
        bar.style.transform = `scaleY(${heightMultiplier.toFixed(2)})`;
      });
    }, 180);
  }
}
