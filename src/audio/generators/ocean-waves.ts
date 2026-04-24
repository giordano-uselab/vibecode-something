import type { SoundCategory } from '../../types';
import { BaseSoundGenerator } from '../base-generator';

/**
 * Ocean Waves — rhythmic shoreline waves.
 *
 * Technique: Noise through lowpass with slow gain envelope cycling
 * to simulate wave approach, crash, and retreat.
 */
export class OceanWavesGenerator extends BaseSoundGenerator {
  readonly id = 'ocean-waves';
  readonly name = 'Ocean Waves';
  readonly category: SoundCategory = 'basic';

  private noiseSource: AudioBufferSourceNode | null = null;
  private lowpass: BiquadFilterNode | null = null;
  private waveGain: GainNode | null = null;
  private foamSource: AudioBufferSourceNode | null = null;
  private foamFilter: BiquadFilterNode | null = null;
  private foamGain: GainNode | null = null;
  private waveInterval: ReturnType<typeof setInterval> | null = null;

  protected buildAudioGraph(ctx: AudioContext, output: GainNode): void {
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    // Main wave body — lowpassed noise
    this.noiseSource = ctx.createBufferSource();
    this.noiseSource.buffer = buffer;
    this.noiseSource.loop = true;

    this.lowpass = ctx.createBiquadFilter();
    this.lowpass.type = 'lowpass';
    this.lowpass.frequency.value = 600;

    this.waveGain = ctx.createGain();
    this.waveGain.gain.value = 0.08;

    this.noiseSource.connect(this.lowpass);
    this.lowpass.connect(this.waveGain);
    this.waveGain.connect(output);
    this.startLoopingSource(this.noiseSource);

    // Foam / wash layer — highpass noise
    const foamBuf = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const foamData = foamBuf.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      foamData[i] = Math.random() * 2 - 1;
    }

    this.foamSource = ctx.createBufferSource();
    this.foamSource.buffer = foamBuf;
    this.foamSource.loop = true;

    this.foamFilter = ctx.createBiquadFilter();
    this.foamFilter.type = 'highpass';
    this.foamFilter.frequency.value = 3000;

    this.foamGain = ctx.createGain();
    this.foamGain.gain.value = 0.02;

    this.foamSource.connect(this.foamFilter);
    this.foamFilter.connect(this.foamGain);
    this.foamGain.connect(output);
    this.startLoopingSource(this.foamSource);

    // Wave cycle — rhythmic volume swell every 6–10 seconds
    this.scheduleWave(ctx);
    this.waveInterval = setInterval(() => {
      if (ctx.state !== 'running') return;
      this.scheduleWave(ctx);
    }, 6000 + Math.random() * 4000);
  }

  private scheduleWave(ctx: AudioContext): void {
    if (!this.waveGain || !this.foamGain) return;
    const now = ctx.currentTime;
    const riseDuration = 2 + Math.random() * 1.5;
    const peakVol = 0.18 + Math.random() * 0.08;
    const fallDuration = 3 + Math.random() * 2;

    // Wave body swell
    this.waveGain.gain.setValueAtTime(0.08, now);
    this.waveGain.gain.linearRampToValueAtTime(peakVol, now + riseDuration);
    this.waveGain.gain.linearRampToValueAtTime(0.08, now + riseDuration + fallDuration);

    // Foam swell (delayed, shorter)
    this.foamGain.gain.setValueAtTime(0.02, now + riseDuration * 0.7);
    this.foamGain.gain.linearRampToValueAtTime(0.06, now + riseDuration);
    this.foamGain.gain.linearRampToValueAtTime(0.02, now + riseDuration + fallDuration * 0.6);
  }

  protected teardownAudioGraph(): void {
    if (this.waveInterval) { clearInterval(this.waveInterval); this.waveInterval = null; }
    for (const src of [this.noiseSource, this.foamSource]) {
      if (src) { src.onended = null; try { src.stop(); } catch { /* ok */ } src.disconnect(); }
    }
    this.noiseSource = null;
    this.foamSource = null;
    for (const node of [this.lowpass, this.waveGain, this.foamFilter, this.foamGain]) {
      if (node) node.disconnect();
    }
    this.lowpass = null;
    this.waveGain = null;
    this.foamFilter = null;
    this.foamGain = null;
  }
}
