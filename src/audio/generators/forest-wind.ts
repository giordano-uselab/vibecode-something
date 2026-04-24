import type { SoundCategory } from '../../types';
import { BaseSoundGenerator } from '../base-generator';

/**
 * Forest Wind — wind moving through dense trees.
 *
 * Technique: Low bandpass noise for wind body with gentle sweep +
 * high-frequency filtered bursts for leaf texture. No rain.
 */
export class ForestWindGenerator extends BaseSoundGenerator {
  readonly id = 'forest-wind';
  readonly name = 'Forest Wind';
  readonly category: SoundCategory = 'basic';

  private windSource: AudioBufferSourceNode | null = null;
  private windFilter: BiquadFilterNode | null = null;
  private windGain: GainNode | null = null;
  private lfo: OscillatorNode | null = null;
  private lfoGain: GainNode | null = null;
  private rustleSource: AudioBufferSourceNode | null = null;
  private rustleFilter: BiquadFilterNode | null = null;
  private rustleGain: GainNode | null = null;
  private rustleLfo: OscillatorNode | null = null;
  private rustleLfoGain: GainNode | null = null;

  protected buildAudioGraph(ctx: AudioContext, output: GainNode): void {
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    // Wind body — low bandpass, airy, not rainy
    this.windSource = ctx.createBufferSource();
    this.windSource.buffer = buffer;
    this.windSource.loop = true;

    this.windFilter = ctx.createBiquadFilter();
    this.windFilter.type = 'lowpass';
    this.windFilter.frequency.value = 350;
    this.windFilter.Q.value = 0.3;

    this.windGain = ctx.createGain();
    this.windGain.gain.value = 0.10;

    this.lfo = ctx.createOscillator();
    this.lfo.type = 'sine';
    this.lfo.frequency.value = 0.06 + Math.random() * 0.03;
    this.lfoGain = ctx.createGain();
    this.lfoGain.gain.value = 120;
    this.lfo.connect(this.lfoGain);
    this.lfoGain.connect(this.windFilter.frequency);

    this.windSource.connect(this.windFilter);
    this.windFilter.connect(this.windGain);
    this.windGain.connect(output);
    this.startLoopingSource(this.windSource);
    this.lfo.start();

    // Leaf rustle layer — very soft highpass texture
    const rustleBuf = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const rustleData = rustleBuf.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      rustleData[i] = Math.random() * 2 - 1;
    }

    this.rustleSource = ctx.createBufferSource();
    this.rustleSource.buffer = rustleBuf;
    this.rustleSource.loop = true;

    this.rustleFilter = ctx.createBiquadFilter();
    this.rustleFilter.type = 'bandpass';
    this.rustleFilter.frequency.value = 6000;
    this.rustleFilter.Q.value = 0.3;

    this.rustleGain = ctx.createGain();
    this.rustleGain.gain.value = 0.015;

    this.rustleLfo = ctx.createOscillator();
    this.rustleLfo.type = 'sine';
    this.rustleLfo.frequency.value = 0.2 + Math.random() * 0.15;
    this.rustleLfoGain = ctx.createGain();
    this.rustleLfoGain.gain.value = 0.012;
    this.rustleLfo.connect(this.rustleLfoGain);
    this.rustleLfoGain.connect(this.rustleGain.gain);

    this.rustleSource.connect(this.rustleFilter);
    this.rustleFilter.connect(this.rustleGain);
    this.rustleGain.connect(output);
    this.startLoopingSource(this.rustleSource);
    this.rustleLfo.start();
  }

  protected teardownAudioGraph(): void {
    for (const osc of [this.lfo, this.rustleLfo]) {
      if (osc) { try { osc.stop(); } catch { /* ok */ } osc.disconnect(); }
    }
    this.lfo = null;
    this.rustleLfo = null;
    for (const g of [this.lfoGain, this.rustleLfoGain]) {
      if (g) g.disconnect();
    }
    this.lfoGain = null;
    this.rustleLfoGain = null;
    for (const src of [this.windSource, this.rustleSource]) {
      if (src) {
        src.onended = null;
        try { src.stop(); } catch { /* ok */ }
        src.disconnect();
      }
    }
    this.windSource = null;
    this.rustleSource = null;
    for (const node of [this.windFilter, this.windGain, this.rustleFilter, this.rustleGain]) {
      if (node) node.disconnect();
    }
    this.windFilter = null;
    this.windGain = null;
    this.rustleFilter = null;
    this.rustleGain = null;
  }
}
