import type { SoundCategory } from '../../types';
import { BaseSoundGenerator } from '../base-generator';

/**
 * Horror Heartbeat — deep, slow pounding heartbeat.
 *
 * A real heartbeat has two beats: "lub-dub" (S1 + S2).
 * S1 = low thump (~30-50 Hz sine burst)
 * S2 = slightly higher, shorter thump (~50-70 Hz) ~0.2s after S1
 * The pair repeats every 1-2s (slow = suspense, fast = panic).
 * Tempo drifts slowly to create unease.
 */
export class HorrorHeartbeatGenerator extends BaseSoundGenerator {
  readonly id = 'horror-heartbeat';
  readonly name = 'Horror - Heartbeat';
  readonly category: SoundCategory = 'basic';

  private nodes: AudioNode[] = [];
  private stopped = false;
  private _timeouts: ReturnType<typeof setTimeout>[] = [];

  protected buildAudioGraph(ctx: AudioContext, output: GainNode): void {
    this.stopped = false;
    this.scheduleBeats(ctx, output);
  }

  private scheduleBeats(ctx: AudioContext, output: GainNode): void {
    let bpm = 50 + Math.random() * 10; // 50-60 bpm (slow, ominous)

    const schedule = () => {
      if (this.stopped) return;
      const now = ctx.currentTime;

      // S1: deep "lub"
      this.playBeat(ctx, output, now, 35, 0.12, 0.35);

      // S2: shorter, higher "dub" ~0.25s later
      this.playBeat(ctx, output, now + 0.25, 55, 0.08, 0.2);

      // Slowly drift tempo for unease
      bpm += (Math.random() - 0.5) * 4;
      bpm = Math.max(40, Math.min(80, bpm));

      const interval = (60 / bpm) * 1000;
      const t = setTimeout(schedule, interval);
      this._timeouts.push(t);
    };

    const t = setTimeout(schedule, 500);
    this._timeouts.push(t);
  }

  private playBeat(
    ctx: AudioContext,
    output: GainNode,
    startTime: number,
    freq: number,
    vol: number,
    dur: number
  ): void {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, startTime);
    // Very fast attack (thump)
    gain.gain.linearRampToValueAtTime(vol, startTime + 0.01);
    // Exponential decay (natural body resonance)
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + dur);

    osc.connect(gain);
    gain.connect(output);
    osc.start(startTime);
    osc.stop(startTime + dur + 0.05);

    osc.onended = () => {
      osc.disconnect();
      gain.disconnect();
    };
  }

  protected teardownAudioGraph(): void {
    this.stopped = true;
    for (const t of this._timeouts) clearTimeout(t);
    this._timeouts = [];
    for (const node of this.nodes) {
      try { (node as OscillatorNode).stop?.(); } catch { /* ok */ }
      node.disconnect();
    }
    this.nodes = [];
  }
}
