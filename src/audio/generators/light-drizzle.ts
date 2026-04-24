import type { SoundCategory } from '../../types';
import { BaseSoundGenerator } from '../base-generator';

/**
 * Light Drizzle — gentle drizzle, just sparse individual drops.
 *
 * Technique: No continuous noise — only random noise-burst drops
 * at varying intervals, with different sizes and surfaces.
 */
export class LightDrizzleGenerator extends BaseSoundGenerator {
  readonly id = 'light-drizzle';
  readonly name = 'Light Drizzle';
  readonly category: SoundCategory = 'basic';

  private dropTimeout: ReturnType<typeof setTimeout> | null = null;
  private activeNodes: AudioNode[] = [];
  private bgSource: AudioBufferSourceNode | null = null;
  private bgFilter: BiquadFilterNode | null = null;
  private bgGain: GainNode | null = null;

  protected buildAudioGraph(ctx: AudioContext, output: GainNode): void {
    // Very subtle background rain texture — just enough to glue drops together
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    this.bgSource = ctx.createBufferSource();
    this.bgSource.buffer = buffer;
    this.bgSource.loop = true;
    this.bgFilter = ctx.createBiquadFilter();
    this.bgFilter.type = 'bandpass';
    this.bgFilter.frequency.value = 600;
    this.bgFilter.Q.value = 0.3;
    this.bgGain = ctx.createGain();
    this.bgGain.gain.value = 0.008;
    this.bgSource.connect(this.bgFilter);
    this.bgFilter.connect(this.bgGain);
    this.bgGain.connect(output);
    this.startLoopingSource(this.bgSource);

    this.scheduleDrop(ctx, output);
  }

  private scheduleDrop(ctx: AudioContext, output: GainNode): void {
    // Sparse — 200-600ms between drops, sometimes a little cluster
    const delay = Math.random() < 0.3
      ? 40 + Math.random() * 80    // 30% quick double-drop
      : 120 + Math.random() * 250; // 70% normal spacing

    this.dropTimeout = setTimeout(() => {
      if (ctx.state !== 'running' || !this._playing) {
        this.scheduleDrop(ctx, output);
        return;
      }
      this.playDrop(ctx, output);
      this.scheduleDrop(ctx, output);
    }, delay);
  }

  private playDrop(ctx: AudioContext, output: GainNode): void {
    const now = ctx.currentTime;
    const roll = Math.random();

    const bufLen = Math.floor(ctx.sampleRate * 0.08);
    const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufLen, 3);
    }

    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filt = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    if (roll < 0.4) {
      // Tiny drop on glass — high, delicate
      filt.type = 'bandpass';
      filt.frequency.value = 2500 + Math.random() * 2000;
      filt.Q.value = 0.6;
      const vol = 0.03 + Math.random() * 0.025;
      gain.gain.setValueAtTime(vol, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05 + Math.random() * 0.03);
    } else if (roll < 0.75) {
      // Medium drop on a leaf or surface
      filt.type = 'bandpass';
      filt.frequency.value = 800 + Math.random() * 1200;
      filt.Q.value = 0.4;
      const vol = 0.04 + Math.random() * 0.03;
      gain.gain.setValueAtTime(vol, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06 + Math.random() * 0.04);
    } else {
      // Slightly fatter drop — puddle plop
      filt.type = 'lowpass';
      filt.frequency.value = 400 + Math.random() * 300;
      const vol = 0.05 + Math.random() * 0.035;
      gain.gain.setValueAtTime(vol, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08 + Math.random() * 0.04);
    }

    src.connect(filt);
    filt.connect(gain);
    gain.connect(output);
    src.start(now);
    src.stop(now + 0.1);
    this.activeNodes.push(src);
    src.onended = () => {
      src.disconnect();
      filt.disconnect();
      gain.disconnect();
      this.activeNodes = this.activeNodes.filter(n => n !== src);
    };
  }

  protected teardownAudioGraph(): void {
    if (this.dropTimeout) {
      clearTimeout(this.dropTimeout);
      this.dropTimeout = null;
    }
    for (const node of this.activeNodes) {
      try { (node as AudioBufferSourceNode).stop(); } catch { /* ok */ }
      node.disconnect();
    }
    this.activeNodes = [];
    if (this.bgSource) {
      try { this.bgSource.stop(); } catch { /* ok */ }
      this.bgSource.disconnect();
      this.bgSource = null;
    }
    if (this.bgFilter) { this.bgFilter.disconnect(); this.bgFilter = null; }
    if (this.bgGain) { this.bgGain.disconnect(); this.bgGain = null; }
  }
}
