import type { SoundCategory } from '../../types';
import { BaseSoundGenerator } from '../base-generator';

/**
 * Deep Water sound generator.
 *
 * Technique: Brown noise (random walk) with heavy lowpass for submerged feel,
 * plus slow filtered noise modulation for underwater current movement.
 */
export class DeepWaterGenerator extends BaseSoundGenerator {
  readonly id = 'deep-water';
  readonly name = 'Deep Water';
  readonly category: SoundCategory = 'basic';

  private source: AudioBufferSourceNode | null = null;
  private lowpass: BiquadFilterNode | null = null;
  private bubbleSource: AudioBufferSourceNode | null = null;
  private bubbleFilter: BiquadFilterNode | null = null;
  private bubbleGain: GainNode | null = null;
  private lfo: OscillatorNode | null = null;
  private lfoGain: GainNode | null = null;

  protected buildAudioGraph(ctx: AudioContext, output: GainNode): void {
    // Layer 1: Deep brown noise — submerged pressure
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      lastOut = (lastOut + 0.02 * white) / 1.02;
      data[i] = lastOut * 3.5;
    }

    this.source = ctx.createBufferSource();
    this.source.buffer = buffer;
    this.source.loop = true;

    this.lowpass = ctx.createBiquadFilter();
    this.lowpass.type = 'lowpass';
    this.lowpass.frequency.value = 180;
    this.lowpass.Q.value = 0.5;

    this.source.connect(this.lowpass);
    this.lowpass.connect(output);
    this.startLoopingSource(this.source);

    // LFO on the lowpass for slow current movement
    this.lfo = ctx.createOscillator();
    this.lfo.type = 'sine';
    this.lfo.frequency.value = 0.05;
    this.lfoGain = ctx.createGain();
    this.lfoGain.gain.value = 60;
    this.lfo.connect(this.lfoGain);
    this.lfoGain.connect(this.lowpass.frequency);
    this.lfo.start();

    // Layer 2: Occasional muffled bubble texture
    const bubbleBuf = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const bubbleData = bubbleBuf.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      bubbleData[i] = Math.random() * 2 - 1;
    }

    this.bubbleSource = ctx.createBufferSource();
    this.bubbleSource.buffer = bubbleBuf;
    this.bubbleSource.loop = true;

    this.bubbleFilter = ctx.createBiquadFilter();
    this.bubbleFilter.type = 'bandpass';
    this.bubbleFilter.frequency.value = 300;
    this.bubbleFilter.Q.value = 5;

    this.bubbleGain = ctx.createGain();
    this.bubbleGain.gain.value = 0.02;

    this.bubbleSource.connect(this.bubbleFilter);
    this.bubbleFilter.connect(this.bubbleGain);
    this.bubbleGain.connect(output);
    this.startLoopingSource(this.bubbleSource);
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
    for (const src of [this.source, this.bubbleSource]) {
      if (src) {
        src.onended = null;
        try { src.stop(); } catch { /* already stopped */ }
        src.disconnect();
      }
    }
    this.source = null;
    this.bubbleSource = null;
    for (const node of [this.lowpass, this.bubbleFilter, this.bubbleGain]) {
      if (node) node.disconnect();
    }
    this.lowpass = null;
    this.bubbleFilter = null;
    this.bubbleGain = null;
  }
}
