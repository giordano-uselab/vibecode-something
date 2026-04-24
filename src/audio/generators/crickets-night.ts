import type { SoundCategory } from '../../types';
import { BaseSoundGenerator } from '../base-generator';

/**
 * Crickets & Night — evening insects chirping in a calm night.
 *
 * Technique: Scheduled chirp bursts (groups of rapid "cri-cri-cri")
 * using short sine tone pulses at cricket frequencies, repeating at
 * a steady rhythm with slight natural variation. Soft lowpass noise
 * for warm night ambience.
 */
export class CricketsNightGenerator extends BaseSoundGenerator {
  readonly id = 'crickets-night';
  readonly name = 'Crickets & Night';
  readonly category: SoundCategory = 'basic';

  private nightSource: AudioBufferSourceNode | null = null;
  private nightFilter: BiquadFilterNode | null = null;
  private nightGain: GainNode | null = null;
  private cricket1Timeout: ReturnType<typeof setTimeout> | null = null;
  private cricket2Timeout: ReturnType<typeof setTimeout> | null = null;
  private cricket3Timeout: ReturnType<typeof setTimeout> | null = null;
  private activeNodes: AudioNode[] = [];
  private stopped = false;

  protected buildAudioGraph(ctx: AudioContext, output: GainNode): void {
    // Night ambience — very soft warm noise
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    this.nightSource = ctx.createBufferSource();
    this.nightSource.buffer = buffer;
    this.nightSource.loop = true;

    this.nightFilter = ctx.createBiquadFilter();
    this.nightFilter.type = 'lowpass';
    this.nightFilter.frequency.value = 250;

    this.nightGain = ctx.createGain();
    this.nightGain.gain.value = 0.04;

    this.nightSource.connect(this.nightFilter);
    this.nightFilter.connect(this.nightGain);
    this.nightGain.connect(output);
    this.startLoopingSource(this.nightSource);

    // Start 3 cricket voices at different rhythms
    this.stopped = false;
    this.scheduleCricket1(ctx, output);
    this.scheduleCricket2(ctx, output);
    this.scheduleCricket3(ctx, output);
  }

  /**
   * Play a chirp burst: a rapid series of short sine tones.
   * "cri-cri-cri" = 2-4 quick pulses in ~200ms.
   */
  private playChirpBurst(ctx: AudioContext, output: GainNode, freq: number, pulses: number, vol: number): void {
    const pulseInterval = 0.055 + Math.random() * 0.015; // ~60ms between "cri"s
    const pulseDuration = 0.030 + Math.random() * 0.010;

    for (let p = 0; p < pulses; p++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.value = freq + Math.random() * 100;

      const startTime = ctx.currentTime + p * pulseInterval;
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(vol, startTime + 0.005);
      gain.gain.setValueAtTime(vol, startTime + pulseDuration - 0.005);
      gain.gain.linearRampToValueAtTime(0, startTime + pulseDuration);

      osc.connect(gain);
      gain.connect(output);
      osc.start(startTime);
      osc.stop(startTime + pulseDuration + 0.01);

      this.activeNodes.push(osc, gain);
      osc.onended = () => {
        osc.disconnect(); gain.disconnect();
        this.activeNodes = this.activeNodes.filter((n) => n !== osc && n !== gain);
      };
    }
  }

  // Cricket 1: steady "cri-cri" every ~1s
  private scheduleCricket1(ctx: AudioContext, output: GainNode): void {
    if (this.stopped) return;
    const delay = 900 + Math.random() * 200;
    this.cricket1Timeout = setTimeout(() => {
      if (this.stopped || ctx.state !== 'running') return;
      const pulses = Math.random() < 0.3 ? 3 : 2;
      this.playChirpBurst(ctx, output, 5500, pulses, 0.012);
      this.scheduleCricket1(ctx, output);
    }, delay);
  }

  // Cricket 2: slightly slower, different pitch
  private scheduleCricket2(ctx: AudioContext, output: GainNode): void {
    if (this.stopped) return;
    const delay = 1200 + Math.random() * 400;
    this.cricket2Timeout = setTimeout(() => {
      if (this.stopped || ctx.state !== 'running') return;
      const pulses = Math.random() < 0.5 ? 3 : 4;
      this.playChirpBurst(ctx, output, 4800, pulses, 0.008);
      this.scheduleCricket2(ctx, output);
    }, delay);
  }

  // Cricket 3: occasional lone chirp, higher pitch
  private scheduleCricket3(ctx: AudioContext, output: GainNode): void {
    if (this.stopped) return;
    const delay = 2500 + Math.random() * 3000;
    this.cricket3Timeout = setTimeout(() => {
      if (this.stopped || ctx.state !== 'running') return;
      const pulses = 2 + Math.floor(Math.random() * 3);
      this.playChirpBurst(ctx, output, 6200 + Math.random() * 400, pulses, 0.006);
      this.scheduleCricket3(ctx, output);
    }, delay);
  }

  protected teardownAudioGraph(): void {
    this.stopped = true;
    if (this.cricket1Timeout) { clearTimeout(this.cricket1Timeout); this.cricket1Timeout = null; }
    if (this.cricket2Timeout) { clearTimeout(this.cricket2Timeout); this.cricket2Timeout = null; }
    if (this.cricket3Timeout) { clearTimeout(this.cricket3Timeout); this.cricket3Timeout = null; }
    for (const node of this.activeNodes) {
      try { (node as OscillatorNode).stop?.(); } catch { /* ok */ }
      node.disconnect();
    }
    this.activeNodes = [];
    if (this.nightSource) {
      this.nightSource.onended = null;
      try { this.nightSource.stop(); } catch { /* ok */ }
      this.nightSource.disconnect();
      this.nightSource = null;
    }
    if (this.nightFilter) { this.nightFilter.disconnect(); this.nightFilter = null; }
    if (this.nightGain) { this.nightGain.disconnect(); this.nightGain = null; }
  }
}
