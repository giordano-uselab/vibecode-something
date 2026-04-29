import type { SoundCategory } from '../../types';
import { BaseSoundGenerator } from '../base-generator';

/**
 * Cat Scratching — rhythmic "grat grat grat" on a door.
 *
 * A cat scratches in quick bursts: 3-5 rapid downward strokes,
 * then pauses. Each stroke is a short noise burst swept downward
 * through a bandpass — the "grat" sound. Quick, percussive, rhythmic.
 */
export class HorrorScratchingGenerator extends BaseSoundGenerator {
  readonly id = 'horror-scratching';
  readonly name = 'Horror - Scratching';
  readonly category: SoundCategory = 'basic';

  private nodes: AudioNode[] = [];
  private stopped = false;
  private _timeouts: ReturnType<typeof setTimeout>[] = [];

  protected buildAudioGraph(ctx: AudioContext, output: GainNode): void {
    this.stopped = false;
    this.scheduleBursts(ctx, output);
  }

  private scheduleBursts(ctx: AudioContext, output: GainNode): void {
    const schedule = () => {
      if (this.stopped) return;

      this.playScratchBurst(ctx, output);

      // 3-8s pause between scratch bursts (cat waits, then scratches again)
      const pause = 3000 + Math.random() * 5000;
      const t = setTimeout(schedule, pause);
      this._timeouts.push(t);
    };

    const t = setTimeout(schedule, 1000 + Math.random() * 1500);
    this._timeouts.push(t);
  }

  /**
   * Burst of 3-5 rapid "grat" strokes — like a cat pawing at wood.
   * Regular rhythm with slight variation = organic feel.
   */
  private playScratchBurst(ctx: AudioContext, output: GainNode): void {
    if (this.stopped) return;

    const numStrokes = 3 + Math.floor(Math.random() * 3); // 3-5
    const baseInterval = 0.12 + Math.random() * 0.06; // ~120-180ms apart = fast rhythmic

    for (let i = 0; i < numStrokes; i++) {
      const startTime = ctx.currentTime + i * baseInterval + (Math.random() * 0.02 - 0.01);
      // Each stroke slightly different intensity
      const vol = 0.1 + Math.random() * 0.06;
      // Slight crescendo — cat presses harder
      const intensityMul = 0.7 + (i / numStrokes) * 0.3;
      this.playGrat(ctx, output, startTime, vol * intensityMul);
    }
  }

  /**
   * Single "grat": short, aggressive downward sweep.
   * Noise through descending bandpass + highpass for sharpness + waveshaper for grit.
   */
  private playGrat(ctx: AudioContext, output: GainNode, startTime: number, vol: number): void {
    if (this.stopped) return;

    const dur = 0.06 + Math.random() * 0.04; // 60-100ms — very quick

    // Noise source
    const bufSize = Math.ceil(ctx.sampleRate * (dur + 0.1));
    const buf = this.createNoiseBuffer(ctx, bufSize);
    const src = ctx.createBufferSource();
    src.buffer = buf;

    // Descending bandpass — claw dragging down
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.value = 5 + Math.random() * 3;
    const startFreq = 3000 + Math.random() * 1500;
    bp.frequency.setValueAtTime(startFreq, startTime);
    bp.frequency.exponentialRampToValueAtTime(startFreq * 0.3, startTime + dur);

    // Highpass — keep it sharp, no mud
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 600;

    // Waveshaper — grit/texture of nail on wood
    const shaper = ctx.createWaveShaper();
    const curve = new Float32Array(256);
    for (let i = 0; i < 256; i++) {
      const x = (i / 128) - 1;
      curve[i] = Math.tanh(x * 5);
    }
    shaper.curve = curve;

    // Envelope: instant attack, fast decay
    const env = ctx.createGain();
    env.gain.setValueAtTime(vol, startTime);
    env.gain.exponentialRampToValueAtTime(0.001, startTime + dur);

    src.connect(bp);
    bp.connect(hp);
    hp.connect(shaper);
    shaper.connect(env);
    env.connect(output);

    src.start(startTime);
    src.stop(startTime + dur + 0.02);

    src.onended = () => {
      src.disconnect(); bp.disconnect(); hp.disconnect();
      shaper.disconnect(); env.disconnect();
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
