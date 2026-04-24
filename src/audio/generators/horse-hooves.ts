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
  private stopped = false;
  private gait: 'trot' | 'walk' = 'trot';
  private gaitBeatsLeft = 0;

  protected buildAudioGraph(ctx: AudioContext, output: GainNode): void {
    this.stopped = false;
    this.gait = 'trot';
    this.gaitBeatsLeft = 16 + Math.floor(Math.random() * 16); // 16-32 beats before first change
    this.scheduleStep(ctx, output, 0);
  }

  private scheduleStep(ctx: AudioContext, output: GainNode, beatIndex: number): void {
    if (this.stopped) return;

    // Check if it's time to switch gait
    this.gaitBeatsLeft--;
    if (this.gaitBeatsLeft <= 0) {
      this.gait = this.gait === 'trot' ? 'walk' : 'trot';
      // Walk lasts shorter (8-16 beats), trot longer (16-32 beats)
      this.gaitBeatsLeft = this.gait === 'trot'
        ? 16 + Math.floor(Math.random() * 16)
        : 8 + Math.floor(Math.random() * 8);
    }

    if (this.gait === 'trot') {
      this.playTrotBeat(ctx, output, beatIndex);
    } else {
      this.playWalkBeat(ctx, output, beatIndex);
    }
  }

  /** Trot: paired beats — "ta-da, ta-da" */
  private playTrotBeat(ctx: AudioContext, output: GainNode, beatIndex: number): void {
    const beatInPair = beatIndex % 2;
    const pairIndex = Math.floor(beatIndex / 2) % 2;

    const emphasis = beatInPair === 0
      ? (pairIndex === 0 ? 1.0 : 0.85)
      : (pairIndex === 0 ? 0.6 : 0.5);

    this.playHoof(ctx, output, emphasis);

    // 25% chance of a double-tap — hoof skips or bounces on stone
    if (Math.random() < 0.25) {
      const tapDelay = 0.03 + Math.random() * 0.04; // 30-70ms after main hit
      setTimeout(() => {
        if (!this.stopped) this.playHoof(ctx, output, emphasis * 0.35);
      }, tapDelay * 1000);
    }

    const withinPairGap = 160 + Math.random() * 60;
    const betweenPairGap = 350 + Math.random() * 120;
    const delay = beatInPair === 0 ? withinPairGap : betweenPairGap;

    this.hoofTimeout = setTimeout(() => {
      if (!this.stopped && ctx.state === 'running') {
        this.scheduleStep(ctx, output, beatIndex + 1);
      }
    }, delay);
  }

  /** Walk: 4 evenly spaced beats — slow, heavy, relaxed */
  private playWalkBeat(ctx: AudioContext, output: GainNode, beatIndex: number): void {
    const beatIn4 = beatIndex % 4;
    // Walk has a gentle emphasis pattern: 1-2-3-4, beat 1 heaviest
    const walkEmphasis = [0.9, 0.55, 0.75, 0.5];
    const emphasis = walkEmphasis[beatIn4];

    this.playHoof(ctx, output, emphasis);

    // 30% chance of a double-tap on walk — more common when slow
    if (Math.random() < 0.30) {
      const tapDelay = 0.04 + Math.random() * 0.05; // 40-90ms after, slightly lazier
      setTimeout(() => {
        if (!this.stopped) this.playHoof(ctx, output, emphasis * 0.3);
      }, tapDelay * 1000);
    }

    // Walk is slower and more even — 500-800ms between each step
    const delay = 500 + Math.random() * 300;

    this.hoofTimeout = setTimeout(() => {
      if (!this.stopped && ctx.state === 'running') {
        this.scheduleStep(ctx, output, beatIndex + 1);
      }
    }, delay);
  }

  private playHoof(ctx: AudioContext, output: GainNode, emphasis: number): void {
    const now = ctx.currentTime;

    // Noise burst shaped into a hoof impact — all noise, no oscillators
    const impactLen = Math.floor(ctx.sampleRate * 0.18);
    const impactBuf = ctx.createBuffer(1, impactLen, ctx.sampleRate);
    const impactData = impactBuf.getChannelData(0);
    for (let i = 0; i < impactLen; i++) {
      impactData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (impactLen * 0.25));
    }

    const impactSource = ctx.createBufferSource();
    impactSource.buffer = impactBuf;

    // Low body — warm, round thud that lingers softly
    const lowFilter = ctx.createBiquadFilter();
    lowFilter.type = 'lowpass';
    lowFilter.frequency.value = 220 + Math.random() * 60;
    lowFilter.Q.value = 1.5;

    const lowGain = ctx.createGain();
    const lowVol = 0.25 * emphasis;
    lowGain.gain.setValueAtTime(lowVol, now);
    lowGain.gain.exponentialRampToValueAtTime(lowVol * 0.3, now + 0.06);
    lowGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);

    impactSource.connect(lowFilter);
    lowFilter.connect(lowGain);
    lowGain.connect(output);
    impactSource.start(now);
    impactSource.stop(now + 0.22);
    this.trackNode(impactSource, [lowFilter, lowGain]);

    // Mid knock — rounder, softer "clop", lower frequency
    const knockLen = Math.floor(ctx.sampleRate * 0.08);
    const knockBuf = ctx.createBuffer(1, knockLen, ctx.sampleRate);
    const knockData = knockBuf.getChannelData(0);
    for (let i = 0; i < knockLen; i++) {
      knockData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (knockLen * 0.12));
    }

    const knockSource = ctx.createBufferSource();
    knockSource.buffer = knockBuf;

    const midFilter = ctx.createBiquadFilter();
    midFilter.type = 'bandpass';
    midFilter.frequency.value = 450 + Math.random() * 200;
    midFilter.Q.value = 2 + Math.random() * 1.5;

    const midGain = ctx.createGain();
    midGain.gain.setValueAtTime(0.15 * emphasis, now);
    midGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);

    knockSource.connect(midFilter);
    midFilter.connect(midGain);
    midGain.connect(output);
    knockSource.start(now);
    knockSource.stop(now + 0.10);
    this.trackNode(knockSource, [midFilter, midGain]);
  }

  private trackNode(source: AudioBufferSourceNode | OscillatorNode, extras: AudioNode[]): void {
    this.activeNodes.push(source, ...extras);
    source.onended = () => {
      source.disconnect();
      for (const n of extras) n.disconnect();
      this.activeNodes = this.activeNodes.filter((nd) => nd !== source && !extras.includes(nd));
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
  }
}
