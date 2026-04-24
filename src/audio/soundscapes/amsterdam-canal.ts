import type { SoundCategory } from '../../types';
import { BaseSoundGenerator } from '../base-generator';

/**
 * Amsterdam Canal soundscape:
 * - Water lapping against canal walls (filtered noise with rhythmic modulation)
 * - Light rain (high-passed noise, soft)
 * - Bicycle bells (short high sine pings)
 * - Boat engine (low rumble, intermittent)
 * - Seagulls (swept sine calls)
 * - Tourist chatter (pink noise at speech frequencies)
 * - Church carillon (melodic bell sequence)
 */
export class AmsterdamCanalGenerator extends BaseSoundGenerator {
  readonly id = 'amsterdam-canal';
  readonly name = 'Amsterdam Canal';
  readonly category: SoundCategory = 'soundscape';

  private waterSource: AudioBufferSourceNode | null = null;
  private waterFilter: BiquadFilterNode | null = null;
  private waterGain: GainNode | null = null;
  private waterLfo: OscillatorNode | null = null;
  private waterLfoGain: GainNode | null = null;
  private rainSource: AudioBufferSourceNode | null = null;
  private rainFilter: BiquadFilterNode | null = null;
  private rainGain: GainNode | null = null;
  private chatterSource: AudioBufferSourceNode | null = null;
  private chatterFilter: BiquadFilterNode | null = null;
  private chatterGain: GainNode | null = null;
  private bellInterval: ReturnType<typeof setInterval> | null = null;
  private boatInterval: ReturnType<typeof setInterval> | null = null;
  private seagullInterval: ReturnType<typeof setInterval> | null = null;
  private carillonInterval: ReturnType<typeof setInterval> | null = null;
  private activeNodes: AudioNode[] = [];
  private activeOscillators: OscillatorNode[] = [];

  protected buildAudioGraph(ctx: AudioContext, output: GainNode): void {
    const bufferSize = ctx.sampleRate * 2;
    const noiseBuffer = this.createNoiseBuffer(ctx, bufferSize);

    // Layer 1: Canal water lapping
    this.waterSource = ctx.createBufferSource();
    this.waterSource.buffer = noiseBuffer;
    this.waterSource.loop = true;

    this.waterFilter = ctx.createBiquadFilter();
    this.waterFilter.type = 'bandpass';
    this.waterFilter.frequency.value = 800;
    this.waterFilter.Q.value = 0.5;

    this.waterGain = ctx.createGain();
    this.waterGain.gain.value = 0.06;

    // Slow lapping rhythm
    this.waterLfo = ctx.createOscillator();
    this.waterLfo.type = 'sine';
    this.waterLfo.frequency.value = 0.3;
    this.waterLfoGain = ctx.createGain();
    this.waterLfoGain.gain.value = 0.03;
    this.waterLfo.connect(this.waterLfoGain);
    this.waterLfoGain.connect(this.waterGain.gain);

    this.waterSource.connect(this.waterFilter);
    this.waterFilter.connect(this.waterGain);
    this.waterGain.connect(output);
    this.startLoopingSource(this.waterSource);
    this.waterLfo.start();

    // Layer 2: Light rain
    const rainBuf = this.createNoiseBuffer(ctx, bufferSize);
    this.rainSource = ctx.createBufferSource();
    this.rainSource.buffer = rainBuf;
    this.rainSource.loop = true;

    this.rainFilter = ctx.createBiquadFilter();
    this.rainFilter.type = 'highpass';
    this.rainFilter.frequency.value = 5000;

    this.rainGain = ctx.createGain();
    this.rainGain.gain.value = 0.025;

    this.rainSource.connect(this.rainFilter);
    this.rainFilter.connect(this.rainGain);
    this.rainGain.connect(output);
    this.startLoopingSource(this.rainSource);

    // Layer 3: Tourist chatter
    const chatterBuf = this.createPinkNoiseBuffer(ctx, bufferSize);
    this.chatterSource = ctx.createBufferSource();
    this.chatterSource.buffer = chatterBuf;
    this.chatterSource.loop = true;

    this.chatterFilter = ctx.createBiquadFilter();
    this.chatterFilter.type = 'bandpass';
    this.chatterFilter.frequency.value = 500;
    this.chatterFilter.Q.value = 1.5;

    this.chatterGain = ctx.createGain();
    this.chatterGain.gain.value = 0.03;

    this.chatterSource.connect(this.chatterFilter);
    this.chatterFilter.connect(this.chatterGain);
    this.chatterGain.connect(output);
    this.startLoopingSource(this.chatterSource);

    // Layer 4: Bicycle bells — every 4-10 seconds
    this.bellInterval = setInterval(() => {
      if (ctx.state !== 'running') return;
      if (Math.random() > 0.5) return;
      this.playBicycleBell(ctx, output);
    }, 4000 + Math.random() * 6000);

    // Layer 5: Boat engine — intermittent low rumble, every 15-30 seconds
    this.boatInterval = setInterval(() => {
      if (ctx.state !== 'running') return;
      this.playBoatEngine(ctx, output);
    }, 15000 + Math.random() * 15000);

    // Layer 6: Seagulls — every 6-15 seconds
    this.seagullInterval = setInterval(() => {
      if (ctx.state !== 'running') return;
      if (Math.random() > 0.4) return;
      this.playSeagull(ctx, output);
    }, 6000 + Math.random() * 9000);

    // Layer 7: Church carillon — every 30-60 seconds
    this.carillonInterval = setInterval(() => {
      if (ctx.state !== 'running') return;
      this.playCarillon(ctx, output);
    }, 30000 + Math.random() * 30000);
  }

  private playBicycleBell(ctx: AudioContext, output: GainNode): void {
    const rings = 1 + Math.floor(Math.random() * 2);
    for (let i = 0; i < rings; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 2800 + Math.random() * 400;
      const t = ctx.currentTime + i * 0.15;
      gain.gain.setValueAtTime(0.025, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
      osc.connect(gain);
      gain.connect(output);
      osc.start(t);
      osc.stop(t + 0.35);
      this.activeOscillators.push(osc);
      osc.onended = () => {
        osc.disconnect(); gain.disconnect();
        this.activeOscillators = this.activeOscillators.filter((o) => o !== osc);
      };
    }
  }

  private playBoatEngine(ctx: AudioContext, output: GainNode): void {
    const bufferSize = ctx.sampleRate * 2;
    const buffer = this.createNoiseBuffer(ctx, bufferSize);
    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 80;

    const gain = ctx.createGain();
    const duration = 5 + Math.random() * 5;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 1.5);
    gain.gain.setValueAtTime(0.06, ctx.currentTime + duration - 2);
    gain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + duration);

    source.connect(lowpass);
    lowpass.connect(gain);
    gain.connect(output);
    source.start(ctx.currentTime);
    source.stop(ctx.currentTime + duration + 0.5);

    this.activeNodes.push(source, lowpass, gain);
    source.onended = () => {
      source.disconnect(); lowpass.disconnect(); gain.disconnect();
      this.activeNodes = this.activeNodes.filter((n) => n !== source && n !== lowpass && n !== gain);
    };
  }

  private playSeagull(ctx: AudioContext, output: GainNode): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    const baseFreq = 1500 + Math.random() * 500;
    osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(baseFreq * 1.6, ctx.currentTime + 0.15);
    osc.frequency.linearRampToValueAtTime(baseFreq * 0.8, ctx.currentTime + 0.4);
    osc.frequency.linearRampToValueAtTime(baseFreq * 1.3, ctx.currentTime + 0.6);

    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.02, ctx.currentTime + 0.05);
    gain.gain.setValueAtTime(0.02, ctx.currentTime + 0.5);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.8);

    osc.connect(gain);
    gain.connect(output);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.9);

    this.activeOscillators.push(osc);
    osc.onended = () => {
      osc.disconnect(); gain.disconnect();
      this.activeOscillators = this.activeOscillators.filter((o) => o !== osc);
    };
  }

  private playCarillon(ctx: AudioContext, output: GainNode): void {
    // Short melodic sequence of bell tones
    const scale = [523, 587, 659, 698, 784, 880]; // C5-A5
    const noteCount = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < noteCount; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = scale[Math.floor(Math.random() * scale.length)];
      const t = ctx.currentTime + i * 0.4;
      gain.gain.setValueAtTime(0.02, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 2);
      osc.connect(gain);
      gain.connect(output);
      osc.start(t);
      osc.stop(t + 2.5);
      this.activeOscillators.push(osc);
      osc.onended = () => {
        osc.disconnect(); gain.disconnect();
        this.activeOscillators = this.activeOscillators.filter((o) => o !== osc);
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
    for (const interval of [this.bellInterval, this.boatInterval, this.seagullInterval, this.carillonInterval]) {
      if (interval) clearInterval(interval);
    }
    this.bellInterval = null;
    this.boatInterval = null;
    this.seagullInterval = null;
    this.carillonInterval = null;

    for (const osc of this.activeOscillators) {
      try { osc.stop(); } catch { /* ok */ }
      osc.disconnect();
    }
    this.activeOscillators = [];

    for (const node of this.activeNodes) {
      try { (node as AudioBufferSourceNode).stop?.(); } catch { /* ok */ }
      node.disconnect();
    }
    this.activeNodes = [];

    if (this.waterLfo) { try { this.waterLfo.stop(); } catch { /* ok */ } this.waterLfo.disconnect(); this.waterLfo = null; }
    if (this.waterLfoGain) { this.waterLfoGain.disconnect(); this.waterLfoGain = null; }

    for (const src of [this.waterSource, this.rainSource, this.chatterSource]) {
      if (src) { src.onended = null; try { src.stop(); } catch { /* ok */ } src.disconnect(); }
    }
    this.waterSource = null;
    this.rainSource = null;
    this.chatterSource = null;

    for (const node of [this.waterFilter, this.waterGain, this.rainFilter, this.rainGain, this.chatterFilter, this.chatterGain]) {
      if (node) node.disconnect();
    }
    this.waterFilter = null;
    this.waterGain = null;
    this.rainFilter = null;
    this.rainGain = null;
    this.chatterFilter = null;
    this.chatterGain = null;
  }
}
