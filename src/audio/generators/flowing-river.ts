import type { SoundCategory } from '../../types';
import { BaseSoundGenerator } from '../base-generator';

/**
 * Flowing River — continuous water over rocks.
 *
 * Technique: Bandpass noise (500–3000Hz) with slow modulation for
 * current variation + higher-frequency splash detail.
 */
export class FlowingRiverGenerator extends BaseSoundGenerator {
  readonly id = 'flowing-river';
  readonly name = 'Flowing River';
  readonly category: SoundCategory = 'basic';

  private noiseSource: AudioBufferSourceNode | null = null;
  private bandpass: BiquadFilterNode | null = null;
  private mainGain: GainNode | null = null;
  private splashSource: AudioBufferSourceNode | null = null;
  private splashFilter: BiquadFilterNode | null = null;
  private splashGain: GainNode | null = null;
  private lfo: OscillatorNode | null = null;
  private lfoGain: GainNode | null = null;

  protected buildAudioGraph(ctx: AudioContext, output: GainNode): void {
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    // Main flow
    this.noiseSource = ctx.createBufferSource();
    this.noiseSource.buffer = buffer;
    this.noiseSource.loop = true;

    this.bandpass = ctx.createBiquadFilter();
    this.bandpass.type = 'bandpass';
    this.bandpass.frequency.value = 1500;
    this.bandpass.Q.value = 0.4;

    this.mainGain = ctx.createGain();
    this.mainGain.gain.value = 0.14;

    this.lfo = ctx.createOscillator();
    this.lfo.type = 'sine';
    this.lfo.frequency.value = 0.06;
    this.lfoGain = ctx.createGain();
    this.lfoGain.gain.value = 400;
    this.lfo.connect(this.lfoGain);
    this.lfoGain.connect(this.bandpass.frequency);

    this.noiseSource.connect(this.bandpass);
    this.bandpass.connect(this.mainGain);
    this.mainGain.connect(output);
    this.startLoopingSource(this.noiseSource);
    this.lfo.start();

    // Splash detail layer
    const splashBuf = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const splashData = splashBuf.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      splashData[i] = Math.random() * 2 - 1;
    }

    this.splashSource = ctx.createBufferSource();
    this.splashSource.buffer = splashBuf;
    this.splashSource.loop = true;

    this.splashFilter = ctx.createBiquadFilter();
    this.splashFilter.type = 'highpass';
    this.splashFilter.frequency.value = 4000;

    this.splashGain = ctx.createGain();
    this.splashGain.gain.value = 0.04;

    this.splashSource.connect(this.splashFilter);
    this.splashFilter.connect(this.splashGain);
    this.splashGain.connect(output);
    this.startLoopingSource(this.splashSource);
  }

  protected teardownAudioGraph(): void {
    if (this.lfo) { try { this.lfo.stop(); } catch { /* ok */ } this.lfo.disconnect(); this.lfo = null; }
    if (this.lfoGain) { this.lfoGain.disconnect(); this.lfoGain = null; }
    for (const src of [this.noiseSource, this.splashSource]) {
      if (src) { src.onended = null; try { src.stop(); } catch { /* ok */ } src.disconnect(); }
    }
    this.noiseSource = null;
    this.splashSource = null;
    for (const node of [this.bandpass, this.mainGain, this.splashFilter, this.splashGain]) {
      if (node) node.disconnect();
    }
    this.bandpass = null;
    this.mainGain = null;
    this.splashFilter = null;
    this.splashGain = null;
  }
}
