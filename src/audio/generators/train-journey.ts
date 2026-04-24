import type { SoundCategory } from '../../types';
import { BaseSoundGenerator } from '../base-generator';

/**
 * Train Journey — rhythmic rail clacking with gentle sway.
 *
 * Technique: Periodic noise bursts for rail joints + low rumble
 * for engine/wheel contact + slow volume modulation for sway.
 */
export class TrainJourneyGenerator extends BaseSoundGenerator {
  readonly id = 'train-journey';
  readonly name = 'Train Journey';
  readonly category: SoundCategory = 'basic';

  private rumbleSource: AudioBufferSourceNode | null = null;
  private rumbleFilter: BiquadFilterNode | null = null;
  private rumbleGain: GainNode | null = null;
  private clickInterval: ReturnType<typeof setInterval> | null = null;
  private activeOscillators: OscillatorNode[] = [];
  private swayLfo: OscillatorNode | null = null;
  private swayGain: GainNode | null = null;

  protected buildAudioGraph(ctx: AudioContext, output: GainNode): void {
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    // Continuous wheel rumble
    this.rumbleSource = ctx.createBufferSource();
    this.rumbleSource.buffer = buffer;
    this.rumbleSource.loop = true;

    this.rumbleFilter = ctx.createBiquadFilter();
    this.rumbleFilter.type = 'lowpass';
    this.rumbleFilter.frequency.value = 200;
    this.rumbleFilter.Q.value = 0.5;

    this.rumbleGain = ctx.createGain();
    this.rumbleGain.gain.value = 0.1;

    // Gentle sway modulation
    this.swayLfo = ctx.createOscillator();
    this.swayLfo.type = 'sine';
    this.swayLfo.frequency.value = 0.15;
    this.swayGain = ctx.createGain();
    this.swayGain.gain.value = 0.03;
    this.swayLfo.connect(this.swayGain);
    this.swayGain.connect(this.rumbleGain.gain);

    this.rumbleSource.connect(this.rumbleFilter);
    this.rumbleFilter.connect(this.rumbleGain);
    this.rumbleGain.connect(output);
    this.startLoopingSource(this.rumbleSource);
    this.swayLfo.start();

    // Rail joint clicks — rhythmic double-click pattern
    let tick = 0;
    this.clickInterval = setInterval(() => {
      if (ctx.state !== 'running') return;
      this.playClick(ctx, output, tick % 2 === 0 ? 1.0 : 0.7);
      tick++;
    }, 700 + Math.random() * 30); // steady rhythm with slight jitter
  }

  private playClick(ctx: AudioContext, output: GainNode, emphasis: number): void {
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.type = 'square';
    osc.frequency.value = 80 + Math.random() * 40;

    filter.type = 'bandpass';
    filter.frequency.value = 600;
    filter.Q.value = 3;

    const vol = 0.02 * emphasis;
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.05);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(output);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.06);

    this.activeOscillators.push(osc);
    osc.onended = () => {
      osc.disconnect(); filter.disconnect(); gain.disconnect();
      this.activeOscillators = this.activeOscillators.filter((o) => o !== osc);
    };
  }

  protected teardownAudioGraph(): void {
    if (this.clickInterval) { clearInterval(this.clickInterval); this.clickInterval = null; }
    if (this.swayLfo) { try { this.swayLfo.stop(); } catch { /* ok */ } this.swayLfo.disconnect(); this.swayLfo = null; }
    if (this.swayGain) { this.swayGain.disconnect(); this.swayGain = null; }
    for (const osc of this.activeOscillators) {
      try { osc.stop(); } catch { /* ok */ }
      osc.disconnect();
    }
    this.activeOscillators = [];
    if (this.rumbleSource) {
      this.rumbleSource.onended = null;
      try { this.rumbleSource.stop(); } catch { /* ok */ }
      this.rumbleSource.disconnect();
      this.rumbleSource = null;
    }
    if (this.rumbleFilter) { this.rumbleFilter.disconnect(); this.rumbleFilter = null; }
    if (this.rumbleGain) { this.rumbleGain.disconnect(); this.rumbleGain = null; }
  }
}
