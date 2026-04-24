import type { SoundGenerator, AppState, SoundState } from './types';
import type { SoundRegistry } from './audio/registry';

/**
 * SoundMixer — orchestrates active sound generators and manages application state.
 *
 * Single Responsibility: coordinator between UI actions and audio generators.
 * Does NOT know how any specific sound works — only talks through the SoundGenerator interface.
 */
export class SoundMixer {
  private readonly generators: Map<string, SoundGenerator> = new Map();
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private boundResumeHandler: (() => void) | null = null;
  private readonly _state: AppState;

  constructor(private readonly registry: SoundRegistry) {
    this._state = {
      sounds: {},
      masterVolume: 0.8,
      activePreset: null,
    };

    // Initialize state for all registered sounds
    for (const meta of registry.getAll()) {
      this._state.sounds[meta.id] = {
        id: meta.id,
        active: false,
        volume: 0.3,
      };
    }
  }

  get state(): AppState {
    return this._state;
  }

  private ensureAudioContext(): { ctx: AudioContext; master: GainNode } {
    if (!this.ctx) {
      this.ctx = new AudioContext();

      // DynamicsCompressor acts as a limiter — prevents clipping that crashes audio drivers
      this.compressor = this.ctx.createDynamicsCompressor();
      this.compressor.threshold.value = -6;   // start compressing at -6dB
      this.compressor.knee.value = 6;          // soft knee
      this.compressor.ratio.value = 12;        // heavy compression above threshold
      this.compressor.attack.value = 0.003;    // fast attack
      this.compressor.release.value = 0.25;    // smooth release
      this.compressor.connect(this.ctx.destination);

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this._state.masterVolume;
      this.masterGain.connect(this.compressor);

      // Auto-resume if browser suspends the context
      this.ctx.addEventListener('statechange', () => {
        if (this.ctx?.state === 'suspended') {
          this.ctx.resume().catch(() => {});
        }
      });

      // Resume on any user gesture (handles strict autoplay policies)
      this.boundResumeHandler = () => {
        if (this.ctx?.state === 'suspended') {
          this.ctx.resume().catch(() => {});
        }
      };
      for (const event of ['click', 'touchstart', 'keydown'] as const) {
        document.addEventListener(event, this.boundResumeHandler, { passive: true });
      }
    }
    const master = this.masterGain ?? this.ctx.createGain();
    return { ctx: this.ctx, master };
  }

  async toggleSound(id: string): Promise<void> {
    const soundState = this._state.sounds[id];
    if (!soundState) return;

    if (soundState.active) {
      this.stopSound(id);
    } else {
      await this.startSound(id);
    }
  }

  private async startSound(id: string): Promise<void> {
    const { ctx, master } = this.ensureAudioContext();

    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    let generator = this.generators.get(id);
    if (!generator) {
      generator = this.registry.create(id);
      generator.connect(ctx, master);
      this.generators.set(id, generator);
    }

    const soundState = this._state.sounds[id];
    generator.setVolume(soundState.volume);
    generator.start();
    soundState.active = true;
  }

  private stopSound(id: string): void {
    const generator = this.generators.get(id);
    if (generator) {
      generator.stop();
    }
    const soundState = this._state.sounds[id];
    if (soundState) {
      soundState.active = false;
    }
  }

  setVolume(id: string, volume: number): void {
    const clamped = Math.max(0, Math.min(1, volume));
    const soundState = this._state.sounds[id];
    if (soundState) {
      soundState.volume = clamped;
    }
    const generator = this.generators.get(id);
    if (generator) {
      generator.setVolume(clamped);
    }
  }

  setMasterVolume(volume: number): void {
    this._state.masterVolume = Math.max(0, Math.min(1, volume));
    if (this.masterGain) {
      this.masterGain.gain.value = this._state.masterVolume;
    }
  }

  stopAll(): void {
    for (const [id] of this.generators) {
      this.stopSound(id);
    }
  }

  hasActiveSounds(): boolean {
    return Object.values(this._state.sounds).some((s) => s.active);
  }

  applyPreset(sounds: Record<string, SoundState>): void {
    // Stop all current sounds
    this.stopAll();

    // Apply preset state
    for (const [id, presetState] of Object.entries(sounds)) {
      if (this._state.sounds[id]) {
        this._state.sounds[id].volume = presetState.volume;
        if (presetState.active) {
          this.startSound(id);
        }
      }
    }
  }

  dispose(): void {
    if (this.boundResumeHandler) {
      for (const event of ['click', 'touchstart', 'keydown'] as const) {
        document.removeEventListener(event, this.boundResumeHandler);
      }
      this.boundResumeHandler = null;
    }
    for (const [, generator] of this.generators) {
      generator.dispose();
    }
    this.generators.clear();
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
      this.masterGain = null;
      this.compressor = null;
    }
  }
}
