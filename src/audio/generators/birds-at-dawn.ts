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

  private chirpInterval: ReturnType<typeof setInterval> | null = null;
  private activeOscillators: OscillatorNode[] = [];

  protected buildAudioGraph(ctx: AudioContext, output: GainNode): void {
    this.chirpInterval = setInterval(() => {
      if (ctx.state !== 'running') return;
      if (Math.random() > 0.5) return; // sparse

      const birdType = Math.random();
      if (birdType < 0.4) {
        this.playChirp(ctx, output);
      } else if (birdType < 0.7) {
        this.playTrill(ctx, output);
      } else {
        this.playWarble(ctx, output);
      }
    }, 600 + Math.random() * 1500);
  }

  private playChirp(ctx: AudioContext, output: GainNode): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    const baseFreq = 3000 + Math.random() * 3000;
    osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(baseFreq * 1.3, ctx.currentTime + 0.05);
    osc.frequency.linearRampToValueAtTime(baseFreq * 0.9, ctx.currentTime + 0.1);

    gain.gain.setValueAtTime(0.02, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(output);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.15);

    this.activeOscillators.push(osc);
    osc.onended = () => {
      osc.disconnect(); gain.disconnect();
      this.activeOscillators = this.activeOscillators.filter((o) => o !== osc);
    };
  }

  private playTrill(ctx: AudioContext, output: GainNode): void {
    const baseFreq = 4000 + Math.random() * 2000;
    const notes = 3 + Math.floor(Math.random() * 4);
    for (let i = 0; i < notes; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      const t = ctx.currentTime + i * 0.06;
      osc.frequency.value = baseFreq + (i % 2 === 0 ? 0 : 300);
      gain.gain.setValueAtTime(0.015, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);

      osc.connect(gain);
      gain.connect(output);
      osc.start(t);
      osc.stop(t + 0.06);

      this.activeOscillators.push(osc);
      osc.onended = () => {
        osc.disconnect(); gain.disconnect();
        this.activeOscillators = this.activeOscillators.filter((o) => o !== osc);
      };
    }
  }

  private playWarble(ctx: AudioContext, output: GainNode): void {
    const osc = ctx.createOscillator();
    const vibrato = ctx.createOscillator();
    const vibratoGain = ctx.createGain();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.value = 2500 + Math.random() * 2000;
    vibrato.type = 'sine';
    vibrato.frequency.value = 20 + Math.random() * 15;
    vibratoGain.gain.value = 200;

    vibrato.connect(vibratoGain);
    vibratoGain.connect(osc.frequency);

    gain.gain.setValueAtTime(0.015, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.3);

    osc.connect(gain);
    gain.connect(output);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.35);
    vibrato.start(ctx.currentTime);
    vibrato.stop(ctx.currentTime + 0.35);

    this.activeOscillators.push(osc, vibrato);
    osc.onended = () => {
      osc.disconnect(); vibrato.disconnect(); vibratoGain.disconnect(); gain.disconnect();
      this.activeOscillators = this.activeOscillators.filter((o) => o !== osc && o !== vibrato);
    };
  }

  protected teardownAudioGraph(): void {
    if (this.chirpInterval) { clearInterval(this.chirpInterval); this.chirpInterval = null; }
    for (const osc of this.activeOscillators) {
      try { osc.stop(); } catch { /* ok */ }
      osc.disconnect();
    }
    this.activeOscillators = [];
  }
}
