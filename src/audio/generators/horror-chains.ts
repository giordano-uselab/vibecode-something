import type { SoundCategory } from '../../types';
import { BaseSoundGenerator } from '../base-generator';

/**
 * Horror Chains v2 — modal synthesis approach.
 *
 * Metal-on-metal doesn't sound like filtered noise — it sounds like
 * inharmonic sine partials ringing out at different rates (like bells).
 * Each clink: 4-6 sine oscillators at inharmonic frequency ratios,
 * each with its own decay rate. Grouped 2-6 rapid clinks = chain rattle.
 * Continuous low metallic scrape bed fills gaps.
 */
export class HorrorChainsGenerator extends BaseSoundGenerator {
  readonly id = 'horror-chains';
  readonly name = 'Horror - Chains';
  readonly category: SoundCategory = 'basic';

  private nodes: AudioNode[] = [];
  private stopped = false;
  private _timeouts: ReturnType<typeof setTimeout>[] = [];

  // Inharmonic frequency ratios for metal (like bell partials)
  private static readonly METAL_RATIOS = [1.0, 1.58, 2.13, 2.76, 3.34, 4.12];
  private static readonly PARTIAL_DECAYS = [0.12, 0.09, 0.07, 0.05, 0.04, 0.03];

  protected buildAudioGraph(ctx: AudioContext, output: GainNode): void {
    this.stopped = false;

    // Low metallic drag/scrape bed
    this.createDragBed(ctx, output);

    this.scheduleRattles(ctx, output);
  }

  /**
   * Continuous low-level metallic texture — chain lying on stone, shifting.
   */
  private createDragBed(ctx: AudioContext, output: GainNode): void {
    const bufLen = ctx.sampleRate * 3;
    const buf = this.createNoiseBuffer(ctx, bufLen);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;

    // Bandpass at metallic frequency
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 3000 + Math.random() * 1000;
    bp.Q.value = 3;

    // Slow AM = subtle shifting
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.15 + Math.random() * 0.2;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.003;

    const bedGain = ctx.createGain();
    bedGain.gain.value = 0.005;

    src.connect(bp);
    bp.connect(bedGain);
    lfo.connect(lfoGain);
    lfoGain.connect(bedGain.gain);
    bedGain.connect(output);

    this.startLoopingSource(src);
    lfo.start();

    this.nodes.push(src, bp, lfo, lfoGain, bedGain);
  }

  private scheduleRattles(ctx: AudioContext, output: GainNode): void {
    const schedule = () => {
      if (this.stopped) return;

      this.playRattle(ctx, output);

      // 4-12s between chain rattles
      const pause = 4000 + Math.random() * 8000;
      const t = setTimeout(schedule, pause);
      this._timeouts.push(t);
    };

    const t = setTimeout(schedule, 1000 + Math.random() * 2000);
    this._timeouts.push(t);
  }

  /**
   * Chain rattle: 2-6 rapid metallic clinks in sequence.
   */
  private playRattle(ctx: AudioContext, output: GainNode): void {
    if (this.stopped) return;

    const numClinks = 2 + Math.floor(Math.random() * 5);
    let cumTime = 0;

    for (let i = 0; i < numClinks; i++) {
      // Quick irregular gaps between chain links hitting
      const gap = 0.03 + Math.random() * 0.1;
      cumTime += gap;
      // Volume varies — some hits harder than others
      const vol = 0.06 + Math.random() * 0.08;
      this.playClink(ctx, output, ctx.currentTime + cumTime, vol);
    }
  }

  /**
   * Single metallic clink: modal synthesis with inharmonic sine partials.
   * Like a tiny bell — multiple frequencies ringing out and decaying.
   */
  private playClink(
    ctx: AudioContext,
    output: GainNode,
    startTime: number,
    vol: number
  ): void {
    // Base frequency for this particular link hit
    const baseFreq = 1800 + Math.random() * 2500; // 1800-4300 Hz
    // How many partials
    const numPartials = 4 + Math.floor(Math.random() * 3); // 4-6

    // Noise transient (the initial "tick" attack)
    const tickDur = 0.005;
    const tickBuf = this.createNoiseBuffer(ctx, Math.ceil(ctx.sampleRate * 0.02));
    const tickSrc = ctx.createBufferSource();
    tickSrc.buffer = tickBuf;
    const tickHp = ctx.createBiquadFilter();
    tickHp.type = 'highpass';
    tickHp.frequency.value = 4000;
    const tickEnv = ctx.createGain();
    tickEnv.gain.setValueAtTime(vol * 0.5, startTime);
    tickEnv.gain.exponentialRampToValueAtTime(0.001, startTime + tickDur);
    tickSrc.connect(tickHp);
    tickHp.connect(tickEnv);
    tickEnv.connect(output);
    tickSrc.start(startTime);
    tickSrc.stop(startTime + 0.02);

    // Sine partials — the ringing metallic tone
    for (let p = 0; p < numPartials; p++) {
      const ratio = HorrorChainsGenerator.METAL_RATIOS[p];
      const decayTime = HorrorChainsGenerator.PARTIAL_DECAYS[p] + Math.random() * 0.05;
      const partialVol = vol / (p + 1); // higher partials quieter

      const osc = ctx.createOscillator();
      osc.type = 'sine';
      // Slight random detuning per hit
      osc.frequency.value = baseFreq * ratio * (0.98 + Math.random() * 0.04);

      const env = ctx.createGain();
      env.gain.setValueAtTime(partialVol, startTime);
      env.gain.exponentialRampToValueAtTime(0.0001, startTime + decayTime);

      osc.connect(env);
      env.connect(output);

      osc.start(startTime);
      osc.stop(startTime + decayTime + 0.01);

      osc.onended = () => { osc.disconnect(); env.disconnect(); };
    }

    tickSrc.onended = () => {
      tickSrc.disconnect(); tickHp.disconnect(); tickEnv.disconnect();
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
