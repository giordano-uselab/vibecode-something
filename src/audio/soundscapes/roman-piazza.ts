import type { SoundCategory } from '../../types';
import { BaseSoundGenerator } from '../base-generator';

/**
 * Roman Piazza soundscape — a composite of procedural layers:
 * - Fountain splash (noise bursts + reverb)
 * - Church bells (harmonic oscillators with long decay)
 * - Cobblestone steps (rhythmic filtered clicks)
 * - Pigeon coos (modulated sine waves)
 * - Distant chatter (shaped pink noise)
 *
 * SOLID: Liskov Substitution — this is a SoundGenerator like any other.
 * The mixer doesn't know it's a composite.
 */
export class RomanPiazzaGenerator extends BaseSoundGenerator {
  readonly id = 'roman-piazza';
  readonly name = 'Roman Piazza';
  readonly category: SoundCategory = 'soundscape';

  private fountainSource: AudioBufferSourceNode | null = null;
  private fountainFilter: BiquadFilterNode | null = null;
  private fountainGain: GainNode | null = null;
  private chatterSource: AudioBufferSourceNode | null = null;
  private chatterFilter: BiquadFilterNode | null = null;
  private chatterGain: GainNode | null = null;
  private bellInterval: ReturnType<typeof setInterval> | null = null;
  private stepInterval: ReturnType<typeof setInterval> | null = null;
  private pigeonInterval: ReturnType<typeof setInterval> | null = null;
  private activeOscillators: OscillatorNode[] = [];

  protected buildAudioGraph(ctx: AudioContext, output: GainNode): void {
    const bufferSize = ctx.sampleRate * 2;
    const noiseBuffer = this.createNoiseBuffer(ctx, bufferSize);

    // Layer 1: Fountain — bandpassed noise with higher frequencies for splash
    this.fountainSource = ctx.createBufferSource();
    this.fountainSource.buffer = noiseBuffer;
    this.fountainSource.loop = true;

    this.fountainFilter = ctx.createBiquadFilter();
    this.fountainFilter.type = 'bandpass';
    this.fountainFilter.frequency.value = 4000;
    this.fountainFilter.Q.value = 0.3;

    this.fountainGain = ctx.createGain();
    this.fountainGain.gain.value = 0.12;

    this.fountainSource.connect(this.fountainFilter);
    this.fountainFilter.connect(this.fountainGain);
    this.fountainGain.connect(output);
    this.startLoopingSource(this.fountainSource);

    // Layer 2: Distant chatter — very low, shaped pink noise
    this.chatterSource = ctx.createBufferSource();
    this.chatterSource.buffer = this.createPinkNoiseBuffer(ctx, bufferSize);
    this.chatterSource.loop = true;

    this.chatterFilter = ctx.createBiquadFilter();
    this.chatterFilter.type = 'bandpass';
    this.chatterFilter.frequency.value = 600;
    this.chatterFilter.Q.value = 1;

    this.chatterGain = ctx.createGain();
    this.chatterGain.gain.value = 0.04;

    this.chatterSource.connect(this.chatterFilter);
    this.chatterFilter.connect(this.chatterGain);
    this.chatterGain.connect(output);
    this.startLoopingSource(this.chatterSource);

    // Layer 3: Church bells — every 8-15 seconds
    this.bellInterval = setInterval(() => {
      if (ctx.state !== 'running') return;
      this.playBell(ctx, output);
    }, 8000 + Math.random() * 7000);

    // Layer 4: Cobblestone footsteps — rhythmic clicks
    this.stepInterval = setInterval(() => {
      if (ctx.state !== 'running') return;
      this.playStep(ctx, output);
    }, 600 + Math.random() * 400);

    // Layer 5: Pigeon coos — occasional
    this.pigeonInterval = setInterval(() => {
      if (ctx.state !== 'running') return;
      if (Math.random() > 0.3) return;
      this.playCoo(ctx, output);
    }, 3000 + Math.random() * 5000);
  }

  private playBell(ctx: AudioContext, output: GainNode): void {
    // Church bell = fundamental + partials with long decay
    const fundamental = 440 + Math.random() * 200;
    const partials = [1, 2, 3, 4.2];

    for (const partial of partials) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.value = fundamental * partial;

      const volume = 0.03 / partial;
      gain.gain.setValueAtTime(volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 4);

      osc.connect(gain);
      gain.connect(output);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 4.5);

      this.activeOscillators.push(osc);
      osc.onended = () => {
        osc.disconnect();
        gain.disconnect();
        this.activeOscillators = this.activeOscillators.filter((o) => o !== osc);
      };
    }
  }

  private playStep(ctx: AudioContext, output: GainNode): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'square';
    osc.frequency.value = 100 + Math.random() * 200;

    filter.type = 'highpass';
    filter.frequency.value = 800;

    gain.gain.setValueAtTime(0.015, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.05);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(output);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.06);

    this.activeOscillators.push(osc);
    osc.onended = () => {
      osc.disconnect();
      filter.disconnect();
      gain.disconnect();
      this.activeOscillators = this.activeOscillators.filter((o) => o !== osc);
    };
  }

  private playCoo(ctx: AudioContext, output: GainNode): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(350, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(300, ctx.currentTime + 0.3);
    osc.frequency.linearRampToValueAtTime(350, ctx.currentTime + 0.5);

    gain.gain.setValueAtTime(0.02, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.03, ctx.currentTime + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.6);

    osc.connect(gain);
    gain.connect(output);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.7);

    this.activeOscillators.push(osc);
    osc.onended = () => {
      osc.disconnect();
      gain.disconnect();
      this.activeOscillators = this.activeOscillators.filter((o) => o !== osc);
    };
  }

  private createNoiseBuffer(ctx: AudioContext, size: number): AudioBuffer {
    const buffer = ctx.createBuffer(1, size, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < size; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  private createPinkNoiseBuffer(ctx: AudioContext, size: number): AudioBuffer {
    const buffer = ctx.createBuffer(1, size, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < size; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.969 * b2 + white * 0.153852;
      b3 = 0.8665 * b3 + white * 0.3104856;
      b4 = 0.55 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.016898;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }
    return buffer;
  }

  protected teardownAudioGraph(): void {
    for (const interval of [this.bellInterval, this.stepInterval, this.pigeonInterval]) {
      if (interval) clearInterval(interval);
    }
    this.bellInterval = null;
    this.stepInterval = null;
    this.pigeonInterval = null;

    for (const osc of this.activeOscillators) {
      try { osc.stop(); } catch { /* already stopped */ }
      osc.disconnect();
    }
    this.activeOscillators = [];

    for (const source of [this.fountainSource, this.chatterSource]) {
      if (source) {
        source.onended = null;
        try { source.stop(); } catch { /* already stopped */ }
        source.disconnect();
      }
    }
    this.fountainSource = null;
    this.chatterSource = null;

    for (const node of [this.fountainFilter, this.chatterFilter, this.fountainGain, this.chatterGain]) {
      if (node) node.disconnect();
    }
    this.fountainFilter = null;
    this.chatterFilter = null;
    this.fountainGain = null;
    this.chatterGain = null;
  }
}
