import type { SoundCategory } from '../../types';
import { BaseSoundGenerator } from '../base-generator';

/**
 * Coffee shop ambient sound generator.
 *
 * Technique: Pink noise (low level) for background murmur +
 * random impulse "clinks" (high sine bursts) for cup/glass sounds +
 * muffled conversation layer (shaped noise).
 */
export class CoffeeShopGenerator extends BaseSoundGenerator {
  readonly id = 'coffee-shop';
  readonly name = 'Coffee Shop';
  readonly category: SoundCategory = 'basic';

  private murmurSource: AudioBufferSourceNode | null = null;
  private murmurFilter: BiquadFilterNode | null = null;
  private clinkInterval: ReturnType<typeof setInterval> | null = null;
  private activeOscillators: OscillatorNode[] = [];

  protected buildAudioGraph(ctx: AudioContext, output: GainNode): void {
    // Background murmur: pink-ish noise (lowpassed white noise)
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    // Simple pink noise approximation using Paul Kellet's algorithm
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
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

    this.murmurSource = ctx.createBufferSource();
    this.murmurSource.buffer = buffer;
    this.murmurSource.loop = true;

    this.murmurFilter = ctx.createBiquadFilter();
    this.murmurFilter.type = 'lowpass';
    this.murmurFilter.frequency.value = 800;

    const murmurGain = ctx.createGain();
    murmurGain.gain.value = 0.15;

    this.murmurSource.connect(this.murmurFilter);
    this.murmurFilter.connect(murmurGain);
    murmurGain.connect(output);

    this.murmurSource.start();

    // Random clinks — short high-frequency sine bursts
    this.clinkInterval = setInterval(() => {
      if (ctx.state !== 'running') return;

      const osc = ctx.createOscillator();
      const clinkGain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.value = 2000 + Math.random() * 3000;

      clinkGain.gain.setValueAtTime(0.01 + Math.random() * 0.02, ctx.currentTime);
      clinkGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

      osc.connect(clinkGain);
      clinkGain.connect(output);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.1);

      this.activeOscillators.push(osc);
      osc.onended = () => {
        osc.disconnect();
        clinkGain.disconnect();
        this.activeOscillators = this.activeOscillators.filter((o) => o !== osc);
      };
    }, 800 + Math.random() * 2000);
  }

  protected teardownAudioGraph(): void {
    if (this.clinkInterval) {
      clearInterval(this.clinkInterval);
      this.clinkInterval = null;
    }
    for (const osc of this.activeOscillators) {
      try { osc.stop(); } catch { /* already stopped */ }
      osc.disconnect();
    }
    this.activeOscillators = [];

    if (this.murmurSource) {
      try { this.murmurSource.stop(); } catch { /* already stopped */ }
      this.murmurSource.disconnect();
      this.murmurSource = null;
    }
    if (this.murmurFilter) {
      this.murmurFilter.disconnect();
      this.murmurFilter = null;
    }
  }
}
