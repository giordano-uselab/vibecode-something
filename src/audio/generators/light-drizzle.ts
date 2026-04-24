import type { SoundCategory } from '../../types';
import { BaseSoundGenerator } from '../base-generator';

/**
 * Light Drizzle — soft, sparse drops on a window.
 *
 * Technique: High-passed noise at very low volume + occasional
 * tiny sine plinks for individual droplets on glass.
 */
export class LightDrizzleGenerator extends BaseSoundGenerator {
  readonly id = 'light-drizzle';
  readonly name = 'Light Drizzle';
  readonly category: SoundCategory = 'basic';

  private noiseSource: AudioBufferSourceNode | null = null;
  private highpass: BiquadFilterNode | null = null;
  private noiseGain: GainNode | null = null;
  private dropInterval: ReturnType<typeof setInterval> | null = null;
  private activeOscillators: OscillatorNode[] = [];

  protected buildAudioGraph(ctx: AudioContext, output: GainNode): void {
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    // Very soft background hiss
    this.noiseSource = ctx.createBufferSource();
    this.noiseSource.buffer = buffer;
    this.noiseSource.loop = true;

    this.highpass = ctx.createBiquadFilter();
    this.highpass.type = 'highpass';
    this.highpass.frequency.value = 6000;
    this.highpass.Q.value = 0.3;

    this.noiseGain = ctx.createGain();
    this.noiseGain.gain.value = 0.03;

    this.noiseSource.connect(this.highpass);
    this.highpass.connect(this.noiseGain);
    this.noiseGain.connect(output);
    this.startLoopingSource(this.noiseSource);

    // Individual droplet plinks
    this.dropInterval = setInterval(() => {
      if (ctx.state !== 'running') return;
      if (Math.random() > 0.4) return; // sparse

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 3000 + Math.random() * 4000;
      gain.gain.setValueAtTime(0.008 + Math.random() * 0.01, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.04);

      osc.connect(gain);
      gain.connect(output);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.05);

      this.activeOscillators.push(osc);
      osc.onended = () => {
        osc.disconnect();
        gain.disconnect();
        this.activeOscillators = this.activeOscillators.filter((o) => o !== osc);
      };
    }, 150 + Math.random() * 300);
  }

  protected teardownAudioGraph(): void {
    if (this.dropInterval) {
      clearInterval(this.dropInterval);
      this.dropInterval = null;
    }
    for (const osc of this.activeOscillators) {
      try { osc.stop(); } catch { /* already stopped */ }
      osc.disconnect();
    }
    this.activeOscillators = [];
    if (this.noiseSource) {
      this.noiseSource.onended = null;
      try { this.noiseSource.stop(); } catch { /* already stopped */ }
      this.noiseSource.disconnect();
      this.noiseSource = null;
    }
    if (this.highpass) { this.highpass.disconnect(); this.highpass = null; }
    if (this.noiseGain) { this.noiseGain.disconnect(); this.noiseGain = null; }
  }
}
