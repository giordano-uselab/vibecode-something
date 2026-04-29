import type { SoundCategory } from '../../types';
import { BaseSoundGenerator } from '../base-generator';

/**
 * Crackling Fire — calm fireplace.
 *
 * A gentle, warm fire — not aggressive.
 * - Warm low rumble: very quiet brownish noise (the "body" of the fire)
 * - Individual crackles: short noise bursts at random intervals,
 *   each with slightly different timbre. Sparse, not continuous.
 * - Occasional pop: slightly louder, lower-pitched burst (wood popping)
 */
export class CracklingFireGenerator extends BaseSoundGenerator {
  readonly id = 'crackling-fire';
  readonly name = 'Crackling Fire';
  readonly category: SoundCategory = 'basic';

  private nodes: AudioNode[] = [];
  private stopped = false;
  private _timeouts: ReturnType<typeof setTimeout>[] = [];

  protected buildAudioGraph(ctx: AudioContext, output: GainNode): void {
    this.stopped = false;

    // Continuous flame body — the sound of fire burning
    this.createFlameBody(ctx, output);

    // Individual crackle events
    this.scheduleCrackles(ctx, output);

    // Occasional pops
    this.schedulePops(ctx, output);
  }

  /**
   * Flame body: filtered noise shaped to sound like a living fire.
   * Two bandpass layers at different frequencies give it texture,
   * with slow LFO modulation so it breathes and flickers.
   */
  private createFlameBody(ctx: AudioContext, output: GainNode): void {
    const bufLen = ctx.sampleRate * 4;
    const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
    const data = buf.getChannelData(0);

    // Brown-ish noise — warmer base
    let last = 0;
    for (let i = 0; i < bufLen; i++) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 3.5;
    }

    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;

    // Low rumble layer — deep warmth
    const lpLow = ctx.createBiquadFilter();
    lpLow.type = 'bandpass';
    lpLow.frequency.value = 150;
    lpLow.Q.value = 0.6;

    // Mid crackle texture — gives the "burning" character
    const lpMid = ctx.createBiquadFilter();
    lpMid.type = 'bandpass';
    lpMid.frequency.value = 600 + Math.random() * 200;
    lpMid.Q.value = 0.8;

    const gainLow = ctx.createGain();
    gainLow.gain.value = 0.02;

    const gainMid = ctx.createGain();
    gainMid.gain.value = 0.007;

    // Slow breathing — fire flickers gently
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.12 + Math.random() * 0.08;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.008;

    // A second, slower LFO for organic feel
    const lfo2 = ctx.createOscillator();
    lfo2.type = 'sine';
    lfo2.frequency.value = 0.03 + Math.random() * 0.03;
    const lfo2Gain = ctx.createGain();
    lfo2Gain.gain.value = 0.006;

    src.connect(lpLow);
    src.connect(lpMid);
    lpLow.connect(gainLow);
    lpMid.connect(gainMid);

    lfo.connect(lfoGain);
    lfoGain.connect(gainLow.gain);
    lfo2.connect(lfo2Gain);
    lfo2Gain.connect(gainMid.gain);

    gainLow.connect(output);
    gainMid.connect(output);

    this.startLoopingSource(src);
    lfo.start();
    lfo2.start();

    this.nodes.push(src, lpLow, lpMid, lfo, lfoGain, lfo2, lfo2Gain, gainLow, gainMid);
  }

  /**
   * Individual crackles: short noise bursts through bandpass.
   * Each crackle is unique — different pitch, duration, volume.
   */
  private scheduleCrackles(ctx: AudioContext, output: GainNode): void {
    const schedule = () => {
      if (this.stopped) return;

      this.playCrackle(ctx, output);

      // 0.3-1.5s between crackles — sparse but alive
      const pause = 300 + Math.random() * 1200;
      const t = setTimeout(schedule, pause);
      this._timeouts.push(t);
    };

    const t = setTimeout(schedule, 500 + Math.random() * 1000);
    this._timeouts.push(t);
  }

  private playCrackle(ctx: AudioContext, output: GainNode): void {
    if (this.stopped) return;
    const now = ctx.currentTime;
    const dur = 0.01 + Math.random() * 0.03; // 10-40ms — quick snap
    const vol = 0.02 + Math.random() * 0.04; // gentle

    const buf = this.createNoiseBuffer(ctx, Math.ceil(ctx.sampleRate * 0.05));
    const src = ctx.createBufferSource();
    src.buffer = buf;

    // Bandpass at fire crackle range
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 600 + Math.random() * 2000;
    bp.Q.value = 1 + Math.random() * 2;

    // Envelope: instant attack, very fast decay
    const env = ctx.createGain();
    env.gain.setValueAtTime(vol, now);
    env.gain.exponentialRampToValueAtTime(0.0001, now + dur);

    src.connect(bp);
    bp.connect(env);
    env.connect(output);

    src.start(now);
    src.stop(now + 0.05);

    src.onended = () => {
      src.disconnect(); bp.disconnect(); env.disconnect();
    };
  }

  /**
   * Wood pops: slightly louder, lower, with a tiny "thump".
   */
  private schedulePops(ctx: AudioContext, output: GainNode): void {
    const schedule = () => {
      if (this.stopped) return;

      this.playPop(ctx, output);

      // 5-15s between pops — rare
      const pause = 5000 + Math.random() * 10000;
      const t = setTimeout(schedule, pause);
      this._timeouts.push(t);
    };

    const t = setTimeout(schedule, 3000 + Math.random() * 5000);
    this._timeouts.push(t);
  }

  private playPop(ctx: AudioContext, output: GainNode): void {
    if (this.stopped) return;
    const now = ctx.currentTime;
    const vol = 0.05 + Math.random() * 0.04;

    // Low thump component
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150 + Math.random() * 100, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.04);

    const oscEnv = ctx.createGain();
    oscEnv.gain.setValueAtTime(vol * 0.5, now);
    oscEnv.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);

    osc.connect(oscEnv);
    oscEnv.connect(output);

    // Noise snap on top
    const buf = this.createNoiseBuffer(ctx, Math.ceil(ctx.sampleRate * 0.04));
    const src = ctx.createBufferSource();
    src.buffer = buf;

    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 400 + Math.random() * 600;
    bp.Q.value = 1.5;

    const snapEnv = ctx.createGain();
    snapEnv.gain.setValueAtTime(vol, now);
    snapEnv.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);

    src.connect(bp);
    bp.connect(snapEnv);
    snapEnv.connect(output);

    osc.start(now);
    osc.stop(now + 0.05);
    src.start(now);
    src.stop(now + 0.04);

    osc.onended = () => { osc.disconnect(); oscEnv.disconnect(); };
    src.onended = () => { src.disconnect(); bp.disconnect(); snapEnv.disconnect(); };
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
