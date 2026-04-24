import type { SoundCategory } from '../../types';
import { BaseSoundGenerator } from '../base-generator';

/**
 * Rustling Leaves — dry leaves swirling on the ground and in the wind.
 *
 * Technique: Two bandpass noise layers (mid and high) with independent
 * random gain modulation creating swooshy gusts. Occasional sharper
 * "skitter" bursts for leaves tumbling across pavement.
 */
export class RustlingLeavesGenerator extends BaseSoundGenerator {
  readonly id = 'rustling-leaves';
  readonly name = 'Rustling Leaves';
  readonly category: SoundCategory = 'basic';

  private swooshSource: AudioBufferSourceNode | null = null;
  private swooshFilter: BiquadFilterNode | null = null;
  private swooshGain: GainNode | null = null;
  private crispSource: AudioBufferSourceNode | null = null;
  private crispFilter: BiquadFilterNode | null = null;
  private crispGain: GainNode | null = null;
  private gustTimeout: ReturnType<typeof setTimeout> | null = null;
  private skitterTimeout: ReturnType<typeof setTimeout> | null = null;
  private stopped = false;

  protected buildAudioGraph(ctx: AudioContext, output: GainNode): void {
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    // Swooshy mid layer — the body of the rustling
    this.swooshSource = ctx.createBufferSource();
    this.swooshSource.buffer = buffer;
    this.swooshSource.loop = true;

    this.swooshFilter = ctx.createBiquadFilter();
    this.swooshFilter.type = 'bandpass';
    this.swooshFilter.frequency.value = 2500;
    this.swooshFilter.Q.value = 0.8;

    this.swooshGain = ctx.createGain();
    this.swooshGain.gain.value = 0.02;

    this.swooshSource.connect(this.swooshFilter);
    this.swooshFilter.connect(this.swooshGain);
    this.swooshGain.connect(output);
    this.startLoopingSource(this.swooshSource);

    // Crisp high layer — papery, crinkly texture
    const crispBuf = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const crispData = crispBuf.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      crispData[i] = Math.random() * 2 - 1;
    }

    this.crispSource = ctx.createBufferSource();
    this.crispSource.buffer = crispBuf;
    this.crispSource.loop = true;

    this.crispFilter = ctx.createBiquadFilter();
    this.crispFilter.type = 'bandpass';
    this.crispFilter.frequency.value = 7000;
    this.crispFilter.Q.value = 1.0;

    this.crispGain = ctx.createGain();
    this.crispGain.gain.value = 0.008;

    this.crispSource.connect(this.crispFilter);
    this.crispFilter.connect(this.crispGain);
    this.crispGain.connect(output);
    this.startLoopingSource(this.crispSource);

    // Random gusts — both layers swell together
    this.stopped = false;
    this.scheduleGust(ctx);
    this.scheduleSkitter(ctx);
  }

  private scheduleGust(ctx: AudioContext): void {
    if (this.stopped) return;
    const delay = 600 + Math.random() * 1500;
    this.gustTimeout = setTimeout(() => {
      if (this.stopped || ctx.state !== 'running') return;
      this.playGust(ctx);
      this.scheduleGust(ctx);
    }, delay);
  }

  private playGust(ctx: AudioContext): void {
    if (!this.swooshGain || !this.crispGain || !this.swooshFilter) return;
    const now = ctx.currentTime;
    const rise = 0.08 + Math.random() * 0.15;
    const hold = 0.1 + Math.random() * 0.3;
    const fall = 0.15 + Math.random() * 0.4;
    const intensity = 0.04 + Math.random() * 0.06;
    const crispIntensity = 0.015 + Math.random() * 0.02;

    // Swoosh swell
    this.swooshGain.gain.cancelScheduledValues(now);
    this.swooshGain.gain.setValueAtTime(this.swooshGain.gain.value, now);
    this.swooshGain.gain.linearRampToValueAtTime(intensity, now + rise);
    this.swooshGain.gain.linearRampToValueAtTime(intensity * 0.8, now + rise + hold);
    this.swooshGain.gain.linearRampToValueAtTime(0.02, now + rise + hold + fall);

    // Crisp swell (slightly delayed)
    this.crispGain.gain.cancelScheduledValues(now);
    this.crispGain.gain.setValueAtTime(this.crispGain.gain.value, now);
    this.crispGain.gain.linearRampToValueAtTime(crispIntensity, now + rise * 0.7);
    this.crispGain.gain.linearRampToValueAtTime(0.008, now + rise + hold + fall * 0.8);

    // Slight filter shift for movement
    const freqShift = 1800 + Math.random() * 2000;
    this.swooshFilter.frequency.cancelScheduledValues(now);
    this.swooshFilter.frequency.setValueAtTime(2500, now);
    this.swooshFilter.frequency.linearRampToValueAtTime(freqShift, now + rise);
    this.swooshFilter.frequency.linearRampToValueAtTime(2500, now + rise + hold + fall);
  }

  private scheduleSkitter(ctx: AudioContext): void {
    if (this.stopped) return;
    const delay = 2000 + Math.random() * 5000;
    this.skitterTimeout = setTimeout(() => {
      if (this.stopped || ctx.state !== 'running') return;
      // Brief sharp rustle — leaf tumbling
      if (this.crispGain) {
        const now = ctx.currentTime;
        this.crispGain.gain.cancelScheduledValues(now);
        this.crispGain.gain.setValueAtTime(0.008, now);
        this.crispGain.gain.linearRampToValueAtTime(0.04, now + 0.03);
        this.crispGain.gain.linearRampToValueAtTime(0.008, now + 0.12);
      }
      this.scheduleSkitter(ctx);
    }, delay);
  }

  protected teardownAudioGraph(): void {
    this.stopped = true;
    if (this.gustTimeout) { clearTimeout(this.gustTimeout); this.gustTimeout = null; }
    if (this.skitterTimeout) { clearTimeout(this.skitterTimeout); this.skitterTimeout = null; }
    for (const src of [this.swooshSource, this.crispSource]) {
      if (src) { src.onended = null; try { src.stop(); } catch { /* ok */ } src.disconnect(); }
    }
    this.swooshSource = null;
    this.crispSource = null;
    for (const node of [this.swooshFilter, this.swooshGain, this.crispFilter, this.crispGain]) {
      if (node) node.disconnect();
    }
    this.swooshFilter = null;
    this.swooshGain = null;
    this.crispFilter = null;
    this.crispGain = null;
  }
}
