import type { SoundCategory } from '../../types';
import { BaseSoundGenerator } from '../base-generator';

/**
 * Brown noise generator.
 *
 * Technique: White noise → steep lowpass filter at ~200Hz.
 * Brown noise (Brownian/red noise) emphasizes low frequencies —
 * popular for ADHD focus and deep concentration.
 */
export class BrownNoiseGenerator extends BaseSoundGenerator {
  readonly id = 'brown-noise';
  readonly name = 'Brown Noise';
  readonly category: SoundCategory = 'basic';

  private source: AudioBufferSourceNode | null = null;
  private filter: BiquadFilterNode | null = null;

  protected buildAudioGraph(ctx: AudioContext, output: GainNode): void {
    // Generate brown noise using random walk
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      // Brown noise algorithm: integrate white noise with leaky integrator
      lastOut = (lastOut + 0.02 * white) / 1.02;
      data[i] = lastOut * 3.5;
    }

    this.source = ctx.createBufferSource();
    this.source.buffer = buffer;
    this.source.loop = true;

    // Additional lowpass for warmth
    this.filter = ctx.createBiquadFilter();
    this.filter.type = 'lowpass';
    this.filter.frequency.value = 250;

    this.source.connect(this.filter);
    this.filter.connect(output);
    this.source.start();
  }

  protected teardownAudioGraph(): void {
    if (this.source) {
      try { this.source.stop(); } catch { /* already stopped */ }
      this.source.disconnect();
      this.source = null;
    }
    if (this.filter) {
      this.filter.disconnect();
      this.filter = null;
    }
  }
}
