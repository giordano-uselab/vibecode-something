import type { SoundCategory } from '../../types';
import { BaseSoundGenerator } from '../base-generator';

/**
 * Rustling Leaves — dry leaves shifting on the ground.
 *
 * Technique: High-frequency filtered noise with random gain modulation
 * to create papery, crispy texture.
 */
export class RustlingLeavesGenerator extends BaseSoundGenerator {
  readonly id = 'rustling-leaves';
  readonly name = 'Rustling Leaves';
  readonly category: SoundCategory = 'basic';

  private noiseSource: AudioBufferSourceNode | null = null;
  private bandpass: BiquadFilterNode | null = null;
  private mainGain: GainNode | null = null;
  private rustleInterval: ReturnType<typeof setInterval> | null = null;

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

    this.bandpass = ctx.createBiquadFilter();
    this.bandpass.type = 'bandpass';
    this.bandpass.frequency.value = 5000;
    this.bandpass.Q.value = 0.6;

    this.mainGain = ctx.createGain();
    this.mainGain.gain.value = 0.04;

    this.noiseSource.connect(this.bandpass);
    this.bandpass.connect(this.mainGain);
    this.mainGain.connect(output);
    this.startLoopingSource(this.noiseSource);

    // Random rustle bursts — papery gusts
    this.rustleInterval = setInterval(() => {
      if (!this.mainGain || ctx.state !== 'running') return;
      const intensity = 0.06 + Math.random() * 0.06;
      const duration = 0.2 + Math.random() * 0.4;
      this.mainGain.gain.setValueAtTime(this.mainGain.gain.value, ctx.currentTime);
      this.mainGain.gain.linearRampToValueAtTime(intensity, ctx.currentTime + 0.05);
      this.mainGain.gain.linearRampToValueAtTime(0.04, ctx.currentTime + duration);
    }, 300 + Math.random() * 600);
  }

  protected teardownAudioGraph(): void {
    if (this.rustleInterval) { clearInterval(this.rustleInterval); this.rustleInterval = null; }
    if (this.noiseSource) {
      this.noiseSource.onended = null;
      try { this.noiseSource.stop(); } catch { /* ok */ }
      this.noiseSource.disconnect();
      this.noiseSource = null;
    }
    if (this.bandpass) { this.bandpass.disconnect(); this.bandpass = null; }
    if (this.mainGain) { this.mainGain.disconnect(); this.mainGain = null; }
  }
}
