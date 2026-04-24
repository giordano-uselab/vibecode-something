import type { SoundCategory } from '../../types';
import { BaseSoundGenerator } from '../base-generator';

/**
 * Gentle Breeze — soft, delicate wind.
 *
 * Technique: Lowpass-filtered noise with very gentle LFO sweep.
 * Kept quiet and airy — no howling.
 */
export class GentleBreezeGenerator extends BaseSoundGenerator {
  readonly id = 'gentle-breeze';
  readonly name = 'Gentle Breeze';
  readonly category: SoundCategory = 'basic';

  private noiseSource: AudioBufferSourceNode | null = null;
  private filter: BiquadFilterNode | null = null;
  private lfo: OscillatorNode | null = null;
  private lfoGain: GainNode | null = null;
  private outputGain: GainNode | null = null;

  protected buildAudioGraph(ctx: AudioContext, output: GainNode): void {
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    this.noiseSource = ctx.createBufferSource();
    this.noiseSource.buffer = buffer;
    this.noiseSource.loop = true;

    // Gentle lowpass — low cutoff, low Q for smooth rolloff
    this.filter = ctx.createBiquadFilter();
    this.filter.type = 'lowpass';
    this.filter.frequency.value = 500;
    this.filter.Q.value = 0.3;

    // Very slow, subtle LFO — light breathing, not howling
    this.lfo = ctx.createOscillator();
    this.lfo.type = 'sine';
    this.lfo.frequency.value = 0.07 + Math.random() * 0.04;

    this.lfoGain = ctx.createGain();
    this.lfoGain.gain.value = 150; // gentle sweep range

    this.lfo.connect(this.lfoGain);
    this.lfoGain.connect(this.filter.frequency);

    // Lower output volume for delicacy
    this.outputGain = ctx.createGain();
    this.outputGain.gain.value = 0.4;

    this.noiseSource.connect(this.filter);
    this.filter.connect(this.outputGain);
    this.outputGain.connect(output);

    this.startLoopingSource(this.noiseSource);
    this.lfo.start();
  }

  protected teardownAudioGraph(): void {
    if (this.lfo) {
      try { this.lfo.stop(); } catch { /* already stopped */ }
      this.lfo.disconnect();
      this.lfo = null;
    }
    if (this.lfoGain) {
      this.lfoGain.disconnect();
      this.lfoGain = null;
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
    if (this.outputGain) {
      this.outputGain.disconnect();
      this.outputGain = null;
    }
  }
}
