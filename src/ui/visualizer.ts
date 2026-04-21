import type { SoundMixer } from '../mixer';

/**
 * Canvas visualizer — renders animated visuals that react to active sounds.
 * Each active sound contributes a unique visual layer to the canvas.
 */
export class Visualizer {
  private canvas: HTMLCanvasElement | null = null;
  private canvasCtx: CanvasRenderingContext2D | null = null;
  private animationId: number | null = null;
  private particles: Particle[] = [];

  constructor(private readonly mixer: SoundMixer) {}

  start(): void {
    this.canvas = document.getElementById('visualizer') as HTMLCanvasElement;
    if (!this.canvas) return;

    this.canvasCtx = this.canvas.getContext('2d');
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
    this.animate();
  }

  private resizeCanvas(): void {
    if (!this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width * window.devicePixelRatio;
    this.canvas.height = rect.height * window.devicePixelRatio;
    this.canvasCtx?.scale(window.devicePixelRatio, window.devicePixelRatio);
  }

  private readonly animate = (): void => {
    if (!this.canvasCtx || !this.canvas) return;

    const w = this.canvas.width / window.devicePixelRatio;
    const h = this.canvas.height / window.devicePixelRatio;
    const ctx = this.canvasCtx;

    // Clear with fade trail
    ctx.fillStyle = 'rgba(10, 10, 15, 0.15)';
    ctx.fillRect(0, 0, w, h);

    const state = this.mixer.state;
    const activeSounds = Object.values(state.sounds).filter((s) => s.active);

    if (activeSounds.length === 0) {
      // Idle animation — subtle breathing dots
      const time = Date.now() / 3000;
      for (let i = 0; i < 3; i++) {
        const x = w * (0.3 + i * 0.2);
        const y = h / 2 + Math.sin(time + i) * 8;
        const alpha = 0.1 + Math.sin(time + i * 0.5) * 0.05;
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(99, 102, 241, ${alpha})`;
        ctx.fill();
      }
    } else {
      // Spawn particles based on active sounds
      for (const sound of activeSounds) {
        if (Math.random() < sound.volume * 0.3) {
          this.particles.push(this.createParticle(sound.id, w, h, sound.volume));
        }
      }
    }

    // Update and draw particles
    this.particles = this.particles.filter((p) => {
      p.life -= p.decay;
      if (p.life <= 0) return false;

      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;

      const alpha = p.life * p.volume;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${p.r}, ${p.g}, ${p.b}, ${alpha})`;
      ctx.fill();
      return true;
    });

    // Keep particle count reasonable
    if (this.particles.length > 200) {
      this.particles = this.particles.slice(-200);
    }

    this.animationId = requestAnimationFrame(this.animate);
  };

  private getParticleY(soundId: string, h: number): number {
    if (soundId === 'fire') return h;
    if (soundId === 'rain') return 0;
    return Math.random() * h;
  }

  private createParticle(soundId: string, w: number, h: number, volume: number): Particle {
    const colors: Record<string, [number, number, number]> = {
      'rain': [100, 149, 237],
      'wind': [180, 200, 220],
      'fire': [255, 120, 50],
      'coffee-shop': [210, 180, 140],
      'white-noise': [200, 200, 210],
      'brown-noise': [160, 120, 80],
    };

    const [r, g, b] = colors[soundId] ?? [99, 102, 241];

    const baseConfig: Record<string, Partial<Particle>> = {
      'rain': { vy: 1.5 + Math.random(), vx: -0.2, size: 1.5, gravity: 0.02 },
      'wind': { vx: 1 + Math.random() * 2, vy: Math.sin(Date.now() / 500) * 0.3, size: 2, gravity: 0 },
      'fire': { vy: -1 - Math.random(), vx: (Math.random() - 0.5) * 0.5, size: 3, gravity: -0.01 },
      'coffee-shop': { vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3, size: 2, gravity: 0 },
      'white-noise': { vx: (Math.random() - 0.5) * 2, vy: (Math.random() - 0.5) * 2, size: 1, gravity: 0 },
      'brown-noise': { vx: (Math.random() - 0.5) * 0.5, vy: 0.3 + Math.random() * 0.5, size: 3.5, gravity: 0.005 },
    };

    const config = baseConfig[soundId] ?? {};

    return {
      x: Math.random() * w,
      y: this.getParticleY(soundId, h),
      vx: config.vx ?? 0,
      vy: config.vy ?? 0,
      size: config.size ?? 2,
      life: 1,
      decay: 0.008 + Math.random() * 0.008,
      gravity: config.gravity ?? 0,
      r, g, b,
      volume,
    };
  }

  stop(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }
}

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
}
