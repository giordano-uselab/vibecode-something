import type { SoundCategory } from '../../types';
import { BaseSoundGenerator } from '../base-generator';

/**
 * Heavy Downpour — intense, dense rain with low rumble.
 *
 * Technique: Broadband noise with lower-frequency bandpass for heavy rain,
 * boosted low-end rumble layer, and intermittent background thunder
 * that randomly fades in and out for natural variation.
 */
export class HeavyDownpourGenerator extends BaseSoundGenerator {
  readonly id = 'heavy-downpour';
  readonly name = 'Heavy Downpour';
  readonly category: SoundCategory = 'basic';

  private noiseSource: AudioBufferSourceNode | null = null;
  private bandpass: BiquadFilterNode | null = null;
  private mainGain: GainNode | null = null;
  private rumbleSource: AudioBufferSourceNode | null = null;
  private rumbleFilter: BiquadFilterNode | null = null;
  private rumbleGain: GainNode | null = null;
  private intensityLfo: OscillatorNode | null = null;
  private intensityLfoGain: GainNode | null = null;
  private thunderSource: AudioBufferSourceNode | null = null;
  private thunderFilter: BiquadFilterNode | null = null;
  private thunderGain: GainNode | null = null;
  private thunderTimeout: ReturnType<typeof setTimeout> | null = null;

  protected buildAudioGraph(ctx: AudioContext, output: GainNode): void {
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    // Main rain layer — lower frequency bandpass for heavier rain character
    this.noiseSource = ctx.createBufferSource();
    this.noiseSource.buffer = buffer;
    this.noiseSource.loop = true;

    this.bandpass = ctx.createBiquadFilter();
    this.bandpass.type = 'bandpass';
    this.bandpass.frequency.value = 600;
    this.bandpass.Q.value = 0.2;

    this.mainGain = ctx.createGain();
    this.mainGain.gain.value = 0.25;

    this.noiseSource.connect(this.bandpass);
    this.bandpass.connect(this.mainGain);
    this.mainGain.connect(output);
    this.startLoopingSource(this.noiseSource);

    // Low rumble layer
    this.rumbleSource = ctx.createBufferSource();
    this.rumbleSource.buffer = buffer;
    this.rumbleSource.loop = true;

    this.rumbleFilter = ctx.createBiquadFilter();
    this.rumbleFilter.type = 'lowpass';
    this.rumbleFilter.frequency.value = 150;

    this.rumbleGain = ctx.createGain();
    this.rumbleGain.gain.value = 0.14;

    this.rumbleSource.connect(this.rumbleFilter);
    this.rumbleFilter.connect(this.rumbleGain);
    this.rumbleGain.connect(output);
    this.startLoopingSource(this.rumbleSource);

    // Slow intensity variation
    this.intensityLfo = ctx.createOscillator();
    this.intensityLfo.type = 'sine';
    this.intensityLfo.frequency.value = 0.1;
    this.intensityLfoGain = ctx.createGain();
    this.intensityLfoGain.gain.value = 0.06;
    this.intensityLfo.connect(this.intensityLfoGain);
    this.intensityLfoGain.connect(this.mainGain.gain);
    this.intensityLfo.start();

    // Background thunder — intermittent, sometimes silent
    const thunderBuf = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const tData = thunderBuf.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      tData[i] = Math.random() * 2 - 1;
    }

    this.thunderSource = ctx.createBufferSource();
    this.thunderSource.buffer = thunderBuf;
    this.thunderSource.loop = true;

    this.thunderFilter = ctx.createBiquadFilter();
    this.thunderFilter.type = 'lowpass';
    this.thunderFilter.frequency.value = 80;

    this.thunderGain = ctx.createGain();
    this.thunderGain.gain.value = 0;

    this.thunderSource.connect(this.thunderFilter);
    this.thunderFilter.connect(this.thunderGain);
    this.thunderGain.connect(output);
    this.startLoopingSource(this.thunderSource);

    this.scheduleThunderCycle(ctx);
  }

  private scheduleThunderCycle(ctx: AudioContext): void {
    if (!this.thunderGain) return;

    const now = ctx.currentTime;
    const silent = Math.random() < 0.4; // 40% chance of silence

    if (silent) {
      // Stay silent for 5-15 seconds
      this.thunderGain.gain.setValueAtTime(0, now);
      const silenceDuration = 5000 + Math.random() * 10000;
      this.thunderTimeout = setTimeout(() => this.scheduleThunderCycle(ctx), silenceDuration);
    } else {
      // Fade in thunder rumble, hold, then fade out
      const volume = 0.06 + Math.random() * 0.06;
      const fadeIn = 1.5 + Math.random() * 2;
      const hold = 3 + Math.random() * 6;
      const fadeOut = 2 + Math.random() * 3;
      this.thunderGain.gain.setValueAtTime(0, now);
      this.thunderGain.gain.linearRampToValueAtTime(volume, now + fadeIn);
      this.thunderGain.gain.setValueAtTime(volume, now + fadeIn + hold);
      this.thunderGain.gain.linearRampToValueAtTime(0, now + fadeIn + hold + fadeOut);
      const totalMs = (fadeIn + hold + fadeOut) * 1000 + 500;
      this.thunderTimeout = setTimeout(() => this.scheduleThunderCycle(ctx), totalMs);
    }
  }

  protected teardownAudioGraph(): void {
    if (this.thunderTimeout) {
      clearTimeout(this.thunderTimeout);
      this.thunderTimeout = null;
    }
    if (this.intensityLfo) {
      try { this.intensityLfo.stop(); } catch { /* already stopped */ }
      this.intensityLfo.disconnect();
      this.intensityLfo = null;
    }
    if (this.intensityLfoGain) {
      this.intensityLfoGain.disconnect();
      this.intensityLfoGain = null;
    }
    for (const src of [this.noiseSource, this.rumbleSource, this.thunderSource]) {
      if (src) {
        src.onended = null;
        try { src.stop(); } catch { /* already stopped */ }
        src.disconnect();
      }
    }
    this.noiseSource = null;
    this.rumbleSource = null;
    this.thunderSource = null;
    for (const node of [this.bandpass, this.mainGain, this.rumbleFilter, this.rumbleGain, this.thunderFilter, this.thunderGain]) {
      if (node) node.disconnect();
    }
    this.bandpass = null;
    this.mainGain = null;
    this.rumbleFilter = null;
    this.rumbleGain = null;
    this.thunderFilter = null;
    this.thunderGain = null;
  }
}
