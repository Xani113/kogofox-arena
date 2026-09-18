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
    this.spatialAudioEnabled = false; // Inactive on initial page load
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

    // Ensure spatial waves start muted/inactive
    const waves = this.wrapper.querySelectorAll('.sonic-pulse-ring, .sonic-wave-arc');
    waves.forEach(wave => {
      wave.style.opacity = '0.15';
    });
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
    sound.enable?.();
    this.currentModeIdx = (this.currentModeIdx + 1) % this.colorModes.length;
    const mode = this.colorModes[this.currentModeIdx];
    this.applyColorMode(mode);

    sound.playHeadphoneChime();
    this.triggerPulseAnimation();
    // Toast popup removed as per user instruction: "dont make the popup after color changing"
  }

  triggerBassDrop() {
    sound.enable?.();
    sound.playHeadphoneBeat();
    this.triggerPulseAnimation();
    // Toast popup removed as per user instruction
  }

  toggleSpatialAudio() {
    sound.enable?.();
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

    // Track mouse & touch over entire hero section for immersive responsiveness
    const trackingArea = this.container.closest('.korg-hero-section') || this.container;

    let targetRotX = 0;
    let targetRotY = 0;
    let currentRotX = 0;
    let currentRotY = 0;
    let lastRenderedX = 0;
    let lastRenderedY = 0;
    let rafId = null;
    let isLoopRunning = false;

    // Cache tracking rect and refresh on resize/scroll with passive listeners
    let cachedRect = null;
    const updateRect = () => {
      cachedRect = trackingArea.getBoundingClientRect();
    };
    updateRect();
    window.addEventListener('resize', updateRect, { passive: true });
    window.addEventListener('scroll', updateRect, { passive: true });

    const handleCoords = (clientX, clientY) => {
      if (!cachedRect) updateRect();
      const x = clientX - cachedRect.left;
      const y = clientY - cachedRect.top;

      const normX = Math.max(-1, Math.min(1, (x / cachedRect.width - 0.5) * 2));
      const normY = Math.max(-1, Math.min(1, (y / cachedRect.height - 0.5) * 2));

      // Subtle, sleek 3D perspective tilt
      targetRotX = -normY * 12;
      targetRotY = normX * 16;
      startLoop();
    };

    // Mouse listeners with passive flags
    const onMouseMove = (e) => {
      handleCoords(e.clientX, e.clientY);
    };

    const onMouseLeave = () => {
      targetRotX = 0;
      targetRotY = 0;
      startLoop();
    };

    // Mobile touch & pointer listeners with { passive: true }
    const onTouchMove = (e) => {
      if (e.touches && e.touches.length > 0) {
        handleCoords(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const onTouchEnd = () => {
      targetRotX = 0;
      targetRotY = 0;
      startLoop();
    };

    // Gyroscope / device orientation for mobile with { passive: true }
    const onOrientation = (e) => {
      if (e.beta !== null && e.gamma !== null) {
        const tiltX = Math.max(-1, Math.min(1, (e.beta - 45) / 35));
        const tiltY = Math.max(-1, Math.min(1, e.gamma / 30));
        targetRotX = -tiltX * 10;
        targetRotY = tiltY * 14;
        startLoop();
      }
    };

    // Throttled 60 FPS animation loop with sleep state when settled
    const updateTilt = () => {
      currentRotX += (targetRotX - currentRotX) * 0.1;
      currentRotY += (targetRotY - currentRotY) * 0.1;

      // Only write to DOM if change exceeds threshold (avoids style recalculation overhead)
      if (Math.abs(currentRotX - lastRenderedX) > 0.02 || Math.abs(currentRotY - lastRenderedY) > 0.02) {
        lastRenderedX = currentRotX;
        lastRenderedY = currentRotY;
        this.wrapper.style.transform = `perspective(1100px) translate3d(0, 0, 0) rotateX(${currentRotX.toFixed(2)}deg) rotateY(${currentRotY.toFixed(2)}deg)`;
      }

      const isSettled = Math.abs(targetRotX - currentRotX) < 0.03 && Math.abs(targetRotY - currentRotY) < 0.03;
      if (!isSettled) {
        rafId = requestAnimationFrame(updateTilt);
      } else {
        isLoopRunning = false;
        rafId = null;
      }
    };

    const startLoop = () => {
      if (!isLoopRunning) {
        isLoopRunning = true;
        rafId = requestAnimationFrame(updateTilt);
      }
    };

    trackingArea.addEventListener('mousemove', onMouseMove, { passive: true });
    trackingArea.addEventListener('mouseleave', onMouseLeave, { passive: true });
    trackingArea.addEventListener('touchmove', onTouchMove, { passive: true });
    trackingArea.addEventListener('touchend', onTouchEnd, { passive: true });
    trackingArea.addEventListener('pointermove', onMouseMove, { passive: true });

    if (window.DeviceOrientationEvent && typeof window.addEventListener === 'function') {
      window.addEventListener('deviceorientation', onOrientation, { passive: true });
    }

    startLoop();
  }

  bindInteractions() {
    // Direct click on headphone art cycles RGB mode & plays bass beat
    if (this.wrapper) {
      this.wrapper.addEventListener('click', (e) => {
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
      if (document.hidden) return;
      bars.forEach(bar => {
        const heightMultiplier = Math.random() * 0.9 + 0.3;
        bar.style.transform = `scaleY(${heightMultiplier.toFixed(2)}) translateZ(0)`;
      });
    }, 200);
  }
}
