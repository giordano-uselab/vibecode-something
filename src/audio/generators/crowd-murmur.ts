import type { SoundCategory } from '../../types';
import { BaseSoundGenerator } from '../base-generator';

/**
 * Crowd Murmur — distant people talking, indistinct.
 *
 * Technique: Multiple bandpass-filtered pink noise layers at speech
 * frequencies with slow random modulation.
 */
export class CrowdMurmurGenerator extends BaseSoundGenerator {
  readonly id = 'crowd-murmur';
  readonly name = 'Crowd Murmur';
  readonly category: SoundCategory = 'basic';

  private sources: AudioBufferSourceNode[] = [];
  private filters: BiquadFilterNode[] = [];
  private gains: GainNode[] = [];

  protected buildAudioGraph(ctx: AudioContext, output: GainNode): void {
    const bufferSize = ctx.sampleRate * 2;

    // Create multiple murmur layers at different speech-band frequencies
    const bands = [
      { freq: 300, q: 1.5, vol: 0.06 },
      { freq: 600, q: 1.2, vol: 0.05 },
      { freq: 1200, q: 1.0, vol: 0.03 },
    ];

    for (const band of bands) {
      const buffer = this.createPinkNoiseBuffer(ctx, bufferSize);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = band.freq;
      filter.Q.value = band.q;

      const gain = ctx.createGain();
      gain.gain.value = band.vol;

      source.connect(filter);
      filter.connect(gain);
      gain.connect(output);
      this.startLoopingSource(source);

      this.sources.push(source);
      this.filters.push(filter);
      this.gains.push(gain);
    }
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
  }
}
