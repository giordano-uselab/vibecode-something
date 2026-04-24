import type { SoundCategory } from '../../types';
import { BaseSoundGenerator } from '../base-generator';

/**
 * Flowing River — water rushing over rocks with gurgling detail.
 *
 * Technique: Multiple bandpass layers at water frequencies with
 * different modulation rates for varied current + resonant "gurgle"
 * peaks with random modulation for natural water character.
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

    // Layer 1: Deep current — low rumble
    this.addNoiseLayer(ctx, output, bufferSize, {
      filterType: 'lowpass', freq: 250, q: 0.4, vol: 0.10,
      lfoRate: 0.04 + Math.random() * 0.02, lfoDepth: 80,
    });

    // Layer 2: Mid flow — the main "rush" of water
    this.addNoiseLayer(ctx, output, bufferSize, {
      filterType: 'bandpass', freq: 900, q: 0.6, vol: 0.08,
      lfoRate: 0.09 + Math.random() * 0.04, lfoDepth: 300,
    });

    // Layer 3: High splash — babbling/splashing texture
    this.addNoiseLayer(ctx, output, bufferSize, {
      filterType: 'bandpass', freq: 3500, q: 1.2, vol: 0.03,
      lfoRate: 0.25 + Math.random() * 0.1, lfoDepth: 800,
    });

    // Layer 4: Very high tinkle — water sparkle
    this.addNoiseLayer(ctx, output, bufferSize, {
      filterType: 'highpass', freq: 6000, q: 0.3, vol: 0.012,
      lfoRate: 0.4 + Math.random() * 0.2, lfoDepth: 0,
    });

    // Periodic gurgle bursts — resonant water sounds
    this.gurgleInterval = setInterval(() => {
      if (ctx.state !== 'running') return;
      this.playGurgle(ctx, output);
    }, 400 + Math.random() * 800);
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
    osc.frequency.value = 200 + Math.random() * 600;

    filter.type = 'bandpass';
    filter.frequency.value = 400 + Math.random() * 800;
    filter.Q.value = 8 + Math.random() * 12;

    const vol = 0.008 + Math.random() * 0.012;
    const dur = 0.04 + Math.random() * 0.08;
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
