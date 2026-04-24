import type { SoundCategory } from '../../types';
import { BaseSoundGenerator } from '../base-generator';

/**
 * Train Journey — rhythmic rail clacking with gentle sway and bridge crossings.
 *
 * Technique: Low rumble for engine/wheels + periodic noise bursts for
 * rail joints + slow volume modulation for sway + occasional "ft ft ft"
 * high-frequency bursts when crossing bridges.
 */
export class TrainJourneyGenerator extends BaseSoundGenerator {
  readonly id = 'train-journey';
  readonly name = 'Train Journey';
  readonly category: SoundCategory = 'basic';

  private rumbleSource: AudioBufferSourceNode | null = null;
  private rumbleFilter: BiquadFilterNode | null = null;
  private rumbleGain: GainNode | null = null;
  private clickTimeout: ReturnType<typeof setTimeout> | null = null;
  private bridgeTimeout: ReturnType<typeof setTimeout> | null = null;
  private activeNodes: AudioNode[] = [];
  private swayLfo: OscillatorNode | null = null;
  private swayGain: GainNode | null = null;
  private stopped = false;

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
    this.swayLfo.frequency.value = 0.12 + Math.random() * 0.06;
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
    this.stopped = false;
    this.scheduleClick(ctx, output, 0);

    // Occasional bridge crossing — "ft ft ft ft" bursts
    this.scheduleBridge(ctx, output);
  }

  private scheduleClick(ctx: AudioContext, output: GainNode, tick: number): void {
    if (this.stopped) return;
    const emphasis = tick % 2 === 0 ? 1.0 : 0.7;
    this.playClick(ctx, output, emphasis);

    const delay = 680 + Math.random() * 60;
    this.clickTimeout = setTimeout(() => {
      if (!this.stopped && ctx.state === 'running') {
        this.scheduleClick(ctx, output, tick + 1);
      }
    }, delay);
  }

  private playClick(ctx: AudioContext, output: GainNode, emphasis: number): void {
    const clickLen = Math.floor(ctx.sampleRate * 0.04);
    const clickBuf = ctx.createBuffer(1, clickLen, ctx.sampleRate);
    const clickData = clickBuf.getChannelData(0);
    for (let i = 0; i < clickLen; i++) {
      clickData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (clickLen * 0.2));
    }

    const source = ctx.createBufferSource();
    source.buffer = clickBuf;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 500 + Math.random() * 200;
    filter.Q.value = 3;

    const gain = ctx.createGain();
    const vol = 0.02 * emphasis;
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.04);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(output);
    source.start(ctx.currentTime);
    source.stop(ctx.currentTime + 0.06);

    this.activeNodes.push(source, filter, gain);
    source.onended = () => {
      source.disconnect(); filter.disconnect(); gain.disconnect();
      this.activeNodes = this.activeNodes.filter((n) => n !== source && n !== filter && n !== gain);
    };
  }

  /**
   * Bridge crossing: rapid "ft ft ft ft" — short wind/metal resonance bursts
   * for 3–6 seconds, then silence until next bridge.
   */
  private scheduleBridge(ctx: AudioContext, output: GainNode): void {
    if (this.stopped) return;
    const delay = 15000 + Math.random() * 25000;
    this.bridgeTimeout = setTimeout(() => {
      if (this.stopped || ctx.state !== 'running') return;
      this.playBridgeCrossing(ctx, output);
      this.scheduleBridge(ctx, output);
    }, delay);
  }

  private playBridgeCrossing(ctx: AudioContext, output: GainNode): void {
    const now = ctx.currentTime;
    const bridgeDuration = 3 + Math.random() * 3;
    const ftInterval = 0.25 + Math.random() * 0.05;
    const ftCount = Math.floor(bridgeDuration / ftInterval);

    for (let i = 0; i < ftCount; i++) {
      const ftTime = now + i * ftInterval + Math.random() * 0.03;
      const ftLen = Math.floor(ctx.sampleRate * 0.08);
      const ftBuf = ctx.createBuffer(1, ftLen, ctx.sampleRate);
      const ftData = ftBuf.getChannelData(0);
      for (let j = 0; j < ftLen; j++) {
        ftData[j] = (Math.random() * 2 - 1) * Math.exp(-j / (ftLen * 0.3));
      }

      const source = ctx.createBufferSource();
      source.buffer = ftBuf;

      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 3000 + Math.random() * 2000;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.008 + Math.random() * 0.005, ftTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ftTime + 0.06);

      source.connect(filter);
      filter.connect(gain);
      gain.connect(output);
      source.start(ftTime);
      source.stop(ftTime + 0.1);

      this.activeNodes.push(source, filter, gain);
      source.onended = () => {
        source.disconnect(); filter.disconnect(); gain.disconnect();
        this.activeNodes = this.activeNodes.filter((n) => n !== source && n !== filter && n !== gain);
      };
    }
  }

  protected teardownAudioGraph(): void {
    this.stopped = true;
    if (this.clickTimeout) { clearTimeout(this.clickTimeout); this.clickTimeout = null; }
    if (this.bridgeTimeout) { clearTimeout(this.bridgeTimeout); this.bridgeTimeout = null; }
    if (this.swayLfo) { try { this.swayLfo.stop(); } catch { /* ok */ } this.swayLfo.disconnect(); this.swayLfo = null; }
    if (this.swayGain) { this.swayGain.disconnect(); this.swayGain = null; }
    for (const node of this.activeNodes) {
      try { (node as AudioBufferSourceNode).stop?.(); } catch { /* ok */ }
      node.disconnect();
    }
    this.activeNodes = [];
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
