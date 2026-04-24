import type { SoundCategory } from '../../types';
import { BaseSoundGenerator } from '../base-generator';

/**
 * Ancient Kyoto Temple soundscape:
 * - Temple gong (deep resonating strike)
 * - Bamboo wind (bandpass-swept noise)
 * - Water drip in stone basin
 * - Shakuhachi-like flute
 * - Kendo sword clashes (sharp filtered bursts)
 * - Distant people / monks chanting (low murmur)
 * - Garden crickets
 */
export class AncientKyotoGenerator extends BaseSoundGenerator {
  readonly id = 'ancient-kyoto';
  readonly name = 'Ancient Kyoto';
  readonly category: SoundCategory = 'soundscape';

  private windSource: AudioBufferSourceNode | null = null;
  private windFilter: BiquadFilterNode | null = null;
  private windVolume: GainNode | null = null;
  private windLfo: OscillatorNode | null = null;
  private windLfoGain: GainNode | null = null;
  private murmurSource: AudioBufferSourceNode | null = null;
  private murmurFilter: BiquadFilterNode | null = null;
  private murmurGain: GainNode | null = null;
  private cricketOsc: OscillatorNode | null = null;
  private cricketLfo: OscillatorNode | null = null;
  private cricketNodes: AudioNode[] = [];
  private gongInterval: ReturnType<typeof setInterval> | null = null;
  private dripInterval: ReturnType<typeof setInterval> | null = null;
  private fluteInterval: ReturnType<typeof setInterval> | null = null;
  private swordInterval: ReturnType<typeof setInterval> | null = null;
  private activeOscillators: OscillatorNode[] = [];

  protected buildAudioGraph(ctx: AudioContext, output: GainNode): void {
    const bufferSize = ctx.sampleRate * 2;

    // Layer 1: Bamboo wind
    const noiseBuffer = this.createNoiseBuffer(ctx, bufferSize);
    this.windSource = ctx.createBufferSource();
    this.windSource.buffer = noiseBuffer;
    this.windSource.loop = true;

    this.windFilter = ctx.createBiquadFilter();
    this.windFilter.type = 'bandpass';
    this.windFilter.frequency.value = 800;
    this.windFilter.Q.value = 2;

    this.windLfo = ctx.createOscillator();
    this.windLfo.type = 'sine';
    this.windLfo.frequency.value = 0.08;
    this.windLfoGain = ctx.createGain();
    this.windLfoGain.gain.value = 400;
    this.windLfo.connect(this.windLfoGain);
    this.windLfoGain.connect(this.windFilter.frequency);

    this.windVolume = ctx.createGain();
    this.windVolume.gain.value = 0.06;

    this.windSource.connect(this.windFilter);
    this.windFilter.connect(this.windVolume);
    this.windVolume.connect(output);
    this.startLoopingSource(this.windSource);
    this.windLfo.start();

    // Layer 2: Distant chanting / people murmur
    const murmurBuf = this.createPinkNoiseBuffer(ctx, bufferSize);
    this.murmurSource = ctx.createBufferSource();
    this.murmurSource.buffer = murmurBuf;
    this.murmurSource.loop = true;

    this.murmurFilter = ctx.createBiquadFilter();
    this.murmurFilter.type = 'bandpass';
    this.murmurFilter.frequency.value = 250;
    this.murmurFilter.Q.value = 2;

    this.murmurGain = ctx.createGain();
    this.murmurGain.gain.value = 0.025;

    this.murmurSource.connect(this.murmurFilter);
    this.murmurFilter.connect(this.murmurGain);
    this.murmurGain.connect(output);
    this.startLoopingSource(this.murmurSource);

    // Layer 3: Garden crickets
    this.cricketOsc = ctx.createOscillator();
    this.cricketOsc.type = 'sine';
    this.cricketOsc.frequency.value = 5500;

    this.cricketLfo = ctx.createOscillator();
    this.cricketLfo.type = 'square';
    this.cricketLfo.frequency.value = 12;

    const cricketLfoGain = ctx.createGain();
    cricketLfoGain.gain.value = 1;
    const cricketAmGain = ctx.createGain();
    cricketAmGain.gain.value = 0;
    const cricketOut = ctx.createGain();
    cricketOut.gain.value = 0.006;

    this.cricketLfo.connect(cricketLfoGain);
    cricketLfoGain.connect(cricketAmGain.gain);
    this.cricketOsc.connect(cricketAmGain);
    cricketAmGain.connect(cricketOut);
    cricketOut.connect(output);

    this.cricketOsc.start();
    this.cricketLfo.start();
    this.cricketNodes = [cricketLfoGain, cricketAmGain, cricketOut];

    // Layer 4: Temple gong — every 15-30 seconds
    this.gongInterval = setInterval(() => {
      if (ctx.state !== 'running') return;
      this.playGong(ctx, output);
    }, 15000 + Math.random() * 15000);
    this.playGong(ctx, output); // one immediately

    // Layer 5: Water drip — every 3-8 seconds
    this.dripInterval = setInterval(() => {
      if (ctx.state !== 'running') return;
      this.playDrip(ctx, output);
    }, 3000 + Math.random() * 5000);

    // Layer 6: Distant shakuhachi — every 20-40 seconds
    this.fluteInterval = setInterval(() => {
      if (ctx.state !== 'running') return;
      if (Math.random() > 0.4) return;
      this.playFlute(ctx, output);
    }, 20000 + Math.random() * 20000);

    // Layer 7: Kendo sword clashes — every 5-12 seconds
    this.swordInterval = setInterval(() => {
      if (ctx.state !== 'running') return;
      if (Math.random() > 0.4) return;
      this.playSwordClash(ctx, output);
    }, 5000 + Math.random() * 7000);
  }

  private playGong(ctx: AudioContext, output: GainNode): void {
    const fundamental = 80 + Math.random() * 30;
    const partials = [
      { ratio: 1, amp: 0.05 },
      { ratio: 2.3, amp: 0.03 },
      { ratio: 4.1, amp: 0.015 },
      { ratio: 6.5, amp: 0.008 },
    ];
    const decayTime = 10 + Math.random() * 5;
    for (const partial of partials) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = fundamental * partial.ratio;
      gain.gain.setValueAtTime(partial.amp, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + decayTime);
      osc.connect(gain);
      gain.connect(output);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + decayTime + 1);
      this.activeOscillators.push(osc);
      osc.onended = () => {
        osc.disconnect(); gain.disconnect();
        this.activeOscillators = this.activeOscillators.filter((o) => o !== osc);
      };
    }
  }

  private playDrip(ctx: AudioContext, output: GainNode): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1800 + Math.random() * 600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.15);
    filter.type = 'lowpass';
    filter.frequency.value = 3000;
    gain.gain.setValueAtTime(0.03, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.3);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(output);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.35);
    this.activeOscillators.push(osc);
    osc.onended = () => {
      osc.disconnect(); filter.disconnect(); gain.disconnect();
      this.activeOscillators = this.activeOscillators.filter((o) => o !== osc);
    };
  }

  private playFlute(ctx: AudioContext, output: GainNode): void {
    const osc = ctx.createOscillator();
    const vibrato = ctx.createOscillator();
    const vibratoGain = ctx.createGain();
    const gain = ctx.createGain();
    const baseFreq = 300 + Math.random() * 200;
    osc.type = 'sine';
    osc.frequency.value = baseFreq;
    osc.frequency.linearRampToValueAtTime(baseFreq * 1.1, ctx.currentTime + 2);
    osc.frequency.linearRampToValueAtTime(baseFreq * 0.95, ctx.currentTime + 4);
    vibrato.type = 'sine';
    vibrato.frequency.value = 5;
    vibratoGain.gain.value = 8;
    vibrato.connect(vibratoGain);
    vibratoGain.connect(osc.frequency);
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.012, ctx.currentTime + 1);
    gain.gain.linearRampToValueAtTime(0.016, ctx.currentTime + 2);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 5);
    osc.connect(gain);
    gain.connect(output);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 5.5);
    vibrato.start(ctx.currentTime);
    vibrato.stop(ctx.currentTime + 5.5);
    this.activeOscillators.push(osc, vibrato);
    osc.onended = () => {
      osc.disconnect(); vibrato.disconnect(); vibratoGain.disconnect(); gain.disconnect();
      this.activeOscillators = this.activeOscillators.filter((o) => o !== osc && o !== vibrato);
    };
  }

  private playSwordClash(ctx: AudioContext, output: GainNode): void {
    // Sharp metallic impact: high-frequency noise burst + sine ring
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.value = 3000 + Math.random() * 2000;
    gain.gain.setValueAtTime(0.03, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.08);
    osc.connect(gain);
    gain.connect(output);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.1);
    this.activeOscillators.push(osc);
    osc.onended = () => {
      osc.disconnect(); gain.disconnect();
      this.activeOscillators = this.activeOscillators.filter((o) => o !== osc);
    };

    // Occasional double-strike
    if (Math.random() > 0.5) {
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sawtooth';
      osc2.frequency.value = 2500 + Math.random() * 2000;
      gain2.gain.setValueAtTime(0.02, ctx.currentTime + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.2);
      osc2.connect(gain2);
      gain2.connect(output);
      osc2.start(ctx.currentTime + 0.12);
      osc2.stop(ctx.currentTime + 0.22);
      this.activeOscillators.push(osc2);
      osc2.onended = () => {
        osc2.disconnect(); gain2.disconnect();
        this.activeOscillators = this.activeOscillators.filter((o) => o !== osc2);
      };
    }
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
    for (const interval of [this.gongInterval, this.dripInterval, this.fluteInterval, this.swordInterval]) {
      if (interval) clearInterval(interval);
    }
    this.gongInterval = null;
    this.dripInterval = null;
    this.fluteInterval = null;
    this.swordInterval = null;

    for (const osc of this.activeOscillators) {
      try { osc.stop(); } catch { /* ok */ }
      osc.disconnect();
    }
    this.activeOscillators = [];

    if (this.cricketOsc) { try { this.cricketOsc.stop(); } catch { /* ok */ } this.cricketOsc.disconnect(); this.cricketOsc = null; }
    if (this.cricketLfo) { try { this.cricketLfo.stop(); } catch { /* ok */ } this.cricketLfo.disconnect(); this.cricketLfo = null; }
    for (const n of this.cricketNodes) n.disconnect();
    this.cricketNodes = [];

    if (this.windLfo) { try { this.windLfo.stop(); } catch { /* ok */ } this.windLfo.disconnect(); this.windLfo = null; }
    if (this.windLfoGain) { this.windLfoGain.disconnect(); this.windLfoGain = null; }

    for (const src of [this.windSource, this.murmurSource]) {
      if (src) { src.onended = null; try { src.stop(); } catch { /* ok */ } src.disconnect(); }
    }
    this.windSource = null;
    this.murmurSource = null;

    for (const node of [this.windFilter, this.windVolume, this.murmurFilter, this.murmurGain]) {
      if (node) node.disconnect();
    }
    this.windFilter = null;
    this.windVolume = null;
    this.murmurFilter = null;
    this.murmurGain = null;
  }
}
