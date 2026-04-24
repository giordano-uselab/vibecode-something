import type { SoundCategory } from '../../types';
import { BaseSoundGenerator } from '../base-generator';

/**
 * White noise generator.
 *
 * Technique: Linear-feedback white noise buffer, direct to output.
 * The purest form of broadband noise — all frequencies at equal intensity.
 */
export class WhiteNoiseGenerator extends BaseSoundGenerator {
  readonly id = 'white-noise';
  readonly name = 'White Noise';
  readonly category: SoundCategory = 'basic';

  private source: AudioBufferSourceNode | null = null;

  protected buildAudioGraph(ctx: AudioContext, output: GainNode): void {
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    this.source = ctx.createBufferSource();
    this.source.buffer = buffer;
    this.source.loop = true;
    this.source.connect(output);
    this.startLoopingSource(this.source);
  }

  protected teardownAudioGraph(): void {
    if (this.source) {
      this.source.onended = null;
      try { this.source.stop(); } catch { /* already stopped */ }
      this.source.disconnect();
      this.source = null;
    }
  }
}
