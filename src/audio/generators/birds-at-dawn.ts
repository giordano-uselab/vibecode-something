import type { SoundCategory } from '../../types';
import { BaseSoundGenerator } from '../base-generator';

/**
 * Birds at Dawn — morning birdsong with sparse chirps.
 *
 * Technique: Short sine sweeps at bird-like frequencies (2–6kHz)
 * with rapid vibrato, triggered at random intervals.
 */
export class BirdsAtDawnGenerator extends BaseSoundGenerator {
  readonly id = 'birds-at-dawn';
  readonly name = 'Birds at Dawn';
  readonly category: SoundCategory = 'basic';

  private chirpTimeout: ReturnType<typeof setTimeout> | null = null;
  private activeOscillators: OscillatorNode[] = [];

  protected buildAudioGraph(ctx: AudioContext, output: GainNode): void {
    this.scheduleNext(ctx, output);
  }

  private scheduleNext(ctx: AudioContext, output: GainNode): void {
    if (!this._playing) return;
    // Variable timing: sometimes rapid bursts, sometimes quiet pauses
    const pause = Math.random() < 0.2
      ? 2000 + Math.random() * 4000   // 20% long silence (2-6s)
      : 400 + Math.random() * 1200;    // 80% normal (0.4-1.6s)

    this.chirpTimeout = setTimeout(() => {
      if (!this._playing) return;

      const r = Math.random();
      if (r < 0.20) {
        this.playChirp(ctx, output);
      } else if (r < 0.35) {
        this.playTrill(ctx, output);
      } else if (r < 0.50) {
        this.playTwitter(ctx, output);
      } else if (r < 0.70) {
        this.playWhistleSong(ctx, output);
      } else if (r < 0.85) {
        this.playTwoNoteCall(ctx, output);
      } else {
        this.playWarble(ctx, output);
      }

      this.scheduleNext(ctx, output);
    }, pause) as ReturnType<typeof setTimeout>;
  }

  /** Single short chirp — quick ascending pip */
  private playChirp(ctx: AudioContext, output: GainNode): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    const baseFreq = 3000 + Math.random() * 3000;
    const t = ctx.currentTime;
    osc.frequency.setValueAtTime(baseFreq, t);
    osc.frequency.linearRampToValueAtTime(baseFreq * (1.2 + Math.random() * 0.3), t + 0.06);
    osc.frequency.linearRampToValueAtTime(baseFreq * 0.85, t + 0.12);

    gain.gain.setValueAtTime(0.025, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);

    osc.connect(gain);
    gain.connect(output);
    osc.start(t);
    osc.stop(t + 0.16);
    this.trackOsc(osc, [gain]);
  }

  /** Rapid trill — alternating notes like a wren */
  private playTrill(ctx: AudioContext, output: GainNode): void {
    const baseFreq = 4000 + Math.random() * 2500;
    const notes = 4 + Math.floor(Math.random() * 6);
    const speed = 0.04 + Math.random() * 0.03;
    const interval = 200 + Math.random() * 400;
    for (let i = 0; i < notes; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      const t = ctx.currentTime + i * speed;
      osc.frequency.value = baseFreq + (i % 2 === 0 ? 0 : interval);
      gain.gain.setValueAtTime(0.018, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + speed * 0.9);

      osc.connect(gain);
      gain.connect(output);
      osc.start(t);
      osc.stop(t + speed);
      this.trackOsc(osc, [gain]);
    }
  }

  /** Fast twitter — sparrow-like rapid chatter */
  private playTwitter(ctx: AudioContext, output: GainNode): void {
    const baseFreq = 5000 + Math.random() * 2000;
    const count = 6 + Math.floor(Math.random() * 8);
    for (let i = 0; i < count; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      const t = ctx.currentTime + i * 0.025;
      // Each note slightly different pitch for chatter effect
      osc.frequency.value = baseFreq + (Math.random() - 0.5) * 800;
      gain.gain.setValueAtTime(0.012, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.02);

      osc.connect(gain);
      gain.connect(output);
      osc.start(t);
      osc.stop(t + 0.025);
      this.trackOsc(osc, [gain]);
    }
  }

  /** Whistle song — melodic phrase of 4-8 notes, like a blackbird */
  private playWhistleSong(ctx: AudioContext, output: GainNode): void {
    const baseFreq = 2000 + Math.random() * 1500;
    const noteCount = 4 + Math.floor(Math.random() * 5);
    // Build a melodic contour — rises then falls
    const melody: number[] = [];
    for (let i = 0; i < noteCount; i++) {
      const progress = i / (noteCount - 1);
      // Arc shape: rise in first half, fall in second
      const arc = progress < 0.5
        ? baseFreq + progress * 2 * 1200
        : baseFreq + (1 - progress) * 2 * 1200;
      melody.push(arc + (Math.random() - 0.5) * 300);
    }

    let t = ctx.currentTime;
    for (let i = 0; i < noteCount; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      const noteDur = 0.12 + Math.random() * 0.15; // each note 120-270ms
      const gap = 0.04 + Math.random() * 0.08;

      // Gentle slide into the note
      osc.frequency.setValueAtTime(melody[i], t);
      if (i < noteCount - 1) {
        osc.frequency.linearRampToValueAtTime(
          melody[i] + (Math.random() - 0.5) * 200, t + noteDur
        );
      }

      const vol = 0.02 + Math.random() * 0.01;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.linearRampToValueAtTime(vol, t + 0.02);
      gain.gain.setValueAtTime(vol, t + noteDur - 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + noteDur);

      osc.connect(gain);
      gain.connect(output);
      osc.start(t);
      osc.stop(t + noteDur + 0.01);
      this.trackOsc(osc, [gain]);

      t += noteDur + gap;
    }
  }

  /** Two-note call — "fee-bee" or "too-wee" like a chickadee */
  private playTwoNoteCall(ctx: AudioContext, output: GainNode): void {
    const highNote = 3500 + Math.random() * 2000;
    const goesDown = Math.random() < 0.6; // 60% descending, 40% ascending
    const lowNote = highNote * (0.65 + Math.random() * 0.15);
    const notes = goesDown ? [highNote, lowNote] : [lowNote, highNote];

    for (let i = 0; i < 2; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      const dur = 0.15 + Math.random() * 0.12;
      const t = ctx.currentTime + i * (dur + 0.06);

      osc.frequency.setValueAtTime(notes[i], t);
      // Slight slide within each note
      osc.frequency.linearRampToValueAtTime(notes[i] * (1 + (Math.random() - 0.5) * 0.08), t + dur);

      const vol = 0.025 + Math.random() * 0.01;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.linearRampToValueAtTime(vol, t + 0.015);
      gain.gain.setValueAtTime(vol, t + dur - 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);

      osc.connect(gain);
      gain.connect(output);
      osc.start(t);
      osc.stop(t + dur + 0.01);
      this.trackOsc(osc, [gain]);
    }
  }

  /** Warble — longer vibrato note, like a canary */
  private playWarble(ctx: AudioContext, output: GainNode): void {
    const osc = ctx.createOscillator();
    const vibrato = ctx.createOscillator();
    const vibratoGain = ctx.createGain();
    const gain = ctx.createGain();

    osc.type = 'sine';
    const baseFreq = 2500 + Math.random() * 2000;
    osc.frequency.value = baseFreq;
    // Slow slide up or down during the warble
    const drift = baseFreq * (Math.random() < 0.5 ? 1.15 : 0.85);
    const dur = 0.3 + Math.random() * 0.3;
    osc.frequency.linearRampToValueAtTime(drift, ctx.currentTime + dur);

    vibrato.type = 'sine';
    vibrato.frequency.value = 15 + Math.random() * 20;
    vibratoGain.gain.value = 150 + Math.random() * 150;

    vibrato.connect(vibratoGain);
    vibratoGain.connect(osc.frequency);

    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.018, ctx.currentTime + 0.03);
    gain.gain.setValueAtTime(0.018, ctx.currentTime + dur - 0.06);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);

    osc.connect(gain);
    gain.connect(output);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + dur + 0.02);
    vibrato.start(ctx.currentTime);
    vibrato.stop(ctx.currentTime + dur + 0.02);

    this.activeOscillators.push(osc, vibrato);
    osc.onended = () => {
      osc.disconnect(); vibrato.disconnect(); vibratoGain.disconnect(); gain.disconnect();
      this.activeOscillators = this.activeOscillators.filter((o) => o !== osc && o !== vibrato);
    };
  }

  private trackOsc(osc: OscillatorNode, nodes: AudioNode[]): void {
    this.activeOscillators.push(osc);
    osc.onended = () => {
      osc.disconnect();
      for (const n of nodes) n.disconnect();
      this.activeOscillators = this.activeOscillators.filter((o) => o !== osc);
    };
  }

  protected teardownAudioGraph(): void {
    if (this.chirpTimeout) { clearTimeout(this.chirpTimeout); this.chirpTimeout = null; }
    for (const osc of this.activeOscillators) {
      try { osc.stop(); } catch { /* ok */ }
      osc.disconnect();
    }
    this.activeOscillators = [];
  }
}
