import type { SoundCategory } from '../../types';
import { BaseSoundGenerator } from '../base-generator';

/**
 * Crowd Murmur — hushed indoor crowd, whispers and murmurs.
 *
 * Technique: Multiple formant-shaped bandpass layers for vocal quality +
 * slow random modulation for breathing/speaking rhythm + occasional
 * cough (noise burst with specific envelope).
 */
export class CrowdMurmurGenerator extends BaseSoundGenerator {
  readonly id = 'crowd-murmur';
  readonly name = 'Crowd Murmur';
  readonly category: SoundCategory = 'basic';

  private sources: AudioBufferSourceNode[] = [];
  private filters: BiquadFilterNode[] = [];
  private gains: GainNode[] = [];
  private lfos: OscillatorNode[] = [];
  private lfoGains: GainNode[] = [];
  private coughTimeout: ReturnType<typeof setTimeout> | null = null;
  private activeNodes: AudioNode[] = [];
  private stopped = false;

  protected buildAudioGraph(ctx: AudioContext, output: GainNode): void {
    const bufferSize = ctx.sampleRate * 2;

    // Formant-like layers for vocal quality (whisper band)
    const formants = [
      { freq: 350, q: 3.0, vol: 0.04, lfoRate: 0.12 + Math.random() * 0.06 },   // vowel A
      { freq: 700, q: 2.5, vol: 0.035, lfoRate: 0.08 + Math.random() * 0.05 },   // vowel E
      { freq: 1200, q: 2.0, vol: 0.02, lfoRate: 0.15 + Math.random() * 0.08 },   // vowel I
      { freq: 2500, q: 1.5, vol: 0.012, lfoRate: 0.10 + Math.random() * 0.07 },   // sibilance
    ];

    for (const f of formants) {
      const buffer = this.createPinkNoiseBuffer(ctx, bufferSize);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = f.freq;
      filter.Q.value = f.q;

      const gain = ctx.createGain();
      gain.gain.value = f.vol;

      // LFO on gain for "talking rhythm" — voices rising and falling
      const lfo = ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = f.lfoRate;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = f.vol * 0.6;
      lfo.connect(lfoGain);
      lfoGain.connect(gain.gain);

      source.connect(filter);
      filter.connect(gain);
      gain.connect(output);
      this.startLoopingSource(source);
      lfo.start();

      this.sources.push(source);
      this.filters.push(filter);
      this.gains.push(gain);
      this.lfos.push(lfo);
      this.lfoGains.push(lfoGain);
    }

    // Occasional cough
    this.stopped = false;
    this.scheduleCough(ctx, output);
  }

  private scheduleCough(ctx: AudioContext, output: GainNode): void {
    if (this.stopped) return;
    const delay = 8000 + Math.random() * 15000;
    this.coughTimeout = setTimeout(() => {
      if (this.stopped || ctx.state !== 'running') return;
      this.playCough(ctx, output);
      this.scheduleCough(ctx, output);
    }, delay);
  }

  private playCough(ctx: AudioContext, output: GainNode): void {
    const now = ctx.currentTime;
    const coughLen = Math.floor(ctx.sampleRate * 0.25);
    const coughBuf = ctx.createBuffer(1, coughLen, ctx.sampleRate);
    const coughData = coughBuf.getChannelData(0);
    for (let i = 0; i < coughLen; i++) {
      coughData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (coughLen * 0.1));
    }

    const source = ctx.createBufferSource();
    source.buffer = coughBuf;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 600 + Math.random() * 400;
    filter.Q.value = 1.5;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.02 + Math.random() * 0.01, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15 + Math.random() * 0.1);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(output);
    source.start(now);
    source.stop(now + 0.3);

    this.activeNodes.push(source, filter, gain);
    source.onended = () => {
      source.disconnect(); filter.disconnect(); gain.disconnect();
      this.activeNodes = this.activeNodes.filter((n) => n !== source && n !== filter && n !== gain);
    };
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
    this.stopped = true;
    if (this.coughTimeout) { clearTimeout(this.coughTimeout); this.coughTimeout = null; }
    for (const lfo of this.lfos) { try { lfo.stop(); } catch { /* ok */ } lfo.disconnect(); }
    this.lfos = [];
    for (const g of this.lfoGains) g.disconnect();
    this.lfoGains = [];
    for (const src of this.sources) {
      src.onended = null;
      try { src.stop(); } catch { /* ok */ }
      src.disconnect();
    }
    this.sources = [];
    for (const f of this.filters) f.disconnect();
    this.filters = [];
    for (const g of this.gains) g.disconnect();
    this.gains = [];
    for (const node of this.activeNodes) {
      try { (node as AudioBufferSourceNode).stop?.(); } catch { /* ok */ }
      node.disconnect();
    }
    this.activeNodes = [];
  }
}
