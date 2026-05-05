import type { SoundCategory } from '../../types';
import { BaseSoundGenerator } from '../base-generator';

/**
 * Fire/crackling sound generator.
 *
 * Technique: White noise → bandpass (200-800Hz) + random short gain bursts
 * to simulate crackling + low-frequency rumble for the "body" of the fire.
 */
export class CracklingFireGenerator extends BaseSoundGenerator {
  readonly id = 'crackling-fire';
  readonly name = 'Crackling Fire';
  readonly category: SoundCategory = 'basic';

  private noiseSource: AudioBufferSourceNode | null = null;
  private bandpass: BiquadFilterNode | null = null;
  private crackleGain: GainNode | null = null;
  private rumbleSource: AudioBufferSourceNode | null = null;
  private rumbleFilter: BiquadFilterNode | null = null;
  private rumbleGain: GainNode | null = null;
  private crackleInterval: ReturnType<typeof setInterval> | null = null;

  protected buildAudioGraph(ctx: AudioContext, output: GainNode): void {
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    // Crackle layer: bandpass-filtered noise with random gain bursts
    this.noiseSource = ctx.createBufferSource();
    this.noiseSource.buffer = buffer;
    this.noiseSource.loop = true;

    this.bandpass = ctx.createBiquadFilter();
    this.bandpass.type = 'bandpass';
    this.bandpass.frequency.value = 500;
    this.bandpass.Q.value = 2;

    this.crackleGain = ctx.createGain();
    this.crackleGain.gain.value = 0.06;

    this.noiseSource.connect(this.bandpass);
    this.bandpass.connect(this.crackleGain);
    this.crackleGain.connect(output);

    // Rumble layer: low-frequency filtered noise
    this.rumbleSource = ctx.createBufferSource();
    this.rumbleSource.buffer = buffer;
    this.rumbleSource.loop = true;

    this.rumbleFilter = ctx.createBiquadFilter();
    this.rumbleFilter.type = 'lowpass';
    this.rumbleFilter.frequency.value = 150;

    this.rumbleGain = ctx.createGain();
    this.rumbleGain.gain.value = 0.08;

    this.rumbleSource.connect(this.rumbleFilter);
    this.rumbleFilter.connect(this.rumbleGain);
    this.rumbleGain.connect(output);

    this.startLoopingSource(this.noiseSource);
    this.startLoopingSource(this.rumbleSource);

    // Random crackle bursts
    this.crackleInterval = setInterval(() => {
      if (this.crackleGain && ctx.state === 'running') {
        const burst = 0.1 + Math.random() * 0.15;
        this.crackleGain.gain.setValueAtTime(burst, ctx.currentTime);
        this.crackleGain.gain.linearRampToValueAtTime(
          0.06,
          ctx.currentTime + 0.05 + Math.random() * 0.1,
        );
      }
    }, 50 + Math.random() * 150);
  }

  protected teardownAudioGraph(): void {
    if (this.crackleInterval) {
      clearInterval(this.crackleInterval);
      this.crackleInterval = null;
    }
    for (const source of [this.noiseSource, this.rumbleSource]) {
      if (source) {
        source.onended = null;
        try { source.stop(); } catch { /* already stopped */ }
        source.disconnect();
      }
    }
    this.noiseSource = null;
    this.rumbleSource = null;

    for (const node of [this.bandpass, this.rumbleFilter, this.crackleGain, this.rumbleGain]) {
      if (node) node.disconnect();
    }
    this.bandpass = null;
    this.rumbleFilter = null;
    this.crackleGain = null;
    this.rumbleGain = null;
  }
}
