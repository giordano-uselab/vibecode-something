import type { SoundCategory } from '../../types';
import { BaseSoundGenerator } from '../base-generator';

/**
 * Deep Space sound generator.
 *
 * Technique: Multiple low-frequency oscillators with slow detuning sweeps
 * layered with filtered noise for cosmic hum. Creates a vast, empty, immersive feel.
 */
export class DeepSpaceGenerator extends BaseSoundGenerator {
  readonly id = 'deep-space';
  readonly name = 'Deep Space';
  readonly category: SoundCategory = 'basic';

  private noiseSource: AudioBufferSourceNode | null = null;
  private lowpass: BiquadFilterNode | null = null;
  private noiseGain: GainNode | null = null;
  private drones: OscillatorNode[] = [];
  private droneGains: GainNode[] = [];
  private lfo: OscillatorNode | null = null;
  private lfoGain: GainNode | null = null;

  protected buildAudioGraph(ctx: AudioContext, output: GainNode): void {
    // Layer 1: Filtered noise — cosmic static
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    this.noiseSource = ctx.createBufferSource();
    this.noiseSource.buffer = buffer;
    this.noiseSource.loop = true;

    this.lowpass = ctx.createBiquadFilter();
    this.lowpass.type = 'lowpass';
    this.lowpass.frequency.value = 120;
    this.lowpass.Q.value = 0.7;

    this.noiseGain = ctx.createGain();
    this.noiseGain.gain.value = 0.15;

    this.noiseSource.connect(this.lowpass);
    this.lowpass.connect(this.noiseGain);
    this.noiseGain.connect(output);
    this.startLoopingSource(this.noiseSource);

    // Layer 2: Drone oscillators — deep tones with slow beating
    const droneFreqs = [40, 60, 80.5];
    for (const freq of droneFreqs) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.value = 0.04;
      osc.connect(gain);
      gain.connect(output);
      osc.start();
      this.drones.push(osc);
      this.droneGains.push(gain);
    }

    // LFO modulates the noise filter for slow pulsing
    this.lfo = ctx.createOscillator();
    this.lfo.type = 'sine';
    this.lfo.frequency.value = 0.03;
    this.lfoGain = ctx.createGain();
    this.lfoGain.gain.value = 50;
    this.lfo.connect(this.lfoGain);
    this.lfoGain.connect(this.lowpass.frequency);
    this.lfo.start();
  }

  protected teardownAudioGraph(): void {
    if (this.lfo) {
      try { this.lfo.stop(); } catch { /* already stopped */ }
      this.lfo.disconnect();
      this.lfo = null;
    }
    if (this.lfoGain) {
      this.lfoGain.disconnect();
      this.lfoGain = null;
    }
    for (const osc of this.drones) {
      try { osc.stop(); } catch { /* already stopped */ }
      osc.disconnect();
    }
    for (const gain of this.droneGains) {
      gain.disconnect();
    }
    this.drones = [];
    this.droneGains = [];
    if (this.noiseSource) {
      this.noiseSource.onended = null;
      try { this.noiseSource.stop(); } catch { /* already stopped */ }
      this.noiseSource.disconnect();
      this.noiseSource = null;
    }
    if (this.lowpass) {
      this.lowpass.disconnect();
      this.lowpass = null;
    }
    if (this.noiseGain) {
      this.noiseGain.disconnect();
      this.noiseGain = null;
    }
  }
}
