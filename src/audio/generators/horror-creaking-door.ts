import type { SoundCategory } from '../../types';
import { BaseSoundGenerator } from '../base-generator';

/**
 * Creaking Door v2 — stick-slip friction model.
 *
 * A creak is NOT just filtered noise — it's friction.
 * Model: noise amplitude-modulated by a low-frequency oscillator (the "judder")
 * to create the stuttering stick-slip effect. The judder frequency sweeps as
 * the door accelerates/decelerates. Multiple bandpasses at wood/hinge resonances.
 * Waveshaping adds grit. Continuous low wood-stress bed fills gaps.
 */
export class CreakingDoorGenerator extends BaseSoundGenerator {
  readonly id = 'creaking-door';
  readonly name = 'Horror - Creaking Door';
  readonly category: SoundCategory = 'basic';

  private nodes: AudioNode[] = [];
  private stopped = false;
  private _timeouts: ReturnType<typeof setTimeout>[] = [];

  protected buildAudioGraph(ctx: AudioContext, output: GainNode): void {
    this.stopped = false;

    // Continuous low stress/strain bed — wood under pressure
    this.createStressBed(ctx, output);

    this.scheduleCreaks(ctx, output);
  }

  /**
   * Very low, quiet noise filtered to sound like wood creaking under weight.
   */
  private createStressBed(ctx: AudioContext, output: GainNode): void {
    const bufLen = ctx.sampleRate * 4;
    const buf = this.createNoiseBuffer(ctx, bufLen);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;

    // Wood resonance band
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 300;
    bp.Q.value = 2;

    // Slow tremolo = subtle creaking pressure
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.3 + Math.random() * 0.4;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.004;

    const baseGain = ctx.createGain();
    baseGain.gain.value = 0.006;

    src.connect(bp);
    bp.connect(baseGain);
    lfo.connect(lfoGain);
    lfoGain.connect(baseGain.gain);
    baseGain.connect(output);

    this.startLoopingSource(src);
    lfo.start();

    this.nodes.push(src, bp, lfo, lfoGain, baseGain);
  }

  private scheduleCreaks(ctx: AudioContext, output: GainNode): void {
    const schedule = () => {
      if (this.stopped) return;

      this.playCreak(ctx, output);

      // 5-14s between creaks
      const pause = 5000 + Math.random() * 9000;
      const t = setTimeout(schedule, pause);
      this._timeouts.push(t);
    };

    const t = setTimeout(schedule, 1500 + Math.random() * 2000);
    this._timeouts.push(t);
  }

  private playCreak(ctx: AudioContext, output: GainNode): void {
    if (this.stopped) return;
    const now = ctx.currentTime;
    const dur = 1.5 + Math.random() * 2.5; // 1.5-4s creak
    const ascending = Math.random() > 0.3;

    // Noise source
    const noiseBuf = this.createNoiseBuffer(ctx, Math.ceil(ctx.sampleRate * (dur + 1)));
    const noiseSrc = ctx.createBufferSource();
    noiseSrc.buffer = noiseBuf;

    // === Stick-slip judder: AM the noise with a low-freq oscillator ===
    // This creates the rhythmic "eee-eee-eee" stutter of friction
    const judder = ctx.createOscillator();
    judder.type = 'square'; // sharp on/off = friction stick-slip
    // Judder rate sweeps: door starts slow, speeds up, slows down
    const judderStart = 4 + Math.random() * 4;
    const judderMid = 10 + Math.random() * 10;
    judder.frequency.setValueAtTime(judderStart, now);
    judder.frequency.linearRampToValueAtTime(judderMid, now + dur * 0.4);
    judder.frequency.linearRampToValueAtTime(judderStart * 0.5, now + dur);

    // Waveshaping to soften the square into a pulsing shape
    const judderShape = ctx.createWaveShaper();
    const curve = new Float32Array(256);
    for (let i = 0; i < 256; i++) {
      const x = (i / 128) - 1;
      curve[i] = Math.tanh(x * 2) * 0.5 + 0.5; // 0-1 range, soft edges
    }
    judderShape.curve = curve;

    const judderGain = ctx.createGain();
    judderGain.gain.value = 0;

    judder.connect(judderShape);
    judderShape.connect(judderGain.gain);

    // === Resonances: wood body + hinge ===
    const freqBase = ascending ? 250 + Math.random() * 150 : 600 + Math.random() * 200;
    const freqEnd = ascending ? 600 + Math.random() * 300 : 180 + Math.random() * 80;

    // Wood body resonance (wider Q = more audible)
    const bp1 = ctx.createBiquadFilter();
    bp1.type = 'bandpass';
    bp1.Q.value = 6 + Math.random() * 6; // moderate Q — audible but tonal
    bp1.frequency.setValueAtTime(freqBase, now);
    bp1.frequency.exponentialRampToValueAtTime(freqEnd, now + dur);

    // Higher wood harmonic
    const bp2 = ctx.createBiquadFilter();
    bp2.type = 'bandpass';
    bp2.Q.value = 8 + Math.random() * 6;
    bp2.frequency.setValueAtTime(freqBase * 2.2, now);
    bp2.frequency.exponentialRampToValueAtTime(freqEnd * 2.2, now + dur);

    // Metal hinge (high, narrow)
    const bp3 = ctx.createBiquadFilter();
    bp3.type = 'bandpass';
    bp3.Q.value = 15 + Math.random() * 10;
    bp3.frequency.setValueAtTime(freqBase * 4.5, now);
    bp3.frequency.exponentialRampToValueAtTime(freqEnd * 4.5, now + dur);

    // Waveshaper for grit on the wood path
    const distortion = ctx.createWaveShaper();
    const distCurve = new Float32Array(256);
    for (let i = 0; i < 256; i++) {
      const x = (i / 128) - 1;
      distCurve[i] = Math.tanh(x * 3); // soft clipping
    }
    distortion.curve = distCurve;

    // Mix gains
    const g1 = ctx.createGain(); g1.gain.value = 0.15;
    const g2 = ctx.createGain(); g2.gain.value = 0.08;
    const g3 = ctx.createGain(); g3.gain.value = 0.04;

    // Envelope
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, now);
    env.gain.linearRampToValueAtTime(1.0, now + dur * 0.1);
    // Irregular pressure
    const steps = 4 + Math.floor(Math.random() * 3);
    for (let i = 0; i < steps; i++) {
      const t = now + dur * (0.15 + (i / steps) * 0.65);
      env.gain.linearRampToValueAtTime(0.3 + Math.random() * 0.7, t);
    }
    env.gain.linearRampToValueAtTime(0.0001, now + dur * 0.95);

    // Connect: noise → judder AM → filters → distortion → env → output
    noiseSrc.connect(judderGain);
    judderGain.connect(bp1);
    judderGain.connect(bp2);
    judderGain.connect(bp3);
    bp1.connect(distortion);
    bp2.connect(distortion);
    distortion.connect(g1);
    bp3.connect(g3);
    g1.connect(env);
    g2.connect(env); // spare path
    g3.connect(env);
    env.connect(output);

    noiseSrc.start(now);
    noiseSrc.stop(now + dur + 0.2);
    judder.start(now);
    judder.stop(now + dur + 0.2);

    noiseSrc.onended = () => {
      noiseSrc.disconnect(); judder.disconnect(); judderShape.disconnect();
      judderGain.disconnect(); bp1.disconnect(); bp2.disconnect(); bp3.disconnect();
      distortion.disconnect(); g1.disconnect(); g2.disconnect(); g3.disconnect();
      env.disconnect();
    };
  }

  private createNoiseBuffer(ctx: AudioContext, size: number): AudioBuffer {
    const buffer = ctx.createBuffer(1, size, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < size; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  protected teardownAudioGraph(): void {
    this.stopped = true;
    for (const t of this._timeouts) clearTimeout(t);
    this._timeouts = [];
    for (const node of this.nodes) {
      try { (node as OscillatorNode).stop?.(); } catch { /* ok */ }
      try { (node as AudioBufferSourceNode).stop?.(); } catch { /* ok */ }
      node.disconnect();
    }
    this.nodes = [];
  }
}
