import type { SoundCategory } from '../../types';
import { BaseSoundGenerator } from '../base-generator';

/**
 * Gentle Breeze — soft, delicate wind.
 *
 * Technique: Lowpass-filtered noise with very gentle LFO sweep.
 * Kept quiet and airy — no howling.
 */
export class GentleBreezeGenerator extends BaseSoundGenerator {
  readonly id = 'gentle-breeze';
  readonly name = 'Gentle Breeze';
  readonly category: SoundCategory = 'basic';

  private noiseSource: AudioBufferSourceNode | null = null;
  private filter: BiquadFilterNode | null = null;
  private lfo: OscillatorNode | null = null;
  private lfoGain: GainNode | null = null;
  private outputGain: GainNode | null = null;
  private breatheTimeout: ReturnType<typeof setTimeout> | null = null;

  protected buildAudioGraph(ctx: AudioContext, output: GainNode): void {
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    this.noiseSource = ctx.createBufferSource();
    this.noiseSource.buffer = buffer;
    this.noiseSource.loop = true;

    // Very soft lowpass — barely audible warmth
    this.filter = ctx.createBiquadFilter();
    this.filter.type = 'lowpass';
    this.filter.frequency.value = 350;
    this.filter.Q.value = 0.2;

    // Extremely slow, barely-there LFO — just breathing
    this.lfo = ctx.createOscillator();
    this.lfo.type = 'sine';
    this.lfo.frequency.value = 0.04 + Math.random() * 0.02;

    this.lfoGain = ctx.createGain();
    this.lfoGain.gain.value = 80; // very narrow sweep

    this.lfo.connect(this.lfoGain);
    this.lfoGain.connect(this.filter.frequency);

    // Very quiet — a whisper of air
    this.outputGain = ctx.createGain();
    this.outputGain.gain.value = 0.15;

    this.noiseSource.connect(this.filter);
    this.filter.connect(this.outputGain);
    this.outputGain.connect(output);

    this.startLoopingSource(this.noiseSource);
    this.lfo.start();

    // Breathing cycle — wind comes and goes, sometimes silence
    this.scheduleBreathe(ctx);
  }

  private scheduleBreathe(ctx: AudioContext): void {
    if (!this._playing || !this.outputGain) return;
    const now = ctx.currentTime;

    // 30% chance of full silence, 70% just gets quieter
    const goSilent = Math.random() < 0.3;
    const targetVol = goSilent ? 0 : 0.03 + Math.random() * 0.06;
    const fadeOutDur = 3 + Math.random() * 4; // 3-7s fade out
    const silenceDur = goSilent ? 2 + Math.random() * 5 : 0.5 + Math.random() * 2; // pause
    const fadeInDur = 2 + Math.random() * 4; // 2-6s fade in
    const peakVol = 0.10 + Math.random() * 0.10; // come back at 0.10-0.20

    this.outputGain.gain.setValueAtTime(this.outputGain.gain.value, now);
    this.outputGain.gain.linearRampToValueAtTime(targetVol, now + fadeOutDur);
    this.outputGain.gain.setValueAtTime(targetVol, now + fadeOutDur + silenceDur);
    this.outputGain.gain.linearRampToValueAtTime(peakVol, now + fadeOutDur + silenceDur + fadeInDur);

    const totalMs = (fadeOutDur + silenceDur + fadeInDur) * 1000;
    this.breatheTimeout = setTimeout(() => {
      if (!this._playing) return;
      this.scheduleBreathe(ctx);
    }, totalMs + Math.random() * 3000); // 0-3s extra hold at peak before next cycle
  }

  protected teardownAudioGraph(): void {
    if (this.breatheTimeout) { clearTimeout(this.breatheTimeout); this.breatheTimeout = null; }
    if (this.lfo) {
      try { this.lfo.stop(); } catch { /* already stopped */ }
      this.lfo.disconnect();
      this.lfo = null;
    }
    if (this.lfoGain) {
      this.lfoGain.disconnect();
      this.lfoGain = null;
    }
    if (this.noiseSource) {
      this.noiseSource.onended = null;
      try { this.noiseSource.stop(); } catch { /* already stopped */ }
      this.noiseSource.disconnect();
      this.noiseSource = null;
    }
    if (this.filter) {
      this.filter.disconnect();
      this.filter = null;
    }
    if (this.outputGain) {
      this.outputGain.disconnect();
      this.outputGain = null;
    }
  }
}
