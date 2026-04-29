import type { SoundCategory } from '../../types';
import { BaseSoundGenerator } from '../base-generator';

/**
 * Horror Music — eerie ambient drone with dissonant intervals.
 *
 * Layers:
 * 1. Deep bass drone (low sine ~40 Hz)
 * 2. Dissonant chord cluster (tritone + minor 2nd intervals)
 * 3. Slow beating between detuned oscillators
 * 4. Random high-pitched "stinger" tones that fade in/out
 * 5. Subtle low rumble noise bed
 */
export class HorrorMusicGenerator extends BaseSoundGenerator {
  readonly id = 'horror-music';
  readonly name = 'Horror Music';
  readonly category: SoundCategory = 'basic';

  private nodes: AudioNode[] = [];
  private stopped = false;
  private _timeouts: ReturnType<typeof setTimeout>[] = [];

  protected buildAudioGraph(ctx: AudioContext, output: GainNode): void {
    this.stopped = false;

    // --- Layer 1: Deep bass drone ---
    this.createDrone(ctx, output, 40, 0.12);

    // --- Layer 2: Dissonant chord cluster ---
    // Tritone (devil's interval): root + augmented 4th
    // E.g. 82 Hz (E2) + 116 Hz (Bb2) = tritone
    this.createDrone(ctx, output, 82, 0.06);
    this.createDrone(ctx, output, 116, 0.05);  // tritone
    this.createDrone(ctx, output, 87, 0.04);   // minor 2nd above root

    // --- Layer 3: Detuned beating pair (creates unease) ---
    this.createDrone(ctx, output, 164, 0.03);
    this.createDrone(ctx, output, 165.5, 0.03); // 1.5 Hz beating

    // --- Layer 4: Random stinger tones ---
    this.scheduleStingers(ctx, output);

    // --- Layer 5: Low rumble noise ---
    this.createRumble(ctx, output);
  }

  /**
   * Sine drone with slow volume swell.
   */
  private createDrone(
    ctx: AudioContext,
    output: GainNode,
    freq: number,
    vol: number
  ): void {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;

    const gain = ctx.createGain();
    gain.gain.value = vol;

    // Slow random volume drift for living/breathing feel
    this.driftGain(ctx, gain, vol);

    osc.connect(gain);
    gain.connect(output);
    osc.start();

    this.nodes.push(osc, gain);
  }

  /**
   * Deep filtered noise rumble.
   */
  private createRumble(ctx: AudioContext, output: GainNode): void {
    const buf = this.createNoiseBuffer(ctx, ctx.sampleRate * 3);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;

    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 80;
    lp.Q.value = 1.0;

    const gain = ctx.createGain();
    gain.gain.value = 0.04;

    src.connect(lp);
    lp.connect(gain);
    gain.connect(output);
    this.startLoopingSource(src);

    this.nodes.push(src, lp, gain);
  }

  /**
   * Schedule occasional high-pitched dissonant stinger tones.
   * These create the "jump scare" tension feeling.
   */
  private scheduleStingers(ctx: AudioContext, output: GainNode): void {
    const stingerFreqs = [
      659,   // E5
      740,   // F#5
      988,   // B5
      1047,  // C6
      1175,  // D6
      1397,  // F6
    ];

    const schedule = () => {
      if (this.stopped) return;
      const now = ctx.currentTime;

      // Pick a random dissonant note
      const freq = stingerFreqs[Math.floor(Math.random() * stingerFreqs.length)];
      const dur = 2 + Math.random() * 5; // 2-7s long

      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq + (Math.random() - 0.5) * 10;

      // Add vibrato for eeriness
      const vibrato = ctx.createOscillator();
      vibrato.type = 'sine';
      vibrato.frequency.value = 4 + Math.random() * 3; // 4-7 Hz
      const vibratoDepth = ctx.createGain();
      vibratoDepth.gain.value = freq * 0.008; // subtle pitch wobble
      vibrato.connect(vibratoDepth);
      vibratoDepth.connect(osc.frequency);

      const gain = ctx.createGain();
      const vol = 0.015 + Math.random() * 0.015;

      // Slow fade in, hold, slow fade out
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(vol, now + dur * 0.3);
      gain.gain.setValueAtTime(vol, now + dur * 0.7);
      gain.gain.linearRampToValueAtTime(0.0001, now + dur);

      osc.connect(gain);
      gain.connect(output);
      osc.start(now);
      osc.stop(now + dur + 0.1);
      vibrato.start(now);
      vibrato.stop(now + dur + 0.1);

      osc.onended = () => {
        osc.disconnect();
        gain.disconnect();
        vibrato.disconnect();
        vibratoDepth.disconnect();
      };

      // Next stinger: 4-12s later
      const nextTime = 4000 + Math.random() * 8000;
      const t = setTimeout(schedule, nextTime);
      this._timeouts.push(t);
    };

    const t = setTimeout(schedule, 2000 + Math.random() * 3000);
    this._timeouts.push(t);
  }

  /**
   * Slowly drift a gain node's volume for a living/breathing effect.
   */
  private driftGain(ctx: AudioContext, gain: GainNode, baseVol: number): void {
    const schedule = () => {
      if (this.stopped) return;
      const now = ctx.currentTime;
      const nextVol = baseVol * (0.5 + Math.random() * 1.0);
      const rampTime = 3 + Math.random() * 5;
      gain.gain.setValueAtTime(gain.gain.value, now);
      gain.gain.linearRampToValueAtTime(nextVol, now + rampTime);
      const t = setTimeout(schedule, (rampTime + 1) * 1000);
      this._timeouts.push(t);
    };
    const t = setTimeout(schedule, 1000 + Math.random() * 3000);
    this._timeouts.push(t);
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
