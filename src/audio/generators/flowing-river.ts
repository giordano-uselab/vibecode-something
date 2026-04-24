import type { SoundCategory } from '../../types';
import { BaseSoundGenerator } from '../base-generator';

/**
 * Flowing River — a gentle brook babbling over pebbles.
 *
 * Technique: High-frequency bandpass layers for splashing and tinkling,
 * fast gurgles, minimal low-end. Light and delicate.
 */
export class FlowingRiverGenerator extends BaseSoundGenerator {
  readonly id = 'flowing-river';
  readonly name = 'Flowing River';
  readonly category: SoundCategory = 'basic';

  private sources: AudioBufferSourceNode[] = [];
  private filters: BiquadFilterNode[] = [];
  private gains: GainNode[] = [];
  private lfos: OscillatorNode[] = [];
  private lfoGains: GainNode[] = [];
  private gurgleInterval: ReturnType<typeof setInterval> | null = null;
  private activeNodes: AudioNode[] = [];

  protected buildAudioGraph(ctx: AudioContext, output: GainNode): void {
    const bufferSize = ctx.sampleRate * 2;

    // Layer 1: Barely-there base — just enough to fill gaps between gurgles
    this.addNoiseLayer(ctx, output, bufferSize, {
      filterType: 'bandpass', freq: 800, q: 0.5, vol: 0.008,
      lfoRate: 0.08 + Math.random() * 0.04, lfoDepth: 150,
    });

    // Layer 2: Hint of babble — very quiet continuous texture
    this.addNoiseLayer(ctx, output, bufferSize, {
      filterType: 'bandpass', freq: 2200, q: 1.0, vol: 0.006,
      lfoRate: 0.2 + Math.random() * 0.1, lfoDepth: 600,
    });

    // Frequent small gurgles — a chatty brook
    this.gurgleInterval = setInterval(() => {
      if (ctx.state !== 'running') return;
      this.playGurgle(ctx, output);
    }, 200 + Math.random() * 400);
  }

  private addNoiseLayer(ctx: AudioContext, output: GainNode, bufferSize: number, opts: {
    filterType: BiquadFilterType; freq: number; q: number; vol: number;
    lfoRate: number; lfoDepth: number;
  }): void {
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = opts.filterType;
    filter.frequency.value = opts.freq;
    filter.Q.value = opts.q;

    const gain = ctx.createGain();
    gain.gain.value = opts.vol;

    source.connect(filter);
    filter.connect(gain);
    gain.connect(output);
    this.startLoopingSource(source);

    this.sources.push(source);
    this.filters.push(filter);
    this.gains.push(gain);

    if (opts.lfoDepth > 0) {
      const lfo = ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = opts.lfoRate;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = opts.lfoDepth;
      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);
      lfo.start();
      this.lfos.push(lfo);
      this.lfoGains.push(lfoGain);
    }
  }

  private playGurgle(ctx: AudioContext, output: GainNode): void {
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.value = 400 + Math.random() * 1200;

    filter.type = 'bandpass';
    filter.frequency.value = 800 + Math.random() * 1500;
    filter.Q.value = 10 + Math.random() * 15;

    const vol = 0.01 + Math.random() * 0.015;
    const dur = 0.03 + Math.random() * 0.06;
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(output);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + dur + 0.02);

    this.activeNodes.push(osc, filter, gain);
    osc.onended = () => {
      osc.disconnect(); filter.disconnect(); gain.disconnect();
      this.activeNodes = this.activeNodes.filter((n) => n !== osc && n !== filter && n !== gain);
    };
  }

  protected teardownAudioGraph(): void {
    if (this.gurgleInterval) { clearInterval(this.gurgleInterval); this.gurgleInterval = null; }
    for (const lfo of this.lfos) { try { lfo.stop(); } catch { /* ok */ } lfo.disconnect(); }
    this.lfos = [];
    for (const g of this.lfoGains) g.disconnect();
    this.lfoGains = [];
    for (const src of this.sources) {
      src.onended = null; try { src.stop(); } catch { /* ok */ } src.disconnect();
    }
    this.sources = [];
    for (const f of this.filters) f.disconnect();
    this.filters = [];
    for (const g of this.gains) g.disconnect();
    this.gains = [];
    for (const node of this.activeNodes) {
      try { (node as OscillatorNode).stop?.(); } catch { /* ok */ }
      node.disconnect();
    }
    this.activeNodes = [];
  }
}
