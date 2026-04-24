import type { SoundCategory } from '../../types';
import { BaseSoundGenerator } from '../base-generator';

/**
 * Heavy Downpour — intense, dense rain with low rumble.
 *
 * Technique: Broadband noise with moderate bandpass + boosted low-end
 * rumble layer for the weight of heavy rain hitting surfaces.
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

  protected buildAudioGraph(ctx: AudioContext, output: GainNode): void {
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    // Main rain layer — wide bandpass
    this.noiseSource = ctx.createBufferSource();
    this.noiseSource.buffer = buffer;
    this.noiseSource.loop = true;

    this.bandpass = ctx.createBiquadFilter();
    this.bandpass.type = 'bandpass';
    this.bandpass.frequency.value = 2000;
    this.bandpass.Q.value = 0.3;

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
    this.rumbleFilter.frequency.value = 200;

    this.rumbleGain = ctx.createGain();
    this.rumbleGain.gain.value = 0.12;

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
  }

  protected teardownAudioGraph(): void {
    if (this.intensityLfo) {
      try { this.intensityLfo.stop(); } catch { /* already stopped */ }
      this.intensityLfo.disconnect();
      this.intensityLfo = null;
    }
    if (this.intensityLfoGain) {
      this.intensityLfoGain.disconnect();
      this.intensityLfoGain = null;
    }
    for (const src of [this.noiseSource, this.rumbleSource]) {
      if (src) {
        src.onended = null;
        try { src.stop(); } catch { /* already stopped */ }
        src.disconnect();
      }
    }
    this.noiseSource = null;
    this.rumbleSource = null;
    for (const node of [this.bandpass, this.mainGain, this.rumbleFilter, this.rumbleGain]) {
      if (node) node.disconnect();
    }
    this.bandpass = null;
    this.mainGain = null;
    this.rumbleFilter = null;
    this.rumbleGain = null;
  }
}
