import type { SoundCategory } from '../../types';
import { BaseSoundGenerator } from '../base-generator';

/**
 * Rain sound generator.
 *
 * Technique: White noise buffer → bandpass filter (1kHz–5kHz)
 * with randomized gain impulses simulating individual raindrops.
 */
export class SteadyRainGenerator extends BaseSoundGenerator {
  readonly id = 'steady-rain';
  readonly name = 'Steady Rain';
  readonly category: SoundCategory = 'basic';

  private noiseSource: AudioBufferSourceNode | null = null;
  private filter: BiquadFilterNode | null = null;
  private dropInterval: ReturnType<typeof setInterval> | null = null;
  private dropGain: GainNode | null = null;

  protected buildAudioGraph(ctx: AudioContext, output: GainNode): void {
    // Create white noise buffer
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    // Noise source
    this.noiseSource = ctx.createBufferSource();
    this.noiseSource.buffer = buffer;
    this.noiseSource.loop = true;

    // Bandpass filter for rain character
    this.filter = ctx.createBiquadFilter();
    this.filter.type = 'bandpass';
    this.filter.frequency.value = 3000;
    this.filter.Q.value = 0.5;

    // Drop simulation gain node
    this.dropGain = ctx.createGain();
    this.dropGain.gain.value = 0.15;

    // Connect: noise → filter → dropGain → output
    this.noiseSource.connect(this.filter);
    this.filter.connect(this.dropGain);
    this.dropGain.connect(output);

    this.startLoopingSource(this.noiseSource);

    // Simulate random raindrop intensity variations
    this.dropInterval = setInterval(() => {
      if (this.dropGain && ctx.state === 'running') {
        const intensity = 0.1 + Math.random() * 0.15;
        this.dropGain.gain.setValueAtTime(intensity, ctx.currentTime);
        this.dropGain.gain.linearRampToValueAtTime(
          0.15,
          ctx.currentTime + 0.1 + Math.random() * 0.2,
        );
      }
    }, 100 + Math.random() * 200);
  }

  protected teardownAudioGraph(): void {
    if (this.dropInterval) {
      clearInterval(this.dropInterval);
      this.dropInterval = null;
    }
    if (this.noiseSource) {
      this.noiseSource.onended = null;
      try { this.noiseSource.stop(); } catch { /* already stopped */ }
      this.noiseSource.disconnect();
      this.noiseSource = null;
    }
    if (this.filter) {
      this.filter.disconnect();
      this.filter = null;
    }
    if (this.dropGain) {
      this.dropGain.disconnect();
      this.dropGain = null;
    }
  }
}
