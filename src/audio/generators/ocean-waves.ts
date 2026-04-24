import type { SoundCategory } from '../../types';
import { BaseSoundGenerator } from '../base-generator';

/**
 * Ocean Waves — rhythmic shoreline waves with crash and retreat.
 *
 * Technique: Noise through lowpass with pronounced gain/filter envelope
 * cycling on a steady cadence. Each wave: approach (swell), crash
 * (highpass burst), retreat (gentle fade). Overlapping waves for
 * continuous rhythm.
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
  private waveTimeout: ReturnType<typeof setTimeout> | null = null;
  private stopped = false;

  protected buildAudioGraph(ctx: AudioContext, output: GainNode): void {
    const bufferSize = ctx.sampleRate * 4;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    // Main wave body — lowpassed noise (constant base)
    this.noiseSource = ctx.createBufferSource();
    this.noiseSource.buffer = buffer;
    this.noiseSource.loop = true;

    this.lowpass = ctx.createBiquadFilter();
    this.lowpass.type = 'lowpass';
    this.lowpass.frequency.value = 400;

    this.waveGain = ctx.createGain();
    this.waveGain.gain.value = 0.05;

    this.noiseSource.connect(this.lowpass);
    this.lowpass.connect(this.waveGain);
    this.waveGain.connect(output);
    this.startLoopingSource(this.noiseSource);

    // Foam / wash layer — higher noise for crash texture
    const foamBuf = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const foamData = foamBuf.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      foamData[i] = Math.random() * 2 - 1;
    }

    this.foamSource = ctx.createBufferSource();
    this.foamSource.buffer = foamBuf;
    this.foamSource.loop = true;

    this.foamFilter = ctx.createBiquadFilter();
    this.foamFilter.type = 'bandpass';
    this.foamFilter.frequency.value = 2000;
    this.foamFilter.Q.value = 0.3;

    this.foamGain = ctx.createGain();
    this.foamGain.gain.value = 0.01;

    this.foamSource.connect(this.foamFilter);
    this.foamFilter.connect(this.foamGain);
    this.foamGain.connect(output);
    this.startLoopingSource(this.foamSource);

    // Start rhythmic wave cycle
    this.stopped = false;
    this.scheduleWave(ctx);
  }

  private scheduleWave(ctx: AudioContext): void {
    if (this.stopped) return;

    this.playWaveCycle(ctx);

    // Next wave in 7–10 seconds (steady cadence with slight variation)
    const nextWave = 7000 + Math.random() * 3000;
    this.waveTimeout = setTimeout(() => {
      if (!this.stopped && ctx.state === 'running') {
        this.scheduleWave(ctx);
      }
    }, nextWave);
  }

  private playWaveCycle(ctx: AudioContext): void {
    if (!this.waveGain || !this.foamGain || !this.lowpass) return;

    const now = ctx.currentTime;
    const riseDuration = 2.5 + Math.random() * 1.0;
    const peakVol = 0.28 + Math.random() * 0.1;
    const crashDuration = 0.4 + Math.random() * 0.2;
    const retreatDuration = 3.5 + Math.random() * 1.5;

    // --- Wave approach: slow swell ---
    this.waveGain.gain.cancelScheduledValues(now);
    this.waveGain.gain.setValueAtTime(0.05, now);
    this.waveGain.gain.linearRampToValueAtTime(peakVol, now + riseDuration);

    // Filter opens as wave approaches (more presence)
    this.lowpass.frequency.cancelScheduledValues(now);
    this.lowpass.frequency.setValueAtTime(400, now);
    this.lowpass.frequency.linearRampToValueAtTime(1200, now + riseDuration);

    // --- Wave crash: brief intense peak ---
    this.waveGain.gain.linearRampToValueAtTime(peakVol * 1.2, now + riseDuration + crashDuration * 0.3);
    this.lowpass.frequency.linearRampToValueAtTime(2000, now + riseDuration + crashDuration * 0.3);

    // --- Wave retreat: gentle fade ---
    this.waveGain.gain.linearRampToValueAtTime(0.05, now + riseDuration + crashDuration + retreatDuration);
    this.lowpass.frequency.linearRampToValueAtTime(400, now + riseDuration + crashDuration + retreatDuration);

    // Foam: surge at crash, then fizz out
    this.foamGain.gain.cancelScheduledValues(now);
    this.foamGain.gain.setValueAtTime(0.01, now);
    this.foamGain.gain.setValueAtTime(0.01, now + riseDuration * 0.8);
    this.foamGain.gain.linearRampToValueAtTime(0.08, now + riseDuration + crashDuration * 0.5);
    this.foamGain.gain.linearRampToValueAtTime(0.01, now + riseDuration + crashDuration + retreatDuration * 0.5);
  }

  protected teardownAudioGraph(): void {
    this.stopped = true;
    if (this.waveTimeout) { clearTimeout(this.waveTimeout); this.waveTimeout = null; }
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
