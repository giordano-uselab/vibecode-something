import type { SoundCategory } from '../../types';
import { BaseSoundGenerator } from '../base-generator';

/**
 * Roman Piazza soundscape — a rich Italian square:
 * - Fountain splash (bandpassed noise)
 * - Crowd chatter (layered pink noise at speech frequencies)
 * - Church bells (harmonic oscillators with long decay)
 * - Horse hooves on cobblestones (rhythmic filtered clicks)
 * - Pigeon coos (modulated sine waves)
 * - Cart/traffic rumble (low-frequency noise)
 * - Merchant calls (occasional mid-range sine bursts)
 */
export class RomanPiazzaGenerator extends BaseSoundGenerator {
  readonly id = 'roman-piazza';
  readonly name = 'Roman Piazza';
  readonly category: SoundCategory = 'soundscape';

  private fountainSource: AudioBufferSourceNode | null = null;
  private fountainFilter: BiquadFilterNode | null = null;
  private fountainGain: GainNode | null = null;
  private chatterSources: AudioBufferSourceNode[] = [];
  private chatterNodes: AudioNode[] = [];
  private cartSource: AudioBufferSourceNode | null = null;
  private cartFilter: BiquadFilterNode | null = null;
  private cartGain: GainNode | null = null;
  private bellInterval: ReturnType<typeof setInterval> | null = null;
  private hoofInterval: ReturnType<typeof setInterval> | null = null;
  private pigeonInterval: ReturnType<typeof setInterval> | null = null;
  private merchantInterval: ReturnType<typeof setInterval> | null = null;
  private activeOscillators: OscillatorNode[] = [];

  protected buildAudioGraph(ctx: AudioContext, output: GainNode): void {
    const bufferSize = ctx.sampleRate * 2;
    const noiseBuffer = this.createNoiseBuffer(ctx, bufferSize);

    // Layer 1: Fountain — bandpassed noise with splash character
    this.fountainSource = ctx.createBufferSource();
    this.fountainSource.buffer = noiseBuffer;
    this.fountainSource.loop = true;

    this.fountainFilter = ctx.createBiquadFilter();
    this.fountainFilter.type = 'bandpass';
    this.fountainFilter.frequency.value = 3500;
    this.fountainFilter.Q.value = 0.4;

    this.fountainGain = ctx.createGain();
    this.fountainGain.gain.value = 0.08;

    this.fountainSource.connect(this.fountainFilter);
    this.fountainFilter.connect(this.fountainGain);
    this.fountainGain.connect(output);
    this.startLoopingSource(this.fountainSource);

    // Layer 2: Rich crowd chatter — multiple pink noise bands
    const chatterBands = [
      { freq: 300, q: 1.5, vol: 0.05 },
      { freq: 700, q: 1.2, vol: 0.04 },
      { freq: 1400, q: 1.0, vol: 0.025 },
    ];

    for (const band of chatterBands) {
      const buf = this.createPinkNoiseBuffer(ctx, bufferSize);
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = band.freq;
      filter.Q.value = band.q;

      const gain = ctx.createGain();
      gain.gain.value = band.vol;

      src.connect(filter);
      filter.connect(gain);
      gain.connect(output);
      this.startLoopingSource(src);

      this.chatterSources.push(src);
      this.chatterNodes.push(filter, gain);
    }

    // Layer 3: Cart / traffic rumble — very low noise
    this.cartSource = ctx.createBufferSource();
    this.cartSource.buffer = noiseBuffer;
    this.cartSource.loop = true;

    this.cartFilter = ctx.createBiquadFilter();
    this.cartFilter.type = 'lowpass';
    this.cartFilter.frequency.value = 100;

    this.cartGain = ctx.createGain();
    this.cartGain.gain.value = 0.04;

    this.cartSource.connect(this.cartFilter);
    this.cartFilter.connect(this.cartGain);
    this.cartGain.connect(output);
    this.startLoopingSource(this.cartSource);

    // Layer 4: Church bells — every 10-20 seconds
    this.bellInterval = setInterval(() => {
      if (ctx.state !== 'running') return;
      this.playBell(ctx, output);
    }, 10000 + Math.random() * 10000);

    // Layer 5: Horse hooves — rhythmic, ongoing
    let hoofBeat = 0;
    const hoofPattern = [1.0, 0.5, 0.8, 0.4];
    this.hoofInterval = setInterval(() => {
      if (ctx.state !== 'running') return;
      this.playHoof(ctx, output, hoofPattern[hoofBeat % 4]);
      hoofBeat++;
    }, 500 + Math.random() * 50);

    // Layer 6: Pigeon coos — occasional
    this.pigeonInterval = setInterval(() => {
      if (ctx.state !== 'running') return;
      if (Math.random() > 0.3) return;
      this.playCoo(ctx, output);
    }, 3000 + Math.random() * 5000);

    // Layer 7: Merchant calls — rare vocal-like bursts
    this.merchantInterval = setInterval(() => {
      if (ctx.state !== 'running') return;
      if (Math.random() > 0.2) return;
      this.playMerchantCall(ctx, output);
    }, 6000 + Math.random() * 8000);
  }

  private playBell(ctx: AudioContext, output: GainNode): void {
    const fundamental = 440 + Math.random() * 200;
    const partials = [1, 2, 3, 4.2, 5.8];
    for (const partial of partials) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = fundamental * partial;
      const volume = 0.025 / partial;
      gain.gain.setValueAtTime(volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 5);
      osc.connect(gain);
      gain.connect(output);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 5.5);
      this.activeOscillators.push(osc);
      osc.onended = () => {
        osc.disconnect(); gain.disconnect();
        this.activeOscillators = this.activeOscillators.filter((o) => o !== osc);
      };
    }
  }

  private playHoof(ctx: AudioContext, output: GainNode, emphasis: number): void {
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.value = 150 + Math.random() * 80;
    filter.type = 'highpass';
    filter.frequency.value = 900;
    filter.Q.value = 2;
    gain.gain.setValueAtTime(0.012 * emphasis, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.04);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(output);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.06);
    this.activeOscillators.push(osc);
    osc.onended = () => {
      osc.disconnect(); filter.disconnect(); gain.disconnect();
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
    gain.gain.setValueAtTime(0.015, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.025, ctx.currentTime + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.6);
    osc.connect(gain);
    gain.connect(output);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.7);
    this.activeOscillators.push(osc);
    osc.onended = () => {
      osc.disconnect(); gain.disconnect();
      this.activeOscillators = this.activeOscillators.filter((o) => o !== osc);
    };
  }

  private playMerchantCall(ctx: AudioContext, output: GainNode): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    const baseFreq = 200 + Math.random() * 150;
    osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(baseFreq * 1.4, ctx.currentTime + 0.2);
    osc.frequency.linearRampToValueAtTime(baseFreq * 1.1, ctx.currentTime + 0.5);
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.015, ctx.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.6);
    osc.connect(gain);
    gain.connect(output);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.7);
    this.activeOscillators.push(osc);
    osc.onended = () => {
      osc.disconnect(); gain.disconnect();
      this.activeOscillators = this.activeOscillators.filter((o) => o !== osc);
    };
  }

  private createNoiseBuffer(ctx: AudioContext, size: number): AudioBuffer {
    const buffer = ctx.createBuffer(1, size, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < size; i++) data[i] = Math.random() * 2 - 1;
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
    for (const interval of [this.bellInterval, this.hoofInterval, this.pigeonInterval, this.merchantInterval]) {
      if (interval) clearInterval(interval);
    }
    this.bellInterval = null;
    this.hoofInterval = null;
    this.pigeonInterval = null;
    this.merchantInterval = null;

    for (const osc of this.activeOscillators) {
      try { osc.stop(); } catch { /* ok */ }
      osc.disconnect();
    }
    this.activeOscillators = [];

    for (const src of [this.fountainSource, this.cartSource, ...this.chatterSources]) {
      if (src) { src.onended = null; try { src.stop(); } catch { /* ok */ } src.disconnect(); }
    }
    this.fountainSource = null;
    this.cartSource = null;
    this.chatterSources = [];

    for (const node of [this.fountainFilter, this.fountainGain, this.cartFilter, this.cartGain, ...this.chatterNodes]) {
      if (node) node.disconnect();
    }
    this.fountainFilter = null;
    this.fountainGain = null;
    this.cartFilter = null;
    this.cartGain = null;
    this.chatterNodes = [];
  }
}
