import type { SoundMixer } from '../mixer';

type ParticleShape = 'circle' | 'line' | 'ring' | 'spark';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  decay: number;
  gravity: number;
  r: number;
  g: number;
  b: number;
  volume: number;
  shape: ParticleShape;
  angle: number;
  spin: number;
  len: number;
}

interface SoundVisual {
  color: [number, number, number];
  shape: ParticleShape;
  spawnRate: number;
  spawn(w: number, h: number): Partial<Particle>;
}

// Visual config for every sound
const VISUALS: Record<string, SoundVisual> = {
  // Rain — falling vertical lines
  'light-drizzle': {
    color: [140, 180, 230], shape: 'line', spawnRate: 0.15,
    spawn: (w, _h) => ({ x: Math.random() * w, y: -5, vx: -0.15, vy: 1.2 + Math.random() * 0.6, len: 6, decay: 0.005, gravity: 0.01 }),
  },
  'steady-rain': {
    color: [100, 150, 220], shape: 'line', spawnRate: 0.35,
    spawn: (w, _h) => ({ x: Math.random() * w, y: -5, vx: -0.3, vy: 1.8 + Math.random(), len: 10, decay: 0.006, gravity: 0.015 }),
  },
  'heavy-downpour': {
    color: [70, 110, 190], shape: 'line', spawnRate: 0.6,
    spawn: (w, _h) => ({ x: Math.random() * w, y: -5, vx: -0.5, vy: 2.5 + Math.random() * 1.5, len: 14, decay: 0.007, gravity: 0.02 }),
  },
  'thunderstorm': {
    color: [80, 100, 200], shape: 'line', spawnRate: 0.5,
    spawn: (w, _h) => ({ x: Math.random() * w, y: -5, vx: -0.6, vy: 2 + Math.random() * 2, len: 12, decay: 0.006, gravity: 0.018 }),
  },
  // Wind — horizontal streaks
  'gentle-breeze': {
    color: [170, 210, 190], shape: 'line', spawnRate: 0.12,
    spawn: (_w, h) => ({ x: -10, y: Math.random() * h, vx: 0.6 + Math.random() * 0.8, vy: Math.sin(Date.now() / 1200) * 0.15, len: 18, decay: 0.004, gravity: 0, angle: 0 }),
  },
  'forest-wind': {
    color: [100, 160, 100], shape: 'line', spawnRate: 0.18,
    spawn: (_w, h) => ({ x: -10, y: Math.random() * h, vx: 1 + Math.random() * 1.5, vy: Math.sin(Date.now() / 800 + Math.random() * 3) * 0.4, len: 22, decay: 0.005, gravity: 0 }),
  },
  'coastal-wind': {
    color: [120, 190, 200], shape: 'line', spawnRate: 0.25,
    spawn: (_w, h) => ({ x: -10, y: h * 0.3 + Math.random() * h * 0.5, vx: 1.5 + Math.random() * 2, vy: (Math.random() - 0.5) * 0.8, len: 16, decay: 0.006, gravity: 0 }),
  },
  // Nature
  'crackling-fire': {
    color: [255, 140, 40], shape: 'spark', spawnRate: 0.3,
    spawn: (w, h) => ({ x: w * 0.3 + Math.random() * w * 0.4, y: h + 2, vx: (Math.random() - 0.5) * 0.6, vy: -0.8 - Math.random() * 1.2, size: 2 + Math.random() * 2.5, decay: 0.01 + Math.random() * 0.008, gravity: -0.008 }),
  },
  'flowing-river': {
    color: [100, 200, 210], shape: 'circle', spawnRate: 0.2,
    spawn: (_w, h) => ({ x: -5, y: h * 0.5 + (Math.random() - 0.5) * h * 0.3, vx: 0.5 + Math.random() * 0.8, vy: Math.sin(Date.now() / 600) * 0.2, size: 2 + Math.random() * 1.5, decay: 0.004, gravity: 0 }),
  },
  'rustling-leaves': {
    color: [190, 150, 60], shape: 'circle', spawnRate: 0.15,
    spawn: (w, _h) => ({ x: Math.random() * w, y: -5, vx: 0.3 + Math.random() * 0.5, vy: 0.3 + Math.random() * 0.4, size: 2.5 + Math.random() * 2, decay: 0.004, gravity: 0.003, spin: (Math.random() - 0.5) * 0.08 }),
  },
  'birds-at-dawn': {
    color: [240, 210, 80], shape: 'circle', spawnRate: 0.08,
    spawn: (w, h) => {
      const startX = Math.random() * w;
      return { x: startX, y: h * 0.15 + Math.random() * h * 0.35, vx: (Math.random() - 0.5) * 2.5, vy: (Math.random() - 0.5) * 1.5, size: 1.5 + Math.random(), decay: 0.012, gravity: 0 };
    },
  },
  'crickets-night': {
    color: [140, 220, 100], shape: 'spark', spawnRate: 0.1,
    spawn: (w, h) => ({ x: Math.random() * w, y: h * 0.5 + Math.random() * h * 0.4, vx: 0, vy: 0, size: 1.5 + Math.random(), decay: 0.02 + Math.random() * 0.02, gravity: 0 }),
  },
  // Urban
  'coffee-shop': {
    color: [220, 185, 140], shape: 'circle', spawnRate: 0.12,
    spawn: (w, h) => ({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - 0.5) * 0.2, vy: -0.1 - Math.random() * 0.15, size: 2 + Math.random() * 1.5, decay: 0.005, gravity: 0 }),
  },
  'horse-hooves': {
    color: [180, 130, 80], shape: 'spark', spawnRate: 0.1,
    spawn: (w, h) => ({ x: w * 0.2 + Math.random() * w * 0.6, y: h * 0.85, vx: (Math.random() - 0.5) * 1.5, vy: -1.5 - Math.random() * 2, size: 1.5 + Math.random(), decay: 0.025, gravity: 0.06 }),
  },
  'crowd-murmur': {
    color: [200, 170, 155], shape: 'circle', spawnRate: 0.15,
    spawn: (w, h) => ({ x: Math.random() * w, y: h * 0.4 + Math.random() * h * 0.4, vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.15, size: 1.5 + Math.random() * 2, decay: 0.006, gravity: 0 }),
  },
  'train-journey': {
    color: [160, 170, 190], shape: 'line', spawnRate: 0.2,
    spawn: (_w, h) => ({ x: -10, y: h * 0.6 + (Math.random() - 0.5) * 20, vx: 2.5 + Math.random() * 2, vy: 0, len: 24 + Math.random() * 12, decay: 0.008, gravity: 0 }),
  },
  // Focus
  'deep-space': {
    color: [100, 80, 200], shape: 'ring', spawnRate: 0.04,
    spawn: (w, h) => ({ x: w / 2 + (Math.random() - 0.5) * w * 0.3, y: h / 2 + (Math.random() - 0.5) * h * 0.3, vx: 0, vy: 0, size: 2, decay: 0.003, gravity: 0, spin: 0.01 }),
  },
  'deep-water': {
    color: [50, 130, 170], shape: 'circle', spawnRate: 0.08,
    spawn: (w, h) => ({ x: Math.random() * w, y: h + 5, vx: (Math.random() - 0.5) * 0.2, vy: -0.3 - Math.random() * 0.3, size: 3 + Math.random() * 3, decay: 0.003, gravity: -0.002 }),
  },
  'tibetan-bowl': {
    color: [220, 190, 90], shape: 'ring', spawnRate: 0.03,
    spawn: (w, h) => ({ x: w / 2, y: h / 2, vx: 0, vy: 0, size: 1, decay: 0.002, gravity: 0, spin: 0.005 }),
  },
};

export class Visualizer {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private animationId: number | null = null;
  private particles: Particle[] = [];
  private time = 0;
  private flashAlpha = 0;

  constructor(private readonly mixer: SoundMixer) {}

  start(): void {
    this.canvas = document.getElementById('visualizer') as HTMLCanvasElement;
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
    this.animate();
  }

  private resizeCanvas(): void {
    if (!this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width * window.devicePixelRatio;
    this.canvas.height = rect.height * window.devicePixelRatio;
    this.ctx?.scale(window.devicePixelRatio, window.devicePixelRatio);
  }

  private readonly animate = (): void => {
    if (!this.ctx || !this.canvas) return;

    const w = this.canvas.width / window.devicePixelRatio;
    const h = this.canvas.height / window.devicePixelRatio;
    const c = this.ctx;
    this.time += 0.016;

    // Fade trail — longer trail for dreamy feel
    c.fillStyle = 'rgba(10, 10, 15, 0.12)';
    c.fillRect(0, 0, w, h);

    const state = this.mixer.state;
    const activeSounds = Object.values(state.sounds).filter((s) => s.active);

    // Lightning flash for thunderstorm
    if (activeSounds.some(s => s.id === 'thunderstorm') && Math.random() < 0.003) {
      this.flashAlpha = 0.6 + Math.random() * 0.3;
    }
    if (this.flashAlpha > 0) {
      c.fillStyle = `rgba(200, 210, 255, ${this.flashAlpha})`;
      c.fillRect(0, 0, w, h);
      this.flashAlpha *= 0.85;
      if (this.flashAlpha < 0.01) this.flashAlpha = 0;
    }

    if (activeSounds.length === 0) {
      // Idle — breathing wave
      this.drawIdleWave(c, w, h);
    } else {
      // Ambient glow at bottom
      this.drawAmbientGlow(c, w, h, activeSounds);

      // Spawn particles
      for (const sound of activeSounds) {
        const visual = VISUALS[sound.id];
        if (!visual) continue;
        const rate = visual.spawnRate * sound.volume;
        if (Math.random() < rate) {
          this.spawnParticle(sound.id, w, h, sound.volume);
        }
      }

      // Central orb
      this.drawCentralOrb(c, w, h, activeSounds);
    }

    // Update and draw particles
    this.updateParticles(c);

    this.animationId = requestAnimationFrame(this.animate);
  };

  private drawIdleWave(c: CanvasRenderingContext2D, w: number, h: number): void {
    const t = this.time;
    c.beginPath();
    c.moveTo(0, h / 2);
    for (let x = 0; x <= w; x += 2) {
      const y = h / 2 + Math.sin(x * 0.015 + t * 0.8) * 4 + Math.sin(x * 0.008 + t * 0.5) * 3;
      c.lineTo(x, y);
    }
    c.strokeStyle = 'rgba(124, 111, 247, 0.08)';
    c.lineWidth = 1.5;
    c.stroke();

    // Breathing dots
    for (let i = 0; i < 5; i++) {
      const x = w * (0.15 + i * 0.175);
      const y = h / 2 + Math.sin(t * 0.6 + i * 1.2) * 6;
      const a = 0.06 + Math.sin(t * 0.8 + i * 0.7) * 0.04;
      const r = 2 + Math.sin(t * 0.5 + i) * 0.8;
      c.beginPath();
      c.arc(x, y, r, 0, Math.PI * 2);
      c.fillStyle = `rgba(124, 111, 247, ${a})`;
      c.fill();
    }
  }

  private drawAmbientGlow(c: CanvasRenderingContext2D, w: number, h: number, sounds: { id: string; volume: number }[]): void {
    let rSum = 0, gSum = 0, bSum = 0, totalVol = 0;
    for (const s of sounds) {
      const v = VISUALS[s.id];
      if (!v) continue;
      rSum += v.color[0] * s.volume;
      gSum += v.color[1] * s.volume;
      bSum += v.color[2] * s.volume;
      totalVol += s.volume;
    }
    if (totalVol === 0) return;
    const r = Math.round(rSum / totalVol);
    const g = Math.round(gSum / totalVol);
    const b = Math.round(bSum / totalVol);
    const alpha = Math.min(totalVol * 0.04, 0.12);

    const grad = c.createLinearGradient(0, h * 0.6, 0, h);
    grad.addColorStop(0, 'transparent');
    grad.addColorStop(1, `rgba(${r}, ${g}, ${b}, ${alpha})`);
    c.fillStyle = grad;
    c.fillRect(0, 0, w, h);
  }

  private drawCentralOrb(c: CanvasRenderingContext2D, w: number, h: number, sounds: { id: string; volume: number }[]): void {
    let rSum = 0, gSum = 0, bSum = 0, totalVol = 0;
    for (const s of sounds) {
      const v = VISUALS[s.id];
      if (!v) continue;
      rSum += v.color[0] * s.volume;
      gSum += v.color[1] * s.volume;
      bSum += v.color[2] * s.volume;
      totalVol += s.volume;
    }
    if (totalVol === 0) return;
    const r = Math.round(rSum / totalVol);
    const g = Math.round(gSum / totalVol);
    const b = Math.round(bSum / totalVol);

    const pulse = 1 + Math.sin(this.time * 1.5) * 0.15;
    const baseRadius = 6 + Math.min(totalVol * 3, 16);
    const radius = baseRadius * pulse;
    const alpha = Math.min(0.06 + totalVol * 0.03, 0.2);

    const cx = w / 2;
    const cy = h / 2;

    // Outer glow
    const grad = c.createRadialGradient(cx, cy, 0, cx, cy, radius * 3);
    grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${alpha})`);
    grad.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, ${alpha * 0.3})`);
    grad.addColorStop(1, 'transparent');
    c.fillStyle = grad;
    c.beginPath();
    c.arc(cx, cy, radius * 3, 0, Math.PI * 2);
    c.fill();

    // Core
    c.beginPath();
    c.arc(cx, cy, radius * 0.4, 0, Math.PI * 2);
    c.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha * 1.5})`;
    c.fill();
  }

  private spawnParticle(soundId: string, w: number, h: number, volume: number): void {
    const visual = VISUALS[soundId];
    if (!visual) return;
    const config = visual.spawn(w, h);
    const [r, g, b] = visual.color;

    this.particles.push({
      x: config.x ?? Math.random() * w,
      y: config.y ?? Math.random() * h,
      vx: config.vx ?? 0,
      vy: config.vy ?? 0,
      size: config.size ?? 2,
      life: 1,
      decay: config.decay ?? 0.008,
      gravity: config.gravity ?? 0,
      r, g, b,
      volume,
      shape: visual.shape,
      angle: config.angle ?? 0,
      spin: config.spin ?? 0,
      len: config.len ?? 8,
    });
  }

  private updateParticles(c: CanvasRenderingContext2D): void {
    this.particles = this.particles.filter((p) => {
      p.life -= p.decay;
      if (p.life <= 0) return false;

      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.angle += p.spin;

      const alpha = p.life * Math.min(p.volume * 1.2, 1);

      switch (p.shape) {
        case 'line':
          this.drawLine(c, p, alpha);
          break;
        case 'ring':
          this.drawRing(c, p, alpha);
          break;
        case 'spark':
          this.drawSpark(c, p, alpha);
          break;
        default:
          this.drawCircle(c, p, alpha);
      }

      return true;
    });

    if (this.particles.length > 300) {
      this.particles = this.particles.slice(-300);
    }
  }

  private drawCircle(c: CanvasRenderingContext2D, p: Particle, alpha: number): void {
    c.beginPath();
    c.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
    c.fillStyle = `rgba(${p.r}, ${p.g}, ${p.b}, ${alpha})`;
    c.fill();
  }

  private drawLine(c: CanvasRenderingContext2D, p: Particle, alpha: number): void {
    const angle = p.angle || Math.atan2(p.vy, p.vx);
    const len = p.len * p.life;
    c.beginPath();
    c.moveTo(p.x, p.y);
    c.lineTo(p.x + Math.cos(angle) * len, p.y + Math.sin(angle) * len);
    c.strokeStyle = `rgba(${p.r}, ${p.g}, ${p.b}, ${alpha * 0.7})`;
    c.lineWidth = Math.max(0.5, p.size * p.life * 0.6);
    c.stroke();
  }

  private drawRing(c: CanvasRenderingContext2D, p: Particle, alpha: number): void {
    const radius = p.size * (2 - p.life) * 12;
    c.beginPath();
    c.arc(p.x, p.y, radius, 0, Math.PI * 2);
    c.strokeStyle = `rgba(${p.r}, ${p.g}, ${p.b}, ${alpha * 0.4})`;
    c.lineWidth = Math.max(0.3, 1.5 * p.life);
    c.stroke();
  }

  private drawSpark(c: CanvasRenderingContext2D, p: Particle, alpha: number): void {
    const r = p.size * p.life;
    // Glow
    const grad = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 2.5);
    grad.addColorStop(0, `rgba(${p.r}, ${p.g}, ${p.b}, ${alpha * 0.8})`);
    grad.addColorStop(1, `rgba(${p.r}, ${p.g}, ${p.b}, 0)`);
    c.fillStyle = grad;
    c.beginPath();
    c.arc(p.x, p.y, r * 2.5, 0, Math.PI * 2);
    c.fill();
    // Core
    c.beginPath();
    c.arc(p.x, p.y, r * 0.6, 0, Math.PI * 2);
    c.fillStyle = `rgba(${Math.min(p.r + 40, 255)}, ${Math.min(p.g + 40, 255)}, ${Math.min(p.b + 20, 255)}, ${alpha})`;
    c.fill();
  }

  stop(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }
}
