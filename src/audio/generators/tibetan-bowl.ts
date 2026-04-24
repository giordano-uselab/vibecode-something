import type { SoundCategory } from '../../types';
import { BaseSoundGenerator } from '../base-generator';

/**
 * Tibetan Bowl — resonating singing bowl tones.
 *
 * Technique: Periodic struck bowl with inharmonic partials
 * and very long exponential decay. New strike every 10–20 seconds.
 */
export class TibetanBowlGenerator extends BaseSoundGenerator {
  readonly id = 'tibetan-bowl';
  readonly name = 'Tibetan Bowl';
  readonly category: SoundCategory = 'basic';

  private strikeInterval: ReturnType<typeof setInterval> | null = null;
  private activeOscillators: OscillatorNode[] = [];

  protected buildAudioGraph(ctx: AudioContext, output: GainNode): void {
    // Play one immediately
    this.playStrike(ctx, output);

    this.strikeInterval = setInterval(() => {
      if (ctx.state !== 'running') return;
      this.playStrike(ctx, output);
    }, 10000 + Math.random() * 10000);
  }

  private playStrike(ctx: AudioContext, output: GainNode): void {
    const fundamental = 180 + Math.random() * 80;
    // Singing bowl partials are inharmonic
    const partials = [
      { ratio: 1, amp: 0.06 },
      { ratio: 2.71, amp: 0.035 },
      { ratio: 4.95, amp: 0.02 },
      { ratio: 7.2, amp: 0.01 },
      { ratio: 10.1, amp: 0.005 },
    ];

    const decayTime = 8 + Math.random() * 4;

    for (const partial of partials) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.value = fundamental * partial.ratio;

      gain.gain.setValueAtTime(partial.amp, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + decayTime);

      osc.connect(gain);
      gain.connect(output);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + decayTime + 1);

      this.activeOscillators.push(osc);
      osc.onended = () => {
        osc.disconnect();
        gain.disconnect();
        this.activeOscillators = this.activeOscillators.filter((o) => o !== osc);
      };
    }
  }

  protected teardownAudioGraph(): void {
    if (this.strikeInterval) { clearInterval(this.strikeInterval); this.strikeInterval = null; }
    for (const osc of this.activeOscillators) {
      try { osc.stop(); } catch { /* ok */ }
      osc.disconnect();
    }
    this.activeOscillators = [];
  }
}
