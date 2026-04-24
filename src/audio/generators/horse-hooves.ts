import type { SoundCategory } from '../../types';
import { BaseSoundGenerator } from '../base-generator';

/**
 * Horse Hooves — trotting horse on a path.
 *
 * Technique: Low-pitched filtered noise bursts in a "cloppete cloppete"
 * trot pattern (4-beat gait with paired emphasis). Very soft gravel
 * noise bed for ground texture.
 */
export class HorseHoovesGenerator extends BaseSoundGenerator {
  readonly id = 'horse-hooves';
  readonly name = 'Horse Hooves';
  readonly category: SoundCategory = 'basic';

  private hoofTimeout: ReturnType<typeof setTimeout> | null = null;
  private activeNodes: AudioNode[] = [];
  private gravelSource: AudioBufferSourceNode | null = null;
  private gravelFilter: BiquadFilterNode | null = null;
  private gravelGain: GainNode | null = null;
  private stopped = false;

  protected buildAudioGraph(ctx: AudioContext, output: GainNode): void {
    // Light gravel bed — very soft highpass noise
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    this.gravelSource = ctx.createBufferSource();
    this.gravelSource.buffer = buffer;
    this.gravelSource.loop = true;

    this.gravelFilter = ctx.createBiquadFilter();
    this.gravelFilter.type = 'bandpass';
    this.gravelFilter.frequency.value = 4000;
    this.gravelFilter.Q.value = 0.3;

    this.gravelGain = ctx.createGain();
    this.gravelGain.gain.value = 0.006;

    this.gravelSource.connect(this.gravelFilter);
    this.gravelFilter.connect(this.gravelGain);
    this.gravelGain.connect(output);
    this.startLoopingSource(this.gravelSource);

    // Start trot rhythm
    this.stopped = false;
    this.scheduleTrotCycle(ctx, output, 0);
  }

  /**
   * Trot gait: pairs of beats — "clop-clop ... clop-clop"
   * Each pair has a heavier first beat and lighter second.
   */
  private scheduleTrotCycle(ctx: AudioContext, output: GainNode, beatIndex: number): void {
    if (this.stopped) return;

    // Trot pattern: beat 0,1 = first pair, beat 2,3 = second pair
    const beatInPair = beatIndex % 2;
    const pairIndex = Math.floor(beatIndex / 2) % 2;

    // Emphasis: first of each pair is stronger, first pair slightly stronger than second
    const emphasis = beatInPair === 0
      ? (pairIndex === 0 ? 1.0 : 0.85)
      : (pairIndex === 0 ? 0.6 : 0.5);

    this.playHoof(ctx, output, emphasis);

    // Timing: short gap within pair, longer gap between pairs
    const withinPairGap = 180 + Math.random() * 30;
    const betweenPairGap = 320 + Math.random() * 50;
    const delay = beatInPair === 0 ? withinPairGap : betweenPairGap;

    this.hoofTimeout = setTimeout(() => {
      if (!this.stopped && ctx.state === 'running') {
        this.scheduleTrotCycle(ctx, output, beatIndex + 1);
      }
    }, delay);
  }

  private playHoof(ctx: AudioContext, output: GainNode, emphasis: number): void {
    const now = ctx.currentTime;

    // Low, thuddy hoof impact — filtered noise burst
    const impactLen = Math.floor(ctx.sampleRate * 0.06);
    const impactBuf = ctx.createBuffer(1, impactLen, ctx.sampleRate);
    const impactData = impactBuf.getChannelData(0);
    for (let i = 0; i < impactLen; i++) {
      impactData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (impactLen * 0.15));
    }

    const impactSource = ctx.createBufferSource();
    impactSource.buffer = impactBuf;

    const lowFilter = ctx.createBiquadFilter();
    lowFilter.type = 'lowpass';
    lowFilter.frequency.value = 300 + Math.random() * 100;
    lowFilter.Q.value = 1.5;

    const impactGain = ctx.createGain();
    const vol = 0.035 * emphasis;
    impactGain.gain.setValueAtTime(vol, now);
    impactGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05 + Math.random() * 0.02);

    impactSource.connect(lowFilter);
    lowFilter.connect(impactGain);
    impactGain.connect(output);
    impactSource.start(now);
    impactSource.stop(now + 0.08);

    // Brief gravel surge on impact
    if (this.gravelGain) {
      this.gravelGain.gain.cancelScheduledValues(now);
      this.gravelGain.gain.setValueAtTime(0.006, now);
      this.gravelGain.gain.linearRampToValueAtTime(0.015 * emphasis, now + 0.01);
      this.gravelGain.gain.linearRampToValueAtTime(0.006, now + 0.06);
    }

    this.activeNodes.push(impactSource, lowFilter, impactGain);
    impactSource.onended = () => {
      impactSource.disconnect(); lowFilter.disconnect(); impactGain.disconnect();
      this.activeNodes = this.activeNodes.filter((n) => n !== impactSource && n !== lowFilter && n !== impactGain);
    };
  }

  protected teardownAudioGraph(): void {
    this.stopped = true;
    if (this.hoofTimeout) { clearTimeout(this.hoofTimeout); this.hoofTimeout = null; }
    for (const node of this.activeNodes) {
      try { (node as AudioBufferSourceNode).stop?.(); } catch { /* ok */ }
      node.disconnect();
    }
    this.activeNodes = [];
    if (this.gravelSource) {
      this.gravelSource.onended = null;
      try { this.gravelSource.stop(); } catch { /* ok */ }
      this.gravelSource.disconnect();
      this.gravelSource = null;
    }
    if (this.gravelFilter) { this.gravelFilter.disconnect(); this.gravelFilter = null; }
    if (this.gravelGain) { this.gravelGain.disconnect(); this.gravelGain = null; }
  }
}
