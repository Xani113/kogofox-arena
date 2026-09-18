/**
 * Kugofox Gaming Arena - Retro 16-Bit Background Pixel Stars Engine
 * Faithful vanilla implementation of @/components/ui/background-pixel-stars.tsx
 * 
 * Features:
 * - 16-bit color palette (#FFFFFF, #FFFFAA, #AAAAFF, #FFAAAA, #AAFFAA, #FFAAFF, #AAFFFF)
 * - 5px pixel square stars with discrete step twinkling
 * - 4x2 pixel shooting stars with dynamic fading trails
 * - 16 FPS retro arcade timing loop
 * - High-efficiency, mobile-phone stable (no jank, low battery footprint, responsive)
 */

const STAR_COLORS = [
  "#FFFFFF", // White
  "#FFFFAA", // Light yellow
  "#AAAAFF", // Light blue
  "#FFAAAA", // Light red
  "#AAFFAA", // Light green
  "#FFAAFF", // Light purple
  "#AAFFFF", // Light cyan
];

const starDensity = 0.00004;
const twinkleProbability = 0.7;
const minTwinkleSpeed = 2;
const maxTwinkleSpeed = 4;
const pixelSize = 5;
const starRegenerationInterval = 5000;
const percentToRegenerate = 0.15;

const shootingStarPixelSize = 2;
const targetFps = 16;

export class PixelStarsEngine {
  constructor(canvasId = 'bg-cyber-canvas') {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    if (!this.ctx) return;

    this.backgroundStars = [];
    this.shootingStars = [];
    this.lastRenderTime = 0;
    this.frameInterval = 1000 / targetFps;
    this.animationFrameId = null;
    this.regenInterval = null;
    this.nextShootingStarTimeout = null;
    this.isPaused = false;
    this.isIntersecting = true;
    this.observer = null;

    this.init();
  }

  init() {
    this.resize();
    this.initBackgroundStars();
    this.startAnimation();
    this.scheduleShootingStar();
    this.startRegenInterval();

    // IntersectionObserver to pause rendering when scrolled out of viewport
    if (typeof window !== 'undefined' && 'IntersectionObserver' in window && this.canvas) {
      this.observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          this.isIntersecting = entry.isIntersecting;
          if (entry.isIntersecting) {
            this.resumeAnimation();
          } else {
            this.pauseAnimation();
          }
        });
      }, { threshold: 0 });
      this.observer.observe(this.canvas);
    }

    // Also pause on tab hidden to maximize mobile battery life
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          this.pauseAnimation();
        } else if (this.isIntersecting) {
          this.resumeAnimation();
        }
      });
    }

    // Optimized resize handler for phones
    window.addEventListener('resize', () => {
      const oldW = this.canvas.width;
      const oldH = this.canvas.height;
      this.resize();
      // On mobile devices, address bar collapse/expand triggers resize events.
      // Only reseed stars if horizontal width changes (orientation flip) or large resize.
      if (Math.abs(oldW - this.canvas.width) > 30 || Math.abs(oldH - this.canvas.height) > 160) {
        this.initBackgroundStars();
      }
    }, { passive: true });
  }

  startRegenInterval() {
    if (this.regenInterval) clearInterval(this.regenInterval);
    this.regenInterval = setInterval(() => {
      if (!this.isPaused) {
        this.regenerateBackgroundStars();
      }
    }, starRegenerationInterval);
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  getRandomStartPoint() {
    const x = Math.random() * window.innerWidth;
    const angle = 45 + Math.random() * 90; // 45-135 degrees
    return { x, y: 0, angle };
  }

  createNewShootingStar() {
    const { x, y, angle } = this.getRandomStartPoint();
    return {
      id: Date.now() + Math.random(),
      x,
      y,
      angle,
      scale: 1,
      speed: Math.random() * 5 + 8,
      distance: 0,
      trail: []
    };
  }

  scheduleShootingStar() {
    if (this.nextShootingStarTimeout) {
      clearTimeout(this.nextShootingStarTimeout);
    }
    const delay = Math.random() * 4000 + 2000; // 2-6 seconds
    this.nextShootingStarTimeout = setTimeout(() => {
      if (!this.isPaused) {
        this.shootingStars.push(this.createNewShootingStar());
      }
      this.scheduleShootingStar();
    }, delay);
  }

  initBackgroundStars() {
    if (!this.canvas) return;
    this.backgroundStars = [];
    // Mobile optimization: cut particle density by 50% on screens < 768px
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const effectiveDensity = isMobile ? starDensity * 0.5 : starDensity;
    const area = this.canvas.width * this.canvas.height;
    const minStars = isMobile ? 12 : 25;
    const numStars = Math.max(minStars, Math.floor(area * effectiveDensity));

    for (let i = 0; i < numStars; i++) {
      const shouldTwinkle = Math.random() < twinkleProbability;
      const gridX = Math.floor(Math.random() * (this.canvas.width / pixelSize)) * pixelSize;
      const gridY = Math.floor(Math.random() * (this.canvas.height / pixelSize)) * pixelSize;
      const colorIndex = Math.floor(Math.random() * STAR_COLORS.length);
      const baseOpacity = Math.random() * 0.5 + 0.5;

      this.backgroundStars.push({
        x: gridX,
        y: gridY,
        color: STAR_COLORS[colorIndex],
        baseOpacity,
        currentOpacity: baseOpacity,
        twinkle: shouldTwinkle,
        twinkleSpeed: minTwinkleSpeed + Math.random() * (maxTwinkleSpeed - minTwinkleSpeed),
        twinkleDirection: -1,
        twinkleTimer: 0
      });
    }
  }

  pauseAnimation() {
    this.isPaused = true;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  resumeAnimation() {
    if (!this.isPaused) return;
    this.isPaused = false;
    this.lastRenderTime = performance.now();
    if (!this.animationFrameId) {
      this.startAnimation();
    }
  }

  startAnimation() {
    this.isPaused = false;
    const loop = (timestamp) => {
      if (this.isPaused) {
        this.animationFrameId = null;
        return;
      }
      // 16 FPS limiter for retro feel and high phone battery efficiency
      if (timestamp - this.lastRenderTime < this.frameInterval) {
        this.animationFrameId = requestAnimationFrame(loop);
        return;
      }
      this.lastRenderTime = timestamp;

      this.render();
      this.animationFrameId = requestAnimationFrame(loop);
    };

    if (!this.animationFrameId) {
      this.animationFrameId = requestAnimationFrame(loop);
    }
  }

  regenerateBackgroundStars() {
    if (!this.canvas || this.backgroundStars.length === 0 || this.isPaused) return;
    const numToRegenerate = Math.max(
      1,
      Math.floor(this.backgroundStars.length * percentToRegenerate)
    );

    for (let i = 0; i < numToRegenerate; i++) {
      const randomIndex = Math.floor(Math.random() * this.backgroundStars.length);
      const shouldTwinkle = Math.random() < twinkleProbability;
      const gridX = Math.floor(Math.random() * (this.canvas.width / pixelSize)) * pixelSize;
      const gridY = Math.floor(Math.random() * (this.canvas.height / pixelSize)) * pixelSize;
      const colorIndex = Math.floor(Math.random() * STAR_COLORS.length);
      const baseOpacity = Math.random() * 0.5 + 0.5;

      this.backgroundStars[randomIndex] = {
        x: gridX,
        y: gridY,
        color: STAR_COLORS[colorIndex],
        baseOpacity,
        currentOpacity: baseOpacity,
        twinkle: shouldTwinkle,
        twinkleSpeed: minTwinkleSpeed + Math.random() * (maxTwinkleSpeed - minTwinkleSpeed),
        twinkleDirection: -1,
        twinkleTimer: 0
      };
    }
  }

  render() {
    const ctx = this.ctx;
    const canvas = this.canvas;
    if (!ctx || !canvas) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Draw and update background pixel stars
    for (let i = 0; i < this.backgroundStars.length; i++) {
      const star = this.backgroundStars[i];
      ctx.fillStyle = star.color;
      ctx.globalAlpha = star.currentOpacity;
      ctx.fillRect(star.x, star.y, pixelSize, pixelSize);

      if (star.twinkle) {
        star.twinkleTimer += 1 / targetFps;
        if (star.twinkleTimer >= star.twinkleSpeed) {
          star.twinkleTimer = 0;
          star.twinkleDirection *= -1;
        }

        const progress = star.twinkleTimer / star.twinkleSpeed;
        if (progress < 0.5) {
          star.currentOpacity =
            star.twinkleDirection < 0 ? star.baseOpacity : star.baseOpacity * 0.3;
        } else {
          star.currentOpacity =
            star.twinkleDirection < 0 ? star.baseOpacity * 0.3 : star.baseOpacity;
        }
      }
    }

    // 2. Update and draw shooting stars
    if (this.shootingStars.length > 0) {
      const remainingShootingStars = [];

      for (let i = 0; i < this.shootingStars.length; i++) {
        const star = this.shootingStars[i];
        const rad = (star.angle * Math.PI) / 180;
        const newX = star.x + star.speed * Math.cos(rad);
        const newY = star.y + star.speed * Math.sin(rad);
        const newDistance = star.distance + star.speed;

        const newTrail = [...star.trail];
        if (newDistance % 8 < star.speed) {
          newTrail.push({
            x: star.x,
            y: star.y,
            opacity: 1.0
          });
        }

        const updatedTrail = newTrail
          .map(point => ({ ...point, opacity: point.opacity - 0.1 }))
          .filter(point => point.opacity > 0);

        // Check if star is within bounds
        if (
          newX >= -30 &&
          newX <= window.innerWidth + 30 &&
          newY >= -30 &&
          newY <= window.innerHeight + 30
        ) {
          remainingShootingStars.push({
            ...star,
            x: newX,
            y: newY,
            distance: newDistance,
            trail: updatedTrail
          });
        }

        // Draw shooting star trail
        for (let t = 0; t < updatedTrail.length; t++) {
          const pt = updatedTrail[t];
          ctx.save();
          ctx.translate(pt.x, pt.y);
          ctx.rotate(rad);
          ctx.translate(-pt.x, -pt.y);

          ctx.fillStyle = `rgba(180, 242, 255, ${pt.opacity})`;
          ctx.fillRect(pt.x, pt.y, shootingStarPixelSize, shootingStarPixelSize);
          ctx.restore();
        }

        // Draw shooting star head (4x2 pixel shape)
        const starWidth = 4;
        const starHeight = 2;

        ctx.save();
        ctx.translate(star.x, star.y);
        ctx.rotate(rad);
        ctx.translate(-star.x, -star.y);

        ctx.fillStyle = "#ffffff";
        ctx.globalAlpha = 1.0;

        for (let y = 0; y < starHeight; y++) {
          for (let x = 0; x < starWidth; x++) {
            if ((x === 0 && y === 1) || (x === 3 && y === 0)) continue;
            ctx.fillRect(
              star.x + x * shootingStarPixelSize,
              star.y + y * shootingStarPixelSize,
              shootingStarPixelSize,
              shootingStarPixelSize
            );
          }
        }

        ctx.restore();
      }

      this.shootingStars = remainingShootingStars;
    }
  }

  destroy() {
    this.pauseAnimation();
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    if (this.regenInterval) {
      clearInterval(this.regenInterval);
      this.regenInterval = null;
    }
    if (this.nextShootingStarTimeout) {
      clearTimeout(this.nextShootingStarTimeout);
      this.nextShootingStarTimeout = null;
    }
  }
}
