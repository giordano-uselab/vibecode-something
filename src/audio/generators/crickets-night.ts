import type { SoundCategory } from '../../types';
import { BaseSoundGenerator } from '../base-generator';

/**
 * Crickets & Night — evening insects in a calm night.
 *
 * Technique: AM-modulated high-frequency sine for cricket chirps
 * at different rates + very soft lowpass noise for night ambience.
 */
export class CricketsNightGenerator extends BaseSoundGenerator {
  readonly id = 'crickets-night';
  readonly name = 'Crickets & Night';
  readonly category: SoundCategory = 'basic';

  private cricketOsc1: OscillatorNode | null = null;
  private cricketLfo1: OscillatorNode | null = null;
  private cricketGain1: GainNode | null = null;
  private cricketAmGain1: GainNode | null = null;
  private cricketOsc2: OscillatorNode | null = null;
  private cricketLfo2: OscillatorNode | null = null;
  private cricketGain2: GainNode | null = null;
  private cricketAmGain2: GainNode | null = null;
  private nightSource: AudioBufferSourceNode | null = null;
  private nightFilter: BiquadFilterNode | null = null;
  private nightGain: GainNode | null = null;

  protected buildAudioGraph(ctx: AudioContext, output: GainNode): void {
    // Cricket 1 — faster chirp
    this.cricketOsc1 = ctx.createOscillator();
    this.cricketOsc1.type = 'sine';
    this.cricketOsc1.frequency.value = 5800;

    this.cricketLfo1 = ctx.createOscillator();
    this.cricketLfo1.type = 'square';
    this.cricketLfo1.frequency.value = 14;

    this.cricketAmGain1 = ctx.createGain();
    this.cricketAmGain1.gain.value = 1;
    this.cricketGain1 = ctx.createGain();
    this.cricketGain1.gain.value = 0;

    this.cricketLfo1.connect(this.cricketAmGain1);
    this.cricketAmGain1.connect(this.cricketGain1.gain);

    const out1 = ctx.createGain();
    out1.gain.value = 0.01;
    this.cricketOsc1.connect(this.cricketGain1);
    this.cricketGain1.connect(out1);
    out1.connect(output);

    this.cricketOsc1.start();
    this.cricketLfo1.start();

    // Cricket 2 — slower, slightly different pitch
    this.cricketOsc2 = ctx.createOscillator();
    this.cricketOsc2.type = 'sine';
    this.cricketOsc2.frequency.value = 4800;

    this.cricketLfo2 = ctx.createOscillator();
    this.cricketLfo2.type = 'square';
    this.cricketLfo2.frequency.value = 10;

    this.cricketAmGain2 = ctx.createGain();
    this.cricketAmGain2.gain.value = 1;
    this.cricketGain2 = ctx.createGain();
    this.cricketGain2.gain.value = 0;

    this.cricketLfo2.connect(this.cricketAmGain2);
    this.cricketAmGain2.connect(this.cricketGain2.gain);

    const out2 = ctx.createGain();
    out2.gain.value = 0.008;
    this.cricketOsc2.connect(this.cricketGain2);
    this.cricketGain2.connect(out2);
    out2.connect(output);

    this.cricketOsc2.start();
    this.cricketLfo2.start();

    // Night ambience — very soft lowpass noise
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    this.nightSource = ctx.createBufferSource();
    this.nightSource.buffer = buffer;
    this.nightSource.loop = true;

    this.nightFilter = ctx.createBiquadFilter();
    this.nightFilter.type = 'lowpass';
    this.nightFilter.frequency.value = 300;

    this.nightGain = ctx.createGain();
    this.nightGain.gain.value = 0.03;

    this.nightSource.connect(this.nightFilter);
    this.nightFilter.connect(this.nightGain);
    this.nightGain.connect(output);
    this.startLoopingSource(this.nightSource);
  }

  protected teardownAudioGraph(): void {
    for (const osc of [this.cricketOsc1, this.cricketLfo1, this.cricketOsc2, this.cricketLfo2]) {
      if (osc) { try { osc.stop(); } catch { /* ok */ } osc.disconnect(); }
    }
    this.cricketOsc1 = null;
    this.cricketLfo1 = null;
    this.cricketOsc2 = null;
    this.cricketLfo2 = null;
    for (const g of [this.cricketGain1, this.cricketAmGain1, this.cricketGain2, this.cricketAmGain2]) {
      if (g) g.disconnect();
    }
    this.cricketGain1 = null;
    this.cricketAmGain1 = null;
    this.cricketGain2 = null;
    this.cricketAmGain2 = null;
    if (this.nightSource) {
      this.nightSource.onended = null;
      try { this.nightSource.stop(); } catch { /* ok */ }
      this.nightSource.disconnect();
      this.nightSource = null;
    }
    if (this.nightFilter) { this.nightFilter.disconnect(); this.nightFilter = null; }
    if (this.nightGain) { this.nightGain.disconnect(); this.nightGain = null; }
  }
}
