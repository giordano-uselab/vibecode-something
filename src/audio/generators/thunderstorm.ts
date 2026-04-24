import type { SoundCategory } from '../../types';
import { BaseSoundGenerator } from '../base-generator';

/**
 * Thunderstorm — rain with distant thunder rolls.
 *
 * Technique: Bandpass noise for rain + periodic low-frequency
 * noise bursts with long decay for thunder rumble.
 */
export class ThunderstormGenerator extends BaseSoundGenerator {
  readonly id = 'thunderstorm';
  readonly name = 'Thunderstorm';
  readonly category: SoundCategory = 'basic';

  private rainSource: AudioBufferSourceNode | null = null;
  private rainFilter: BiquadFilterNode | null = null;
  private rainGain: GainNode | null = null;
  private thunderInterval: ReturnType<typeof setInterval> | null = null;
  private activeNodes: AudioNode[] = [];

  protected buildAudioGraph(ctx: AudioContext, output: GainNode): void {
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    // Constant rain layer
    this.rainSource = ctx.createBufferSource();
    this.rainSource.buffer = buffer;
    this.rainSource.loop = true;

    this.rainFilter = ctx.createBiquadFilter();
    this.rainFilter.type = 'bandpass';
    this.rainFilter.frequency.value = 2500;
    this.rainFilter.Q.value = 0.4;

    this.rainGain = ctx.createGain();
    this.rainGain.gain.value = 0.18;

    this.rainSource.connect(this.rainFilter);
    this.rainFilter.connect(this.rainGain);
    this.rainGain.connect(output);
    this.startLoopingSource(this.rainSource);

    // Thunder every 8–20 seconds
    this.thunderInterval = setInterval(() => {
      if (ctx.state !== 'running') return;
      this.playThunder(ctx, output);
    }, 8000 + Math.random() * 12000);
  }

  private playThunder(ctx: AudioContext, output: GainNode): void {
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 80 + Math.random() * 60;

    const gain = ctx.createGain();
    const attackTime = 0.05 + Math.random() * 0.1;
    const decayTime = 2 + Math.random() * 3;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.2 + Math.random() * 0.15, ctx.currentTime + attackTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + attackTime + decayTime);

    source.connect(lowpass);
    lowpass.connect(gain);
    gain.connect(output);
    source.start(ctx.currentTime);
    source.stop(ctx.currentTime + attackTime + decayTime + 0.5);

    this.activeNodes.push(source, lowpass, gain);
    source.onended = () => {
      source.disconnect();
      lowpass.disconnect();
      gain.disconnect();
      this.activeNodes = this.activeNodes.filter((n) => n !== source && n !== lowpass && n !== gain);
    };
  }

  protected teardownAudioGraph(): void {
    if (this.thunderInterval) {
      clearInterval(this.thunderInterval);
      this.thunderInterval = null;
    }
    for (const node of this.activeNodes) {
      try { (node as AudioBufferSourceNode).stop?.(); } catch { /* ok */ }
      node.disconnect();
    }
    this.activeNodes = [];
    if (this.rainSource) {
      this.rainSource.onended = null;
      try { this.rainSource.stop(); } catch { /* already stopped */ }
      this.rainSource.disconnect();
      this.rainSource = null;
    }
    for (const node of [this.rainFilter, this.rainGain]) {
      if (node) node.disconnect();
    }
    this.rainFilter = null;
    this.rainGain = null;
  }
}
