import type { SoundCategory } from '../../types';
import { BaseSoundGenerator } from '../base-generator';

/**
 * Thunderstorm — heavy rain with lightning cracks and rolling thunder.
 *
 * Technique: Bandpass noise for rain + sharp broadband crack for lightning +
 * low-frequency noise with long decay for rolling thunder.
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

    // Constant heavy rain layer
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

    // Thunder + lightning every 6–18 seconds
    this.scheduleNextThunder(ctx, output);
  }

  private scheduleNextThunder(ctx: AudioContext, output: GainNode): void {
    const delay = 6000 + Math.random() * 12000;
    this.thunderInterval = setTimeout(() => {
      if (ctx.state !== 'running' || !this.rainSource) return;
      this.playLightningAndThunder(ctx, output);
      this.scheduleNextThunder(ctx, output);
    }, delay);
  }

  private playLightningAndThunder(ctx: AudioContext, output: GainNode): void {
    const now = ctx.currentTime;
    const distance = Math.random(); // 0 = close, 1 = far
    const thunderDelay = distance * 2.5; // close lightning = immediate thunder

    // --- Lightning crack: sharp broadband burst ---
    const crackLen = ctx.sampleRate * 0.15;
    const crackBuf = ctx.createBuffer(1, crackLen, ctx.sampleRate);
    const crackData = crackBuf.getChannelData(0);
    for (let i = 0; i < crackLen; i++) {
      crackData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (crackLen * 0.05));
    }

    const crackSource = ctx.createBufferSource();
    crackSource.buffer = crackBuf;

    const crackFilter = ctx.createBiquadFilter();
    crackFilter.type = 'highpass';
    crackFilter.frequency.value = 2000 + Math.random() * 2000;

    const crackGain = ctx.createGain();
    const crackVol = (1 - distance * 0.7) * 0.25;
    crackGain.gain.setValueAtTime(crackVol, now);
    crackGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

    crackSource.connect(crackFilter);
    crackFilter.connect(crackGain);
    crackGain.connect(output);
    crackSource.start(now);
    crackSource.stop(now + 0.2);

    this.activeNodes.push(crackSource, crackFilter, crackGain);
    crackSource.onended = () => {
      crackSource.disconnect(); crackFilter.disconnect(); crackGain.disconnect();
      this.activeNodes = this.activeNodes.filter((n) => n !== crackSource && n !== crackFilter && n !== crackGain);
    };

    // --- Rolling thunder: low rumble after delay ---
    const thunderLen = ctx.sampleRate * 4;
    const thunderBuf = ctx.createBuffer(1, thunderLen, ctx.sampleRate);
    const thunderData = thunderBuf.getChannelData(0);
    for (let i = 0; i < thunderLen; i++) {
      thunderData[i] = Math.random() * 2 - 1;
    }

    const thunderSource = ctx.createBufferSource();
    thunderSource.buffer = thunderBuf;

    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 60 + Math.random() * 80 + distance * 40;

    const thunderGain = ctx.createGain();
    const attackTime = 0.08 + Math.random() * 0.15;
    const peakVol = 0.2 + Math.random() * 0.15;
    const decayTime = 2 + Math.random() * 3;

    thunderGain.gain.setValueAtTime(0.0001, now + thunderDelay);
    thunderGain.gain.linearRampToValueAtTime(peakVol, now + thunderDelay + attackTime);
    // Multiple rumble peaks for rolling effect
    const rumbles = 1 + Math.floor(Math.random() * 3);
    let t = now + thunderDelay + attackTime;
    for (let r = 0; r < rumbles; r++) {
      const dip = peakVol * (0.3 + Math.random() * 0.3);
      const dipDur = 0.3 + Math.random() * 0.5;
      const rePeak = peakVol * (0.5 + Math.random() * 0.4);
      thunderGain.gain.linearRampToValueAtTime(dip, t + dipDur);
      thunderGain.gain.linearRampToValueAtTime(rePeak, t + dipDur * 2);
      t += dipDur * 2;
    }
    thunderGain.gain.exponentialRampToValueAtTime(0.0001, t + decayTime);

    thunderSource.connect(lowpass);
    lowpass.connect(thunderGain);
    thunderGain.connect(output);
    thunderSource.start(now + thunderDelay);
    thunderSource.stop(t + decayTime + 0.5);

    this.activeNodes.push(thunderSource, lowpass, thunderGain);
    thunderSource.onended = () => {
      thunderSource.disconnect(); lowpass.disconnect(); thunderGain.disconnect();
      this.activeNodes = this.activeNodes.filter((n) => n !== thunderSource && n !== lowpass && n !== thunderGain);
    };

    // --- Rain intensity surge after close thunder ---
    if (this.rainGain && distance < 0.4) {
      const baseVol = 0.18;
      this.rainGain.gain.setValueAtTime(baseVol, now + thunderDelay);
      this.rainGain.gain.linearRampToValueAtTime(baseVol * 1.5, now + thunderDelay + 0.5);
      this.rainGain.gain.linearRampToValueAtTime(baseVol, now + thunderDelay + 3);
    }
  }

  protected teardownAudioGraph(): void {
    if (this.thunderInterval) {
      clearTimeout(this.thunderInterval);
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
