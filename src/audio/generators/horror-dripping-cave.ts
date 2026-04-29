import type { SoundCategory } from '../../types';
import { BaseSoundGenerator } from '../base-generator';

/**
 * Dripping — Stillicidio.
 *
 * A single rain-like water drop every ~3 seconds.
 * Just a short noise "tick" — no sine, no pitch drop, no big echo.
 * Like hearing a leak from a roof onto a puddle.
 */
export class DrippingCaveGenerator extends BaseSoundGenerator {
  readonly id = 'dripping-cave';
  readonly name = 'Horror - Dripping Cave';
  readonly category: SoundCategory = 'basic';

  private nodes: AudioNode[] = [];
  private stopped = false;
  private _timeouts: ReturnType<typeof setTimeout>[] = [];

  protected buildAudioGraph(ctx: AudioContext, output: GainNode): void {
    this.stopped = false;
    this.scheduleDrip(ctx, output);
  }

  private scheduleDrip(ctx: AudioContext, output: GainNode): void {
    const tick = () => {
      if (this.stopped) return;

      this.playDrip(ctx, output);

      // ~3 seconds ± tiny jitter
      const pause = 2800 + Math.random() * 400;
      const t = setTimeout(tick, pause);
      this._timeouts.push(t);
    };

    const t = setTimeout(tick, 1000);
    this._timeouts.push(t);
  }

  /**
   * Single water drop: just a very short filtered noise "tick".
   * No sine oscillator (avoids electronic/bouncy sound).
   * No feedback echo (avoids bouncing ball effect).
   */
  private playDrip(ctx: AudioContext, output: GainNode): void {
    if (this.stopped) return;
    const now = ctx.currentTime;
    const vol = 0.12 + Math.random() * 0.04;

    // Very short noise burst — the "tick" of water hitting surface
    const buf = this.createNoiseBuffer(ctx, Math.ceil(ctx.sampleRate * 0.03));
    const src = ctx.createBufferSource();
    src.buffer = buf;

    // Bandpass centered around water-drop frequency range
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 2000 + Math.random() * 800;
    bp.Q.value = 3 + Math.random() * 2;

    // Highpass to remove any low thump
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 800;

    // Very fast envelope: instant attack, rapid decay (~15ms total)
    const env = ctx.createGain();
    env.gain.setValueAtTime(vol, now);
    env.gain.exponentialRampToValueAtTime(0.001, now + 0.015);

    src.connect(bp);
    bp.connect(hp);
    hp.connect(env);
    env.connect(output);

    src.start(now);
    src.stop(now + 0.03);

    src.onended = () => {
      src.disconnect(); bp.disconnect(); hp.disconnect(); env.disconnect();
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
      try { (node as AudioBufferSourceNode).stop?.(); } catch { /* ok */ }
      node.disconnect();
    }
    this.nodes = [];
  }
}
