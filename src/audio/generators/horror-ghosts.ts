import type { SoundCategory } from '../../types';
import { BaseSoundGenerator } from '../base-generator';

/**
 * Horror Ghosts — eerie vocal synthesis.
 *
 * Klatt-style vocal tract model with low F0 sawtooth oscillators,
 * wide pitch drift, and formant resonators creating ghostly wailing voices.
 */
export class HorrorGhostsGenerator extends BaseSoundGenerator {
  readonly id = 'horror-ghosts';
  readonly name = 'Horror - Ghosts';
  readonly category: SoundCategory = 'basic';

  private bedSource: AudioBufferSourceNode | null = null;
  private bedFilter: BiquadFilterNode | null = null;
  private bedGain: GainNode | null = null;
  private voiceNodes: AudioNode[] = [];
  private stopped = false;
  private _timeouts: ReturnType<typeof setTimeout>[] = [];

  private static readonly VOICES = [
    { f0: 95,  f1: 270, f2: 730,  f3: 2300, gain: 0.030 },
    { f0: 110, f1: 310, f2: 820,  f3: 2500, gain: 0.028 },
    { f0: 125, f1: 350, f2: 950,  f3: 2700, gain: 0.026 },
    { f0: 140, f1: 370, f2: 1000, f3: 2650, gain: 0.025 },
    { f0: 195, f1: 400, f2: 1100, f3: 2800, gain: 0.022 },
    { f0: 220, f1: 450, f2: 1200, f3: 3000, gain: 0.020 },
    { f0: 245, f1: 500, f2: 1300, f3: 3200, gain: 0.018 },
    { f0: 170, f1: 380, f2: 1050, f3: 2750, gain: 0.024 },
  ];

  protected buildAudioGraph(ctx: AudioContext, output: GainNode): void {
    this.stopped = false;

    const bedBufSize = ctx.sampleRate * 2;
    const bedBuffer = this.createPinkNoiseBuffer(ctx, bedBufSize);
    this.bedSource = ctx.createBufferSource();
    this.bedSource.buffer = bedBuffer;
    this.bedSource.loop = true;

    this.bedFilter = ctx.createBiquadFilter();
    this.bedFilter.type = 'lowpass';
    this.bedFilter.frequency.value = 400;
    this.bedFilter.Q.value = 0.5;

    this.bedGain = ctx.createGain();
    this.bedGain.gain.value = 0.02;

    this.bedSource.connect(this.bedFilter);
    this.bedFilter.connect(this.bedGain);
    this.bedGain.connect(output);
    this.startLoopingSource(this.bedSource);

    for (const voice of HorrorGhostsGenerator.VOICES) {
      this.createVoiceStream(ctx, output, voice);
    }
  }

  private createVoiceStream(
    ctx: AudioContext,
    output: GainNode,
    voice: { f0: number; f1: number; f2: number; f3: number; gain: number }
  ): void {
    const glottal = ctx.createOscillator();
    glottal.type = 'sawtooth';
    glottal.frequency.value = voice.f0 + (Math.random() - 0.5) * 10;

    const glottalGain = ctx.createGain();
    glottalGain.gain.value = 0.4;

    const noiseBuf = this.createPinkNoiseBuffer(ctx, ctx.sampleRate * 4);
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuf;
    noiseSource.loop = true;
    noiseSource.playbackRate.value = 0.9 + Math.random() * 0.2;

    const noiseGain = ctx.createGain();
    noiseGain.gain.value = 0.6;

    const mixNode = ctx.createGain();
    mixNode.gain.value = 1.0;

    glottal.connect(glottalGain);
    glottalGain.connect(mixNode);
    noiseSource.connect(noiseGain);
    noiseGain.connect(mixNode);

    const r1 = ctx.createBiquadFilter();
    r1.type = 'bandpass';
    r1.frequency.value = voice.f1 + (Math.random() - 0.5) * 30;
    r1.Q.value = 6 + Math.random() * 3;

    const r2 = ctx.createBiquadFilter();
    r2.type = 'bandpass';
    r2.frequency.value = voice.f2 + (Math.random() - 0.5) * 50;
    r2.Q.value = 8 + Math.random() * 4;

    const r3 = ctx.createBiquadFilter();
    r3.type = 'bandpass';
    r3.frequency.value = voice.f3 + (Math.random() - 0.5) * 80;
    r3.Q.value = 10 + Math.random() * 4;

    const r1Gain = ctx.createGain();
    r1Gain.gain.value = 1.0;
    const r2Gain = ctx.createGain();
    r2Gain.gain.value = 0.5;
    const r3Gain = ctx.createGain();
    r3Gain.gain.value = 0.15;

    const formantSum = ctx.createGain();
    formantSum.gain.value = 1.0;

    mixNode.connect(r1);
    mixNode.connect(r2);
    mixNode.connect(r3);
    r1.connect(r1Gain);
    r2.connect(r2Gain);
    r3.connect(r3Gain);
    r1Gain.connect(formantSum);
    r2Gain.connect(formantSum);
    r3Gain.connect(formantSum);

    const voiceOut = ctx.createGain();
    voiceOut.gain.value = 0.0001;

    formantSum.connect(voiceOut);
    voiceOut.connect(output);

    this.startLoopingSource(noiseSource);
    glottal.start();

    this.driftF0(ctx, glottal, voice.f0);
    this.driftFormant(ctx, r1, voice.f1, 60);
    this.driftFormant(ctx, r2, voice.f2, 100);
    this.scheduleBursts(ctx, voiceOut, voice.gain);

    this.voiceNodes.push(
      glottal, glottalGain, noiseSource, noiseGain, mixNode,
      r1, r2, r3, r1Gain, r2Gain, r3Gain, formantSum, voiceOut
    );
  }

  private scheduleBursts(ctx: AudioContext, voiceOut: GainNode, maxGain: number): void {
    const schedule = () => {
      if (this.stopped) return;
      const now = ctx.currentTime;
      const speakDur = 1.5 + Math.random() * 2.5;

      voiceOut.gain.cancelScheduledValues(now);
      voiceOut.gain.setValueAtTime(0.0001, now);
      voiceOut.gain.linearRampToValueAtTime(maxGain, now + 0.12);

      const midPoint = now + speakDur * 0.5;
      const midGain = maxGain * (0.7 + Math.random() * 0.3);
      voiceOut.gain.linearRampToValueAtTime(midGain, midPoint);
      voiceOut.gain.linearRampToValueAtTime(maxGain * 0.8, now + speakDur - 0.12);
      voiceOut.gain.linearRampToValueAtTime(0.0001, now + speakDur);

      const pause = 500 + Math.random() * 2500;
      const t = setTimeout(schedule, (speakDur * 1000) + pause);
      this._timeouts.push(t);
    };
    const t = setTimeout(schedule, Math.random() * 3000);
    this._timeouts.push(t);
  }

  private driftF0(ctx: AudioContext, osc: OscillatorNode, baseF0: number): void {
    const schedule = () => {
      if (this.stopped) return;
      const now = ctx.currentTime;
      const nextF0 = baseF0 * (0.8 + Math.random() * 0.4);
      const rampTime = 0.3 + Math.random() * 1.5;
      osc.frequency.setValueAtTime(osc.frequency.value, now);
      osc.frequency.linearRampToValueAtTime(nextF0, now + rampTime);
      const nextSchedule = (rampTime + 0.2 + Math.random() * 0.8) * 1000;
      const t = setTimeout(schedule, nextSchedule);
      this._timeouts.push(t);
    };
    const t = setTimeout(schedule, 200 + Math.random() * 1000);
    this._timeouts.push(t);
  }

  private driftFormant(
    ctx: AudioContext,
    filter: BiquadFilterNode,
    baseFreq: number,
    range: number
  ): void {
    const schedule = () => {
      if (this.stopped) return;
      const now = ctx.currentTime;
      const nextFreq = baseFreq + (Math.random() - 0.5) * range * 2;
      const rampTime = 0.4 + Math.random() * 1.2;
      filter.frequency.setValueAtTime(filter.frequency.value, now);
      filter.frequency.linearRampToValueAtTime(Math.max(100, nextFreq), now + rampTime);
      const nextSchedule = (rampTime + 0.2 + Math.random() * 1) * 1000;
      const t = setTimeout(schedule, nextSchedule);
      this._timeouts.push(t);
    };
    const t = setTimeout(schedule, 400 + Math.random() * 1500);
    this._timeouts.push(t);
  }

  private createPinkNoiseBuffer(ctx: AudioContext, size: number): AudioBuffer {
    const buffer = ctx.createBuffer(1, size, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < size; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.969 * b2 + white * 0.153852;
      b3 = 0.8665 * b3 + white * 0.3104856;
      b4 = 0.55 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.016898;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }
    return buffer;
  }

  protected teardownAudioGraph(): void {
    this.stopped = true;
    for (const t of this._timeouts) clearTimeout(t);
    this._timeouts = [];
    if (this.bedSource) {
      this.bedSource.onended = null;
      try { this.bedSource.stop(); } catch { /* ok */ }
      this.bedSource.disconnect();
      this.bedSource = null;
    }
    if (this.bedFilter) { this.bedFilter.disconnect(); this.bedFilter = null; }
    if (this.bedGain) { this.bedGain.disconnect(); this.bedGain = null; }
    for (const node of this.voiceNodes) {
      try { (node as OscillatorNode).stop?.(); } catch { /* ok */ }
      try { (node as AudioBufferSourceNode).stop?.(); } catch { /* ok */ }
      node.disconnect();
    }
    this.voiceNodes = [];
  }
}
