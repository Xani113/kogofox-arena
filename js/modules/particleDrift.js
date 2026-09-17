/**
 * Kugofox Gaming Arena - Particle Drift Engine
 * High-performance ASCII Matrix & Upward Light Beam particle system
 * Inspired by Zenith Compute Network Particle Drift architecture
 */

export class ParticleDriftEngine {
  constructor(canvasId = 'bg-cyber-canvas', options = {}) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');

    this.options = {
      speed: options.speed ?? 1,
      density: options.density ?? 1,
      beamCount: options.beamCount ?? 28,
      nodeCount: options.nodeCount ?? 85,
      beamColor: options.beamColor || 'rgba(0, 240, 255,', // Cyan / Arena theme
      nodeColor: options.nodeColor || 'rgba(156, 163, 175, 0.45)',
      activeColor: options.activeColor || '#00f0ff',
      interactive: options.interactive ?? true,
      ...options
    };

    this.width = 0;
    this.height = 0;
    this.nodes = [];
    this.beams = [];
    this.chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ@#$%&*()<>{}[]/\\+=~'.split('');
    this.mouse = { x: -1000, y: -1000 };
    this.animationFrameId = null;

    this.init();
  }

  init() {
    this.resize();

    window.addEventListener('resize', () => {
      this.resize();
      this.initParticles();
    });

    if (this.options.interactive) {
      window.addEventListener('mousemove', (e) => {
        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = e.clientX - rect.left;
        this.mouse.y = e.clientY - rect.top;
      });

      window.addEventListener('mouseleave', () => {
        this.mouse.x = -1000;
        this.mouse.y = -1000;
      });

      // Mobile Touch Support
      window.addEventListener('touchmove', (e) => {
        if (e.touches && e.touches[0]) {
          const rect = this.canvas.getBoundingClientRect();
          this.mouse.x = e.touches[0].clientX - rect.left;
          this.mouse.y = e.touches[0].clientY - rect.top;
        }
      }, { passive: true });
    }

    this.initParticles();
    this.start();
  }

  resize() {
    const dpr = window.devicePixelRatio || 1;
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  initParticles() {
    const effectiveNodeCount = Math.round((this.options.nodeCount || 95) * this.options.density);
    const effectiveBeamCount = Math.round((this.options.beamCount || 32) * this.options.density);

    this.nodes = Array.from({ length: effectiveNodeCount }).map(() => ({
      x: Math.random() * this.width,
      y: Math.random() * this.height,
      vy: (Math.random() * 0.45 + 0.15) * this.options.speed,
      char: this.chars[Math.floor(Math.random() * this.chars.length)]
    }));

    this.beams = Array.from({ length: effectiveBeamCount }).map(() => ({
      x: Math.random() * this.width,
      y: Math.random() * this.height,
      length: (Math.random() * 140 + 70),
      speed: (Math.random() * 5 + 3.5) * this.options.speed,
      opacity: Math.random() * 0.55 + 0.45
    }));
  }

  start() {
    if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);

    const draw = () => {
      this.ctx.clearRect(0, 0, this.width, this.height);

      // 1. Upward Beams (Fast Vertical Streams)
      for (let i = 0; i < this.beams.length; i++) {
        const b = this.beams[i];
        b.y -= b.speed;
        if (b.y + b.length < 0) {
          b.y = this.height + 100;
          b.x = Math.random() * this.width;
        }
        const grad = this.ctx.createLinearGradient(b.x, b.y, b.x, b.y + b.length);
        grad.addColorStop(0, `rgba(0, 240, 255, ${b.opacity})`);
        grad.addColorStop(0.4, `rgba(96, 165, 250, ${b.opacity * 0.8})`);
        grad.addColorStop(1, 'transparent');

        this.ctx.strokeStyle = grad;
        this.ctx.lineWidth = 1.8;
        this.ctx.beginPath();
        this.ctx.moveTo(b.x, b.y);
        this.ctx.lineTo(b.x, b.y + b.length);
        this.ctx.stroke();
      }

      // 2. Interactive Nodes (ASCII Characters + Proximity Network Web)
      this.ctx.font = '12px "JetBrains Mono", monospace';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';

      // Proximity interconnect lines
      this.ctx.lineWidth = 0.6;
      const nodeLen = this.nodes.length;
      for (let i = 0; i < nodeLen; i++) {
        const n1 = this.nodes[i];
        for (let j = i + 1; j < nodeLen; j++) {
          const n2 = this.nodes[j];
          const d = Math.hypot(n1.x - n2.x, n1.y - n2.y);
          if (d < 125) {
            this.ctx.strokeStyle = `rgba(0, 240, 255, ${0.25 * (1 - d / 125)})`;
            this.ctx.beginPath();
            this.ctx.moveTo(n1.x, n1.y);
            this.ctx.lineTo(n2.x, n2.y);
            this.ctx.stroke();
          }
        }
      }

      // Character Drift and Mouse Interaction
      for (let i = 0; i < nodeLen; i++) {
        const n = this.nodes[i];
        n.y += n.vy;
        if (n.y > this.height + 25) {
          n.y = -20;
          n.x = Math.random() * this.width;
        }

        const dist = Math.hypot(this.mouse.x - n.x, this.mouse.y - n.y);

        // Dynamic ASCII character flip near cursor or on random tick
        if (dist < 190 || Math.random() > 0.985) {
          n.char = this.chars[Math.floor(Math.random() * this.chars.length)];
        }

        // Mouse connection laser
        if (dist < 190) {
          this.ctx.strokeStyle = `rgba(0, 240, 255, ${0.75 * (1 - dist / 190)})`;
          this.ctx.lineWidth = 1.2;
          this.ctx.beginPath();
          this.ctx.moveTo(n.x, n.y);
          this.ctx.lineTo(this.mouse.x, this.mouse.y);
          this.ctx.stroke();
        }

        this.ctx.fillStyle = dist < 190 ? '#00f0ff' : (this.options.nodeColor || 'rgba(180, 210, 255, 0.7)');
        this.ctx.fillText(n.char, n.x, n.y);
      }

      this.animationFrameId = requestAnimationFrame(draw);
    };

    draw();
  }

  setSpeed(val) {
    this.options.speed = Math.max(0.1, Math.min(3, val));
    this.initParticles();
  }

  destroy() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }
}
