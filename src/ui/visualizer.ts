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
  bg: [number, number, number];  // scene background tint
  shape: ParticleShape;
  spawnRate: number;
  spawn(w: number, h: number): Partial<Particle>;
}

// Visual config for every sound
const VISUALS: Record<string, SoundVisual> = {
  // Rain — falling vertical lines
  'light-drizzle': {
    color: [140, 180, 230], bg: [15, 18, 30], shape: 'line', spawnRate: 0.15,
    spawn: (w, _h) => ({ x: Math.random() * w, y: -5, vx: -0.15, vy: 1.2 + Math.random() * 0.6, len: 6, decay: 0.005, gravity: 0.01 }),
  },
  'steady-rain': {
    color: [100, 150, 220], bg: [12, 15, 28], shape: 'line', spawnRate: 0.35,
    spawn: (w, _h) => ({ x: Math.random() * w, y: -5, vx: -0.3, vy: 1.8 + Math.random(), len: 10, decay: 0.006, gravity: 0.015 }),
  },
  'heavy-downpour': {
    color: [70, 110, 190], bg: [10, 12, 25], shape: 'line', spawnRate: 0.6,
    spawn: (w, _h) => ({ x: Math.random() * w, y: -5, vx: -0.5, vy: 2.5 + Math.random() * 1.5, len: 14, decay: 0.007, gravity: 0.02 }),
  },
  'thunderstorm': {
    color: [80, 100, 200], bg: [8, 8, 20], shape: 'line', spawnRate: 0.5,
    spawn: (w, _h) => ({ x: Math.random() * w, y: -5, vx: -0.6, vy: 2 + Math.random() * 2, len: 12, decay: 0.006, gravity: 0.018 }),
  },
  // Wind — horizontal streaks
  'gentle-breeze': {
    color: [170, 210, 190], bg: [12, 18, 15], shape: 'line', spawnRate: 0.12,
    spawn: (_w, h) => ({ x: -10, y: Math.random() * h, vx: 0.6 + Math.random() * 0.8, vy: Math.sin(Date.now() / 1200) * 0.15, len: 18, decay: 0.004, gravity: 0, angle: 0 }),
  },
  'forest-wind': {
    color: [100, 160, 100], bg: [8, 20, 10], shape: 'line', spawnRate: 0.18,
    spawn: (_w, h) => ({ x: -10, y: Math.random() * h, vx: 1 + Math.random() * 1.5, vy: Math.sin(Date.now() / 800 + Math.random() * 3) * 0.4, len: 22, decay: 0.005, gravity: 0 }),
  },
  'coastal-wind': {
    color: [120, 190, 200], bg: [14, 22, 28], shape: 'line', spawnRate: 0.25,
    spawn: (_w, h) => ({ x: -10, y: h * 0.3 + Math.random() * h * 0.5, vx: 1.5 + Math.random() * 2, vy: (Math.random() - 0.5) * 0.8, len: 16, decay: 0.006, gravity: 0 }),
  },
  // Nature
  'crackling-fire': {
    color: [255, 140, 40], bg: [20, 8, 4], shape: 'spark', spawnRate: 0.3,
    spawn: (w, h) => ({ x: w * 0.3 + Math.random() * w * 0.4, y: h + 2, vx: (Math.random() - 0.5) * 0.6, vy: -0.8 - Math.random() * 1.2, size: 2 + Math.random() * 2.5, decay: 0.01 + Math.random() * 0.008, gravity: -0.008 }),
  },
  'flowing-river': {
    color: [100, 200, 210], bg: [8, 18, 22], shape: 'circle', spawnRate: 0.2,
    spawn: (_w, h) => ({ x: -5, y: h * 0.5 + (Math.random() - 0.5) * h * 0.3, vx: 0.5 + Math.random() * 0.8, vy: Math.sin(Date.now() / 600) * 0.2, size: 2 + Math.random() * 1.5, decay: 0.004, gravity: 0 }),
  },
  'rustling-leaves': {
    color: [190, 150, 60], bg: [18, 16, 8], shape: 'circle', spawnRate: 0.15,
    spawn: (w, _h) => ({ x: Math.random() * w, y: -5, vx: 0.3 + Math.random() * 0.5, vy: 0.3 + Math.random() * 0.4, size: 2.5 + Math.random() * 2, decay: 0.004, gravity: 0.003, spin: (Math.random() - 0.5) * 0.08 }),
  },
  'birds-at-dawn': {
    color: [240, 210, 80], bg: [35, 20, 15], shape: 'circle', spawnRate: 0.08,
    spawn: (w, h) => {
      const startX = Math.random() * w;
      return { x: startX, y: h * 0.15 + Math.random() * h * 0.35, vx: (Math.random() - 0.5) * 2.5, vy: (Math.random() - 0.5) * 1.5, size: 1.5 + Math.random(), decay: 0.012, gravity: 0 };
    },
  },
  'crickets-night': {
    color: [140, 220, 100], bg: [4, 6, 12], shape: 'spark', spawnRate: 0.1,
    spawn: (w, h) => ({ x: Math.random() * w, y: h * 0.5 + Math.random() * h * 0.4, vx: 0, vy: 0, size: 1.5 + Math.random(), decay: 0.02 + Math.random() * 0.02, gravity: 0 }),
  },
  // Urban
  'coffee-shop': {
    color: [220, 185, 140], bg: [22, 15, 10], shape: 'circle', spawnRate: 0.12,
    spawn: (w, h) => ({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - 0.5) * 0.2, vy: -0.1 - Math.random() * 0.15, size: 2 + Math.random() * 1.5, decay: 0.005, gravity: 0 }),
  },
  'horse-hooves': {
    color: [180, 130, 80], bg: [20, 16, 10], shape: 'spark', spawnRate: 0.1,
    spawn: (w, h) => ({ x: w * 0.2 + Math.random() * w * 0.6, y: h * 0.85, vx: (Math.random() - 0.5) * 1.5, vy: -1.5 - Math.random() * 2, size: 1.5 + Math.random(), decay: 0.025, gravity: 0.06 }),
  },
  'crowd-murmur': {
    color: [200, 170, 155], bg: [18, 14, 12], shape: 'circle', spawnRate: 0.15,
    spawn: (w, h) => ({ x: Math.random() * w, y: h * 0.4 + Math.random() * h * 0.4, vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.15, size: 1.5 + Math.random() * 2, decay: 0.006, gravity: 0 }),
  },
  'train-journey': {
    color: [160, 170, 190], bg: [12, 14, 20], shape: 'line', spawnRate: 0.2,
    spawn: (_w, h) => ({ x: -10, y: h * 0.6 + (Math.random() - 0.5) * 20, vx: 2.5 + Math.random() * 2, vy: 0, len: 24 + Math.random() * 12, decay: 0.008, gravity: 0 }),
  },
  // Focus
  'deep-space': {
    color: [100, 80, 200], bg: [4, 3, 12], shape: 'ring', spawnRate: 0.04,
    spawn: (w, h) => ({ x: w / 2 + (Math.random() - 0.5) * w * 0.3, y: h / 2 + (Math.random() - 0.5) * h * 0.3, vx: 0, vy: 0, size: 2, decay: 0.003, gravity: 0, spin: 0.01 }),
  },
  'deep-water': {
    color: [50, 130, 170], bg: [4, 10, 18], shape: 'circle', spawnRate: 0.08,
    spawn: (w, h) => ({ x: Math.random() * w, y: h + 5, vx: (Math.random() - 0.5) * 0.2, vy: -0.3 - Math.random() * 0.3, size: 3 + Math.random() * 3, decay: 0.003, gravity: -0.002 }),
  },
  'tibetan-bowl': {
    color: [220, 190, 90], bg: [15, 12, 8], shape: 'ring', spawnRate: 0.03,
    spawn: (w, h) => ({ x: w / 2, y: h / 2, vx: 0, vy: 0, size: 1, decay: 0.002, gravity: 0, spin: 0.005 }),
  },
  // Horror
  'horror-ghosts': {
    color: [160, 180, 200], bg: [6, 8, 14], shape: 'circle', spawnRate: 0.06,
    spawn: (w, h) => ({ x: Math.random() * w, y: h * 0.3 + Math.random() * h * 0.5, vx: (Math.random() - 0.5) * 0.3, vy: -0.2 - Math.random() * 0.3, size: 4 + Math.random() * 4, decay: 0.003, gravity: -0.003 }),
  },
  'horror-music': {
    color: [120, 50, 80], bg: [10, 4, 8], shape: 'line', spawnRate: 0.08,
    spawn: (w, h) => ({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - 0.5) * 0.5, vy: (Math.random() - 0.5) * 0.5, len: 15 + Math.random() * 10, decay: 0.004, gravity: 0, spin: (Math.random() - 0.5) * 0.03 }),
  },
  'horror-heartbeat': {
    color: [180, 30, 30], bg: [12, 3, 3], shape: 'ring', spawnRate: 0.05,
    spawn: (w, _h) => ({ x: w / 2, y: _h / 2, vx: 0, vy: 0, size: 2, decay: 0.008, gravity: 0 }),
  },
  'dripping-cave': {
    color: [80, 120, 140], bg: [6, 8, 10], shape: 'circle', spawnRate: 0.08,
    spawn: (w, _h) => ({ x: w * 0.2 + Math.random() * w * 0.6, y: 0, vx: 0, vy: 0.5 + Math.random() * 0.5, size: 2 + Math.random(), decay: 0.006, gravity: 0.02 }),
  },
  // Soundscapes
  'roman-piazza': {
    color: [220, 190, 130], bg: [25, 20, 12], shape: 'circle', spawnRate: 0.1,
    spawn: (w, h) => ({ x: Math.random() * w, y: h * 0.5 + Math.random() * h * 0.3, vx: (Math.random() - 0.5) * 0.3, vy: -0.05 - Math.random() * 0.1, size: 2 + Math.random() * 2, decay: 0.005, gravity: 0 }),
  },
  'ancient-kyoto': {
    color: [180, 140, 160], bg: [18, 12, 14], shape: 'circle', spawnRate: 0.06,
    spawn: (w, _h) => ({ x: Math.random() * w, y: -5, vx: 0.1 + Math.random() * 0.2, vy: 0.2 + Math.random() * 0.3, size: 2 + Math.random() * 1.5, decay: 0.004, gravity: 0.002 }),
  },
  'amsterdam-canal': {
    color: [100, 140, 160], bg: [10, 14, 18], shape: 'circle', spawnRate: 0.1,
    spawn: (w, h) => ({ x: Math.random() * w, y: h * 0.5 + Math.random() * h * 0.3, vx: 0.2 + Math.random() * 0.3, vy: (Math.random() - 0.5) * 0.1, size: 2 + Math.random() * 2, decay: 0.004, gravity: 0 }),
  },
};

export class Visualizer {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private animationId: number | null = null;
  private particles: Particle[] = [];
  private time = 0;
  private flashAlpha = 0;
  private prevEnergy = 0;
  private bgR = 10;
  private bgG = 10;
  private bgB = 15;

  constructor(private readonly mixer: SoundMixer) {}

  start(): void {
    this.canvas = document.getElementById('visualizer') as HTMLCanvasElement;
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
    screen.orientation?.addEventListener('change', () => this.resizeCanvas());
    this.animate();
  }

  private resizeCanvas(): void {
    if (!this.canvas || !this.ctx) return;
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width * window.devicePixelRatio;
    this.canvas.height = rect.height * window.devicePixelRatio;
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  }

  private readonly animate = (): void => {
    if (!this.ctx || !this.canvas) return;

    const w = this.canvas.width / window.devicePixelRatio;
    const h = this.canvas.height / window.devicePixelRatio;
    const c = this.ctx;
    this.time += 0.016;

    const state = this.mixer.state;
    const activeSounds = Object.values(state.sounds).filter((s) => s.active);

    // Fade trail — background color blended from active sounds
    let targetR = 10, targetG = 10, targetB = 15; // default dark
    if (activeSounds.length > 0) {
      let rSum = 0, gSum = 0, bSum = 0, totalW = 0;
      for (const s of activeSounds) {
        const v = VISUALS[s.id];
        if (!v) continue;
        const w2 = s.volume;
        rSum += v.bg[0] * w2;
        gSum += v.bg[1] * w2;
        bSum += v.bg[2] * w2;
        totalW += w2;
      }
      if (totalW > 0) {
        targetR = Math.round(rSum / totalW);
        targetG = Math.round(gSum / totalW);
        targetB = Math.round(bSum / totalW);
      }
    }
    // Smooth transition
    this.bgR += (targetR - this.bgR) * 0.02;
    this.bgG += (targetG - this.bgG) * 0.02;
    this.bgB += (targetB - this.bgB) * 0.02;
    const br = Math.round(this.bgR);
    const bg = Math.round(this.bgG);
    const bb = Math.round(this.bgB);
    c.fillStyle = `rgba(${br}, ${bg}, ${bb}, 0.12)`;
    c.fillRect(0, 0, w, h);

    // Get real audio data
    const freqData = this.mixer.getFrequencyData();

    // Compute energy from frequency data (perceptually weighted)
    let energy = 0;
    let bassEnergy = 0;
    let midEnergy = 0;
    let highEnergy = 0;
    const binCount = this.mixer.frequencyBinCount;

    if (freqData && binCount > 0) {
      const bassBins = Math.floor(binCount * 0.15);   // ~0-1300Hz
      const midBins = Math.floor(binCount * 0.45);    // ~1300-4000Hz
      for (let i = 0; i < binCount; i++) {
        const v = freqData[i] / 255;
        energy += v * v;
        if (i < bassBins) bassEnergy += v * v;
        else if (i < midBins) midEnergy += v * v;
        else highEnergy += v * v;
      }
      energy = Math.sqrt(energy / binCount);
      bassEnergy = Math.sqrt(bassEnergy / Math.max(bassBins, 1));
      midEnergy = Math.sqrt(midEnergy / Math.max(midBins - bassBins, 1));
      highEnergy = Math.sqrt(highEnergy / Math.max(binCount - midBins, 1));
    }

    // Smooth energy for orb
    this.prevEnergy = this.prevEnergy * 0.7 + energy * 0.3;

    // Lightning flash + bolt for thunderstorm
    if (activeSounds.some(s => s.id === 'thunderstorm') && Math.random() < 0.003) {
      this.flashAlpha = 0.6 + Math.random() * 0.3;
    }
    if (this.flashAlpha > 0) {
      c.fillStyle = `rgba(200, 210, 255, ${this.flashAlpha})`;
      c.fillRect(0, 0, w, h);
      // Lightning bolt
      if (this.flashAlpha > 0.3) {
        this.drawLightningBolt(c, w, h, this.flashAlpha);
      }
      this.flashAlpha *= 0.85;
      if (this.flashAlpha < 0.01) this.flashAlpha = 0;
    }

    if (activeSounds.length === 0) {
      // Idle — breathing wave
      this.drawIdleWave(c, w, h);
    } else {
      // Ambient glow at bottom — driven by bass energy
      this.drawAmbientGlow(c, w, h, activeSounds, bassEnergy);

      // Spawn particles — rate driven by audio energy per band
      for (const sound of activeSounds) {
        const visual = VISUALS[sound.id];
        if (!visual) continue;
        // Base rate modulated by actual audio energy
        const audioMod = 0.3 + energy * 2;
        const rate = visual.spawnRate * sound.volume * audioMod;
        if (Math.random() < rate) {
          this.spawnParticle(sound.id, w, h, sound.volume * (0.5 + energy));
        }
      }

      // Central orb — pulses with smoothed energy
      this.drawCentralOrb(c, w, h, activeSounds, this.prevEnergy);

      // Sound-specific themed effects — driven by audio energy
      this.drawSoundEffects(c, w, h, activeSounds, bassEnergy, midEnergy, highEnergy);
    }

    // Update and draw particles
    this.updateParticles(c);

    this.animationId = requestAnimationFrame(this.animate);
  };

  private drawLightningBolt(c: CanvasRenderingContext2D, w: number, h: number, alpha: number): void {
    const startX = w * (0.3 + Math.random() * 0.4);
    let x = startX;
    let y = 0;
    const endY = h * (0.5 + Math.random() * 0.3);

    c.beginPath();
    c.moveTo(x, y);
    while (y < endY) {
      y += 8 + Math.random() * 15;
      x += (Math.random() - 0.5) * 30;
      c.lineTo(x, y);
      // Branch
      if (Math.random() < 0.25) {
        const bx = x + (Math.random() - 0.5) * 40;
        const by = y + 15 + Math.random() * 25;
        c.moveTo(x, y);
        c.lineTo(bx, by);
        c.moveTo(x, y);
      }
    }
    // Bright core
    c.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.8})`;
    c.lineWidth = 2.5;
    c.stroke();
    // Outer glow
    c.strokeStyle = `rgba(170, 190, 255, ${alpha * 0.4})`;
    c.lineWidth = 6;
    c.stroke();
  }

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

  private drawAmbientGlow(c: CanvasRenderingContext2D, w: number, h: number, sounds: { id: string; volume: number }[], bassEnergy: number): void {
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
    // Alpha driven by actual bass energy
    const alpha = Math.min(0.02 + bassEnergy * 0.2, 0.15);

    const grad = c.createLinearGradient(0, h * 0.6, 0, h);
    grad.addColorStop(0, 'transparent');
    grad.addColorStop(1, `rgba(${r}, ${g}, ${b}, ${alpha})`);
    c.fillStyle = grad;
    c.fillRect(0, 0, w, h);
  }

  private drawCentralOrb(c: CanvasRenderingContext2D, w: number, h: number, sounds: { id: string; volume: number }[], energy: number): void {
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

    // Radius and alpha driven by real audio energy
    const baseRadius = 4 + energy * 30;
    const pulse = 1 + Math.sin(this.time * 1.5) * 0.08;
    const radius = baseRadius * pulse;
    const alpha = Math.min(0.04 + energy * 0.25, 0.3);

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

  /** Dispatch sound-specific visual effects driven by audio energy */
  private drawSoundEffects(c: CanvasRenderingContext2D, w: number, h: number, sounds: { id: string; volume: number }[], bass: number, mid: number, high: number): void {
    for (const s of sounds) {
      const vol = s.volume;
      const visual = VISUALS[s.id];
      if (!visual) continue;
      const [cr, cg, cb] = visual.color;

      switch (s.id) {
        // --- Rain: puddle ripples at the bottom ---
        case 'light-drizzle':
        case 'steady-rain':
        case 'heavy-downpour':
        case 'thunderstorm':
          this.drawPuddleRipples(c, w, h, cr, cg, cb, vol, mid);
          break;

        // --- Wind: sweeping gusts ---
        case 'gentle-breeze':
        case 'forest-wind':
        case 'coastal-wind':
          this.drawWindGusts(c, w, h, cr, cg, cb, vol, mid);
          break;

        // --- Fire: heat shimmer + ember floor ---
        case 'crackling-fire':
          this.drawHeatShimmer(c, w, h, vol, high);
          break;

        // --- Leaves: tumbling leaf shapes ---
        case 'rustling-leaves':
          this.drawTumblingLeaves(c, w, h, vol, mid);
          break;

        // --- River: undulating water surface ---
        case 'flowing-river':
          this.drawWaterSurface(c, w, h, cr, cg, cb, vol, bass);
          break;

        // --- Birds: small wing arcs ---
        case 'birds-at-dawn':
          this.drawBirdArcs(c, w, h, vol, high);
          break;

        // --- Crickets: firefly twinkles ---
        case 'crickets-night':
          this.drawFireflies(c, w, h, cr, cg, cb, vol, high);
          break;

        // --- Coffee shop: rising steam ---
        case 'coffee-shop':
          this.drawSteam(c, w, h, vol, mid);
          break;

        // --- Horse hooves: dust puffs ---
        case 'horse-hooves':
          this.drawDustPuffs(c, w, h, vol, bass);
          break;

        // --- Train: passing landscape streaks ---
        case 'train-journey':
          this.drawLandscapeStreaks(c, w, h, cr, cg, cb, vol, bass);
          break;

        // --- Deep space: nebula clouds ---
        case 'deep-space':
          this.drawNebula(c, w, h, cr, cg, cb, vol, bass);
          break;

        // --- Deep water: caustic light patterns ---
        case 'deep-water':
          this.drawCaustics(c, w, h, cr, cg, cb, vol, bass);
          break;

        // --- Tibetan bowl: concentric vibration rings ---
        case 'tibetan-bowl':
          this.drawVibrationRings(c, w, h, cr, cg, cb, vol, mid);
          break;

        // --- Horror: ghostly wisps floating upward ---
        case 'horror-ghosts':
          this.drawGhostlyWisps(c, w, h, cr, cg, cb, vol, mid);
          break;

        // --- Horror music: dissonant vibrating lines ---
        case 'horror-music':
          this.drawDissonantLines(c, w, h, cr, cg, cb, vol, bass);
          break;

        // --- Horror heartbeat: pulsing red rings ---
        case 'horror-heartbeat':
          this.drawHeartbeatPulse(c, w, h, vol, bass);
          break;

        // --- Dripping cave: stalactite drips ---
        case 'dripping-cave':
          this.drawStalactiteDrips(c, w, h, cr, cg, cb, vol, high);
          break;

        // --- Roman piazza: warm floating motes ---
        case 'roman-piazza':
          this.drawWarmMotes(c, w, h, cr, cg, cb, vol, mid);
          break;

        // --- Ancient Kyoto: falling petals ---
        case 'ancient-kyoto':
          this.drawFallingPetals(c, w, h, vol, mid);
          break;

        // --- Amsterdam canal: water reflections ---
        case 'amsterdam-canal':
          this.drawWaterReflections(c, w, h, cr, cg, cb, vol, bass);
          break;
      }
    }
  }

  // --- Themed effect methods ---

  private drawPuddleRipples(c: CanvasRenderingContext2D, w: number, h: number, r: number, g: number, b: number, vol: number, mid: number): void {
    const t = this.time;

    // Misty fog layer drifting at ground level
    const fogAlpha = 0.015 + mid * 0.025 * vol;
    for (let i = 0; i < 3; i++) {
      const fogX = (t * 8 * (0.3 + i * 0.2) + i * w * 0.4) % (w * 1.5) - w * 0.25;
      const fogY = h * (0.75 + i * 0.06);
      const grad = c.createRadialGradient(fogX, fogY, 0, fogX, fogY, w * 0.3);
      grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${fogAlpha})`);
      grad.addColorStop(1, 'transparent');
      c.fillStyle = grad;
      c.beginPath();
      c.ellipse(fogX, fogY, w * 0.3, 20 + mid * 15, 0, 0, Math.PI * 2);
      c.fill();
    }

    // Puddle ripples on ground
    const count = 2 + Math.floor(mid * 6);
    for (let i = 0; i < count; i++) {
      const seed = (i * 137.5 + t * 0.3) % 1;
      const cx = seed * w;
      const cy = h * 0.82 + Math.sin(i * 3.7) * h * 0.08;
      const age = ((t * 0.8 + i * 1.3) % 2) / 2;
      const radius = age * 18 * vol;
      const alpha = (1 - age) * 0.12 * vol;
      c.beginPath();
      c.ellipse(cx, cy, radius, radius * 0.35, 0, 0, Math.PI * 2);
      c.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
      c.lineWidth = 0.8;
      c.stroke();
    }
  }

  private drawWindGusts(c: CanvasRenderingContext2D, w: number, h: number, r: number, g: number, b: number, vol: number, mid: number): void {
    const t = this.time;
    const count = 2 + Math.floor(mid * 4);
    for (let i = 0; i < count; i++) {
      const yBase = h * (0.15 + (i / count) * 0.7);
      const phase = t * 0.5 + i * 2.1;
      const alpha = 0.03 + mid * 0.08 * vol;
      c.beginPath();
      for (let x = 0; x <= w; x += 4) {
        const y = yBase + Math.sin(x * 0.008 + phase) * (12 + mid * 20) + Math.sin(x * 0.02 + phase * 1.7) * 5;
        if (x === 0) c.moveTo(x, y);
        else c.lineTo(x, y);
      }
      c.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
      c.lineWidth = 1 + mid;
      c.stroke();
    }
  }

  private drawHeatShimmer(c: CanvasRenderingContext2D, w: number, h: number, vol: number, high: number): void {
    const t = this.time;
    // Rising heat distortion lines
    for (let i = 0; i < 4; i++) {
      const x = w * (0.2 + i * 0.2) + Math.sin(t * 0.7 + i * 1.5) * 30;
      const alpha = 0.03 + high * 0.06 * vol;
      c.beginPath();
      for (let y = h; y > h * 0.4; y -= 3) {
        const dx = Math.sin(y * 0.03 + t * 1.5 + i) * (6 + high * 10);
        if (y === h) c.moveTo(x + dx, y);
        else c.lineTo(x + dx, y);
      }
      c.strokeStyle = `rgba(255, 120, 20, ${alpha})`;
      c.lineWidth = 2;
      c.stroke();
    }
    // Ember glow floor
    const grad = c.createLinearGradient(0, h * 0.88, 0, h);
    grad.addColorStop(0, 'transparent');
    grad.addColorStop(1, `rgba(255, 80, 0, ${0.03 + high * 0.08 * vol})`);
    c.fillStyle = grad;
    c.fillRect(0, h * 0.88, w, h * 0.12);
  }

  private drawTumblingLeaves(c: CanvasRenderingContext2D, w: number, h: number, vol: number, mid: number): void {
    const t = this.time;
    const count = 3 + Math.floor(mid * 5);
    for (let i = 0; i < count; i++) {
      const seed = (i * 97.3 + 42) % 100 / 100;
      const x = (seed * w + t * 15 * (0.5 + seed)) % (w + 40) - 20;
      const fallY = ((t * 12 * (0.3 + seed * 0.5) + i * 80) % (h + 40)) - 20;
      const wobble = Math.sin(t * 2 + i * 1.7) * 8;
      const angle = t * (1 + seed) + i;
      const alpha = 0.08 + mid * 0.12 * vol;

      c.save();
      c.translate(x + wobble, fallY);
      c.rotate(angle);
      // Leaf shape: small ellipse
      c.beginPath();
      c.ellipse(0, 0, 4.5, 2, 0, 0, Math.PI * 2);
      const colors = [[190, 150, 60], [170, 120, 40], [200, 170, 50], [160, 100, 30]];
      const [lr, lg, lb] = colors[i % colors.length];
      c.fillStyle = `rgba(${lr}, ${lg}, ${lb}, ${alpha})`;
      c.fill();
      // Stem
      c.beginPath();
      c.moveTo(3, 0);
      c.lineTo(6, -1.5);
      c.strokeStyle = `rgba(${lr - 30}, ${lg - 30}, ${lb - 10}, ${alpha * 0.6})`;
      c.lineWidth = 0.5;
      c.stroke();
      c.restore();
    }
  }

  private drawWaterSurface(c: CanvasRenderingContext2D, w: number, h: number, r: number, g: number, b: number, vol: number, bass: number): void {
    const t = this.time;
    const y = h * 0.55;
    const alpha = 0.04 + bass * 0.1 * vol;
    // Multiple wave layers
    for (let layer = 0; layer < 3; layer++) {
      c.beginPath();
      const freq = 0.01 + layer * 0.005;
      const amp = 4 + bass * 12 + layer * 2;
      const speed = 0.4 + layer * 0.2;
      for (let x2 = 0; x2 <= w; x2 += 3) {
        const wy = y + layer * 6 + Math.sin(x2 * freq + t * speed) * amp + Math.sin(x2 * freq * 2.3 + t * speed * 1.4) * (amp * 0.3);
        if (x2 === 0) c.moveTo(x2, wy);
        else c.lineTo(x2, wy);
      }
      c.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha * (1 - layer * 0.25)})`;
      c.lineWidth = 1.2 - layer * 0.3;
      c.stroke();
    }
  }

  private drawBirdArcs(c: CanvasRenderingContext2D, w: number, h: number, vol: number, high: number): void {
    const t = this.time;

    // Dawn gradient — warm horizon glow
    const dawnAlpha = 0.03 + high * 0.04 * vol;
    const dawnGrad = c.createLinearGradient(0, 0, 0, h);
    dawnGrad.addColorStop(0, `rgba(30, 25, 60, ${dawnAlpha * 0.5})`);       // deep blue sky
    dawnGrad.addColorStop(0.4, `rgba(80, 50, 80, ${dawnAlpha * 0.6})`);     // purple
    dawnGrad.addColorStop(0.65, `rgba(200, 120, 60, ${dawnAlpha})`);        // orange horizon
    dawnGrad.addColorStop(0.8, `rgba(255, 180, 80, ${dawnAlpha * 0.8})`);   // golden
    dawnGrad.addColorStop(1, `rgba(200, 150, 70, ${dawnAlpha * 0.3})`);
    c.fillStyle = dawnGrad;
    c.fillRect(0, 0, w, h);

    // Sun glow near horizon
    const sunX = w * 0.5 + Math.sin(t * 0.05) * w * 0.1;
    const sunY = h * 0.72;
    const sunGrad = c.createRadialGradient(sunX, sunY, 0, sunX, sunY, w * 0.2);
    sunGrad.addColorStop(0, `rgba(255, 220, 120, ${dawnAlpha * 1.5})`);
    sunGrad.addColorStop(0.5, `rgba(255, 160, 60, ${dawnAlpha * 0.5})`);
    sunGrad.addColorStop(1, 'transparent');
    c.fillStyle = sunGrad;
    c.beginPath();
    c.arc(sunX, sunY, w * 0.2, 0, Math.PI * 2);
    c.fill();

    // Birds
    const count = 1 + Math.floor(high * 3);
    for (let i = 0; i < count; i++) {
      const seed = (i * 73.1 + 11) % 100 / 100;
      const cx = (seed * w + t * 25) % (w + 60) - 30;
      const cy = h * (0.1 + seed * 0.3) + Math.sin(t * 1.2 + i * 2) * 15;
      const wingSpan = 8 + high * 6;
      const flap = Math.sin(t * 6 + i * 3) * 0.5;
      const alpha = 0.08 + high * 0.1 * vol;

      c.beginPath();
      c.moveTo(cx, cy);
      c.quadraticCurveTo(cx - wingSpan * 0.5, cy - wingSpan * (0.4 + flap), cx - wingSpan, cy + 2);
      c.moveTo(cx, cy);
      c.quadraticCurveTo(cx + wingSpan * 0.5, cy - wingSpan * (0.4 + flap), cx + wingSpan, cy + 2);
      c.strokeStyle = `rgba(60, 40, 30, ${alpha})`;
      c.lineWidth = 1;
      c.stroke();
    }
  }

  private drawFireflies(c: CanvasRenderingContext2D, w: number, h: number, r: number, g: number, b: number, vol: number, high: number): void {
    const t = this.time;

    // Moon glow — upper area
    const moonX = w * 0.78;
    const moonY = h * 0.15;
    const moonAlpha = 0.04 + high * 0.04 * vol;
    const moonGrad = c.createRadialGradient(moonX, moonY, 4, moonX, moonY, 40);
    moonGrad.addColorStop(0, `rgba(240, 240, 210, ${moonAlpha * 2})`);
    moonGrad.addColorStop(0.15, `rgba(220, 225, 200, ${moonAlpha})`);
    moonGrad.addColorStop(0.5, `rgba(180, 200, 180, ${moonAlpha * 0.3})`);
    moonGrad.addColorStop(1, 'transparent');
    c.fillStyle = moonGrad;
    c.beginPath();
    c.arc(moonX, moonY, 40, 0, Math.PI * 2);
    c.fill();

    // Grass silhouette at bottom
    const grassAlpha = 0.04 + high * 0.03 * vol;
    c.beginPath();
    c.moveTo(0, h);
    for (let x2 = 0; x2 <= w; x2 += 3) {
      const grassH = 6 + Math.sin(x2 * 0.15 + 1) * 3 + Math.sin(x2 * 0.08 + 3) * 4;
      c.lineTo(x2, h - grassH - Math.sin(t * 0.5 + x2 * 0.01) * 1.5);
    }
    c.lineTo(w, h);
    c.closePath();
    c.fillStyle = `rgba(20, 40, 15, ${grassAlpha})`;
    c.fill();

    // Fireflies
    const count = 4 + Math.floor(high * 8);
    for (let i = 0; i < count; i++) {
      const seed = (i * 53.7 + 7) % 100 / 100;
      const seed2 = (i * 31.3 + 19) % 100 / 100;
      const x = seed * w + Math.sin(t * 0.3 + i * 1.7) * 20;
      const y = h * (0.3 + seed2 * 0.6) + Math.cos(t * 0.5 + i * 2.3) * 15;
      const twinkle = Math.sin(t * 3 + i * 4.7);
      if (twinkle < 0) continue;
      const alpha = twinkle * 0.2 * vol;
      const radius = 1.5 + twinkle * 1.5;

      const grad = c.createRadialGradient(x, y, 0, x, y, radius * 3);
      grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${alpha})`);
      grad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
      c.fillStyle = grad;
      c.beginPath();
      c.arc(x, y, radius * 3, 0, Math.PI * 2);
      c.fill();
    }
  }

  private drawSteam(c: CanvasRenderingContext2D, w: number, h: number, vol: number, mid: number): void {
    const t = this.time;

    // Warm window glow — cozy rectangles of light
    const windowAlpha = 0.015 + mid * 0.02 * vol;
    for (let i = 0; i < 3; i++) {
      const wx = w * (0.15 + i * 0.3);
      const wy = h * 0.3;
      const ww = w * 0.08;
      const wh = h * 0.12;
      // Window pane
      const grad = c.createRadialGradient(wx + ww / 2, wy + wh / 2, 0, wx + ww / 2, wy + wh / 2, ww);
      grad.addColorStop(0, `rgba(255, 220, 150, ${windowAlpha * 2})`);
      grad.addColorStop(0.5, `rgba(255, 200, 120, ${windowAlpha})`);
      grad.addColorStop(1, 'transparent');
      c.fillStyle = grad;
      c.fillRect(wx - ww * 0.5, wy - wh * 0.3, ww * 2, wh * 1.6);
      // Window outline
      c.strokeStyle = `rgba(200, 170, 120, ${windowAlpha * 1.5})`;
      c.lineWidth = 0.5;
      c.strokeRect(wx, wy, ww, wh);
      // Cross pane
      c.beginPath();
      c.moveTo(wx + ww / 2, wy);
      c.lineTo(wx + ww / 2, wy + wh);
      c.moveTo(wx, wy + wh / 2);
      c.lineTo(wx + ww, wy + wh / 2);
      c.stroke();
    }

    // Rising steam curls
    const count = 2 + Math.floor(mid * 3);
    for (let i = 0; i < count; i++) {
      const cx = w * (0.3 + i * 0.2) + Math.sin(t * 0.4 + i * 2) * 15;
      const alpha = 0.02 + mid * 0.04 * vol;
      c.beginPath();
      for (let step = 0; step < 20; step++) {
        const progress = step / 20;
        const y = h * 0.85 - progress * h * 0.4;
        const x = cx + Math.sin(progress * 4 + t * 0.8 + i) * (8 + progress * 15);
        if (step === 0) c.moveTo(x, y);
        else c.lineTo(x, y);
      }
      c.strokeStyle = `rgba(220, 200, 170, ${alpha})`;
      c.lineWidth = 2 + mid * 2;
      c.lineCap = 'round';
      c.stroke();
    }
  }

  private drawDustPuffs(c: CanvasRenderingContext2D, w: number, h: number, vol: number, bass: number): void {
    const t = this.time;
    // Dust kicks up with rhythm
    const count = 2 + Math.floor(bass * 4);
    for (let i = 0; i < count; i++) {
      const cx = w * (0.2 + (i / count) * 0.6);
      const age = ((t * 1.5 + i * 1.7) % 1.5) / 1.5;
      const y = h * 0.88 - age * h * 0.08;
      const radius = (2 + age * 10) * vol;
      const alpha = (1 - age) * 0.06 * vol * (0.5 + bass);

      c.beginPath();
      c.arc(cx, y, radius, 0, Math.PI * 2);
      c.fillStyle = `rgba(180, 160, 130, ${alpha})`;
      c.fill();
    }
  }

  private drawLandscapeStreaks(c: CanvasRenderingContext2D, w: number, h: number, r: number, g: number, b: number, vol: number, bass: number): void {
    const t = this.time;
    const alpha = 0.03 + bass * 0.05 * vol;

    // Horizon line
    const horizonY = h * 0.55;
    c.beginPath();
    c.moveTo(0, horizonY);
    c.lineTo(w, horizonY);
    c.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha * 0.5})`;
    c.lineWidth = 0.5;
    c.stroke();

    // Rolling hills silhouette rushing past
    const speed = 20 + bass * 15;
    for (let layer = 0; layer < 2; layer++) {
      const layerSpeed = speed * (0.5 + layer * 0.8);
      const layerAlpha = alpha * (0.5 + layer * 0.3);
      const yBase = horizonY + layer * 8;
      c.beginPath();
      c.moveTo(0, h);
      for (let x2 = 0; x2 <= w; x2 += 4) {
        const offset = t * layerSpeed + layer * 200;
        const hillY = yBase
          + Math.sin((x2 + offset) * 0.008) * 18
          + Math.sin((x2 + offset) * 0.02) * 8
          + Math.sin((x2 + offset) * 0.003) * 25;
        c.lineTo(x2, hillY);
      }
      c.lineTo(w, h);
      c.closePath();
      c.fillStyle = `rgba(${r - 60 + layer * 20}, ${g - 60 + layer * 20}, ${b - 40 + layer * 15}, ${layerAlpha})`;
      c.fill();
    }

    // Telegraph poles rushing by
    const poleSpeed = 80 + bass * 60;
    for (let i = 0; i < 5; i++) {
      const x = ((t * poleSpeed + i * w * 0.25) % (w + 20)) - 10;
      c.beginPath();
      c.moveTo(x, horizonY - 15);
      c.lineTo(x, h * 0.85);
      c.strokeStyle = `rgba(${r - 40}, ${g - 40}, ${b - 40}, ${alpha})`;
      c.lineWidth = 1.2;
      c.stroke();
      // Wire
      c.beginPath();
      c.moveTo(x, horizonY - 10);
      c.lineTo(x + w * 0.25, horizonY - 10 + Math.sin(t + i) * 3);
      c.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha * 0.4})`;
      c.lineWidth = 0.4;
      c.stroke();
    }
  }

  private drawNebula(c: CanvasRenderingContext2D, w: number, h: number, r: number, g: number, b: number, vol: number, bass: number): void {
    const t = this.time;

    // Star field — twinkling background stars
    const starAlpha = 0.06 + bass * 0.08 * vol;
    for (let i = 0; i < 30; i++) {
      const sx = ((i * 73.7 + 11) % 100 / 100) * w;
      const sy = ((i * 41.3 + 29) % 100 / 100) * h;
      const twinkle = 0.3 + Math.sin(t * 1.5 + i * 2.7) * 0.7;
      if (twinkle < 0) continue;
      const sr = 0.5 + twinkle * 0.8;
      c.beginPath();
      c.arc(sx, sy, sr, 0, Math.PI * 2);
      c.fillStyle = `rgba(220, 220, 255, ${starAlpha * twinkle})`;
      c.fill();
    }

    // Nebula clouds
    const count = 3 + Math.floor(bass * 3);
    for (let i = 0; i < count; i++) {
      const seed = (i * 67.3 + 23) % 100 / 100;
      const seed2 = (i * 41.9 + 53) % 100 / 100;
      const cx = w * (0.2 + seed * 0.6) + Math.sin(t * 0.15 + i) * 30;
      const cy = h * (0.2 + seed2 * 0.6) + Math.cos(t * 0.12 + i * 1.3) * 20;
      const radius = 25 + bass * 40;
      const alpha = 0.01 + bass * 0.03 * vol;

      const grad = c.createRadialGradient(cx, cy, 0, cx, cy, radius);
      grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${alpha})`);
      grad.addColorStop(0.6, `rgba(${Math.min(r + 40, 255)}, ${g}, ${Math.min(b + 60, 255)}, ${alpha * 0.3})`);
      grad.addColorStop(1, 'transparent');
      c.fillStyle = grad;
      c.beginPath();
      c.arc(cx, cy, radius, 0, Math.PI * 2);
      c.fill();
    }

    // Slow-rotating galaxy spiral hint
    const spiralAlpha = 0.015 + bass * 0.02 * vol;
    c.save();
    c.translate(w * 0.5, h * 0.5);
    c.rotate(t * 0.02);
    for (let arm = 0; arm < 2; arm++) {
      c.beginPath();
      for (let s = 0; s < 60; s++) {
        const angle = s * 0.15 + arm * Math.PI;
        const dist = s * 1.8;
        const px = Math.cos(angle) * dist;
        const py = Math.sin(angle) * dist * 0.4;
        if (s === 0) c.moveTo(px, py);
        else c.lineTo(px, py);
      }
      c.strokeStyle = `rgba(${r + 30}, ${g + 20}, ${b + 50}, ${spiralAlpha})`;
      c.lineWidth = 2 + bass * 2;
      c.stroke();
    }
    c.restore();
  }

  private drawCaustics(c: CanvasRenderingContext2D, w: number, h: number, r: number, g: number, b: number, vol: number, bass: number): void {
    const t = this.time;
    const alpha = 0.03 + bass * 0.06 * vol;
    // Undulating light patterns
    for (let i = 0; i < 6; i++) {
      const cx = w * ((i + 0.5) / 6) + Math.sin(t * 0.3 + i * 1.1) * 30;
      const cy = h * 0.5 + Math.cos(t * 0.25 + i * 0.9) * h * 0.2;
      const size = 15 + Math.sin(t * 0.7 + i * 2) * 8;

      const grad = c.createRadialGradient(cx, cy, 0, cx, cy, size);
      grad.addColorStop(0, `rgba(${Math.min(r + 50, 255)}, ${Math.min(g + 50, 255)}, ${Math.min(b + 30, 255)}, ${alpha})`);
      grad.addColorStop(1, 'transparent');
      c.fillStyle = grad;
      c.beginPath();
      c.arc(cx, cy, size, 0, Math.PI * 2);
      c.fill();
    }
  }

  private drawVibrationRings(c: CanvasRenderingContext2D, w: number, h: number, r: number, g: number, b: number, vol: number, mid: number): void {
    const t = this.time;
    const cx = w / 2;
    const cy = h / 2;
    const count = 3 + Math.floor(mid * 3);
    for (let i = 0; i < count; i++) {
      const age = ((t * 0.4 + i * 0.8) % 2.5) / 2.5;
      const radius = age * Math.min(w, h) * 0.4;
      const alpha = (1 - age) * 0.08 * vol * (0.5 + mid);

      c.beginPath();
      c.arc(cx, cy, radius, 0, Math.PI * 2);
      c.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
      c.lineWidth = 1 + (1 - age) * 1.5;
      c.stroke();
    }
  }

  private drawGhostlyWisps(c: CanvasRenderingContext2D, w: number, h: number, r: number, g: number, b: number, vol: number, mid: number): void {
    const t = this.time;
    const count = 2 + Math.floor(mid * 3);
    for (let i = 0; i < count; i++) {
      const seed = (i * 83.7 + 13) % 100 / 100;
      const cx = seed * w + Math.sin(t * 0.2 + i * 1.9) * 40;
      const alpha = 0.02 + mid * 0.05 * vol;
      c.beginPath();
      for (let step = 0; step < 25; step++) {
        const progress = step / 25;
        const y = h * 0.9 - progress * h * 0.7;
        const x = cx + Math.sin(progress * 3 + t * 0.5 + i * 2) * (15 + progress * 25);
        if (step === 0) c.moveTo(x, y);
        else c.lineTo(x, y);
      }
      c.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
      c.lineWidth = 3 + mid * 3;
      c.lineCap = 'round';
      c.stroke();
    }
  }

  private drawDissonantLines(c: CanvasRenderingContext2D, w: number, h: number, r: number, g: number, b: number, vol: number, bass: number): void {
    const t = this.time;
    for (let i = 0; i < 5; i++) {
      const y = h * ((i + 0.5) / 5);
      const alpha = 0.02 + bass * 0.06 * vol;
      c.beginPath();
      for (let x2 = 0; x2 <= w; x2 += 3) {
        // Chaotic, dissonant-feeling oscillation
        const dy = Math.sin(x2 * 0.02 + t * 2.3 + i) * (5 + bass * 20) +
                   Math.sin(x2 * 0.037 + t * 3.1 + i * 1.7) * (3 + bass * 12);
        if (x2 === 0) c.moveTo(x2, y + dy);
        else c.lineTo(x2, y + dy);
      }
      c.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
      c.lineWidth = 0.8;
      c.stroke();
    }
  }

  private drawHeartbeatPulse(c: CanvasRenderingContext2D, w: number, h: number, vol: number, bass: number): void {
    const t = this.time;
    const cx = w / 2;
    const cy = h / 2;
    // Beat cycle ~72bpm
    const beat = (t * 1.2) % 1;
    const isBeat = beat < 0.15;
    const pulseSize = isBeat ? (1 - beat / 0.15) : 0;
    const radius = 10 + pulseSize * 60 * vol * (0.5 + bass);
    const alpha = pulseSize * 0.15 * vol;

    if (alpha > 0.005) {
      const grad = c.createRadialGradient(cx, cy, 0, cx, cy, radius);
      grad.addColorStop(0, `rgba(180, 30, 30, ${alpha})`);
      grad.addColorStop(0.5, `rgba(120, 10, 10, ${alpha * 0.4})`);
      grad.addColorStop(1, 'transparent');
      c.fillStyle = grad;
      c.beginPath();
      c.arc(cx, cy, radius, 0, Math.PI * 2);
      c.fill();
    }
  }

  private drawStalactiteDrips(c: CanvasRenderingContext2D, w: number, h: number, r: number, g: number, b: number, vol: number, high: number): void {
    const t = this.time;
    const count = 3 + Math.floor(high * 4);
    for (let i = 0; i < count; i++) {
      const seed = (i * 61.3 + 29) % 100 / 100;
      const cx = w * (0.1 + seed * 0.8);
      // Stalactite
      const stalH = 8 + seed * 12;
      const alpha = 0.04 + high * 0.06 * vol;
      c.beginPath();
      c.moveTo(cx - 3, 0);
      c.lineTo(cx, stalH);
      c.lineTo(cx + 3, 0);
      c.fillStyle = `rgba(${r - 20}, ${g - 20}, ${b - 20}, ${alpha})`;
      c.fill();
      // Drip falling
      const dropCycle = ((t * 0.7 + i * 1.3) % 3) / 3;
      if (dropCycle > 0.3) {
        const dropY = stalH + (dropCycle - 0.3) / 0.7 * (h - stalH);
        const dropAlpha = (1 - (dropCycle - 0.3) / 0.7) * 0.15 * vol;
        c.beginPath();
        c.ellipse(cx, dropY, 1.5, 2.5, 0, 0, Math.PI * 2);
        c.fillStyle = `rgba(${r + 30}, ${g + 30}, ${b + 40}, ${dropAlpha})`;
        c.fill();
        // Splash at bottom
        if (dropCycle > 0.9) {
          const splashAge = (dropCycle - 0.9) / 0.1;
          const splashR = splashAge * 12;
          c.beginPath();
          c.ellipse(cx, h - 5, splashR, splashR * 0.3, 0, 0, Math.PI * 2);
          c.strokeStyle = `rgba(${r + 30}, ${g + 30}, ${b + 40}, ${(1 - splashAge) * 0.1})`;
          c.lineWidth = 0.6;
          c.stroke();
        }
      }
    }
  }

  private drawWarmMotes(c: CanvasRenderingContext2D, w: number, h: number, r: number, g: number, b: number, vol: number, mid: number): void {
    const t = this.time;
    const count = 5 + Math.floor(mid * 6);
    for (let i = 0; i < count; i++) {
      const seed = (i * 47.3 + 17) % 100 / 100;
      const seed2 = (i * 29.7 + 41) % 100 / 100;
      const x = seed * w + Math.sin(t * 0.2 + i * 1.3) * 15;
      const y = seed2 * h + Math.cos(t * 0.15 + i * 0.9) * 10;
      const twinkle = 0.5 + Math.sin(t * 1.5 + i * 3.1) * 0.5;
      const alpha = twinkle * 0.06 * vol * (0.5 + mid);
      const size = 2 + twinkle * 2;

      const grad = c.createRadialGradient(x, y, 0, x, y, size * 2);
      grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${alpha})`);
      grad.addColorStop(1, 'transparent');
      c.fillStyle = grad;
      c.beginPath();
      c.arc(x, y, size * 2, 0, Math.PI * 2);
      c.fill();
    }
  }

  private drawFallingPetals(c: CanvasRenderingContext2D, w: number, h: number, vol: number, mid: number): void {
    const t = this.time;
    const count = 4 + Math.floor(mid * 5);
    const colors: [number, number, number][] = [[240, 180, 200], [255, 200, 210], [220, 160, 180], [250, 190, 195]];
    for (let i = 0; i < count; i++) {
      const seed = (i * 71.9 + 31) % 100 / 100;
      const x = (seed * w + t * 10 * (0.3 + seed * 0.4)) % (w + 30) - 15;
      const fallY = ((t * 8 * (0.2 + seed * 0.3) + i * 60) % (h + 30)) - 15;
      const wobble = Math.sin(t * 1.5 + i * 2.3) * 12;
      const angle = t * 0.8 + i * 1.1;
      const [pr, pg, pb] = colors[i % colors.length];
      const alpha = 0.06 + mid * 0.08 * vol;

      c.save();
      c.translate(x + wobble, fallY);
      c.rotate(angle);
      // Petal: two overlapping ellipses
      c.beginPath();
      c.ellipse(-1.5, 0, 3, 5, 0, 0, Math.PI * 2);
      c.fillStyle = `rgba(${pr}, ${pg}, ${pb}, ${alpha})`;
      c.fill();
      c.beginPath();
      c.ellipse(1.5, 0, 3, 4, 0.3, 0, Math.PI * 2);
      c.fillStyle = `rgba(${pr - 15}, ${pg - 10}, ${pb - 5}, ${alpha * 0.8})`;
      c.fill();
      c.restore();
    }
  }

  private drawWaterReflections(c: CanvasRenderingContext2D, w: number, h: number, r: number, g: number, b: number, vol: number, bass: number): void {
    const t = this.time;
    const waterY = h * 0.55;
    // Shimmering water surface
    for (let i = 0; i < 8; i++) {
      const x = w * (i / 8) + Math.sin(t * 0.3 + i * 0.7) * 10;
      const reflH = 15 + Math.sin(t * 0.5 + i * 1.3) * 8;
      const alpha = 0.02 + bass * 0.04 * vol;

      // Vertical reflection streak
      const grad = c.createLinearGradient(x, waterY, x, waterY + reflH);
      const lr = Math.min(r + 40, 255);
      const lg = Math.min(g + 40, 255);
      const lb = Math.min(b + 30, 255);
      grad.addColorStop(0, `rgba(${lr}, ${lg}, ${lb}, ${alpha})`);
      grad.addColorStop(1, 'transparent');
      c.fillStyle = grad;
      c.fillRect(x - 2, waterY, 4, reflH);
    }
    // Gentle surface waves
    const alpha2 = 0.03 + bass * 0.05 * vol;
    c.beginPath();
    for (let x2 = 0; x2 <= w; x2 += 3) {
      const wy = waterY + Math.sin(x2 * 0.012 + t * 0.6) * 3 + Math.sin(x2 * 0.025 + t * 0.9) * 1.5;
      if (x2 === 0) c.moveTo(x2, wy);
      else c.lineTo(x2, wy);
    }
    c.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha2})`;
    c.lineWidth = 1;
    c.stroke();
  }

  stop(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }
}
