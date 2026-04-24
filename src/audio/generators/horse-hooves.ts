import type { SoundCategory } from '../../types';
import { BaseSoundGenerator } from '../base-generator';

/**
 * Horse Hooves — rhythmic clip-clop on cobblestones.
 *
 * Technique: Short filtered square wave bursts in pairs (clip-clop rhythm)
 * with slight randomization for natural feel.
 */
export class HorseHoovesGenerator extends BaseSoundGenerator {
  readonly id = 'horse-hooves';
  readonly name = 'Horse Hooves';
  readonly category: SoundCategory = 'basic';

  private hoofInterval: ReturnType<typeof setInterval> | null = null;
  private activeOscillators: OscillatorNode[] = [];

  protected buildAudioGraph(ctx: AudioContext, output: GainNode): void {
    this.scheduleHoofCycle(ctx, output);
  }

  private scheduleHoofCycle(ctx: AudioContext, output: GainNode): void {
    let beatIndex = 0;
    // 4-beat gait pattern with varying emphasis
    const pattern = [1.0, 0.6, 0.85, 0.5]; // relative volumes

    this.hoofInterval = setInterval(() => {
      if (ctx.state !== 'running') return;

      const emphasis = pattern[beatIndex % 4];
      this.playHoof(ctx, output, emphasis);
      beatIndex++;
    }, 380 + Math.random() * 40); // ~walking pace
  }

  private playHoof(ctx: AudioContext, output: GainNode, emphasis: number): void {
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    // Click-like sound: short square wave burst through highpass
    osc.type = 'square';
    osc.frequency.value = 150 + Math.random() * 100;

    filter.type = 'highpass';
    filter.frequency.value = 1000 + Math.random() * 500;
    filter.Q.value = 2;

    const vol = 0.025 * emphasis;
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.04 + Math.random() * 0.02);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(output);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.06);

    this.activeOscillators.push(osc);
    osc.onended = () => {
      osc.disconnect(); filter.disconnect(); gain.disconnect();
      this.activeOscillators = this.activeOscillators.filter((o) => o !== osc);
    };
  }

  protected teardownAudioGraph(): void {
    if (this.hoofInterval) { clearInterval(this.hoofInterval); this.hoofInterval = null; }
    for (const osc of this.activeOscillators) {
      try { osc.stop(); } catch { /* ok */ }
      osc.disconnect();
    }
    this.activeOscillators = [];
  }
}
