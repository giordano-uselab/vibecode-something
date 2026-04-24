import type { SoundCategory } from '../../types';
import { BaseSoundGenerator } from '../base-generator';

/**
 * Coastal Wind — strong, salty wind with occasional gusts.
 *
 * Technique: Broadband noise with lowpass + slow LFO for base wind,
 * plus periodic sharp gain ramps for gusts.
 */
export class CoastalWindGenerator extends BaseSoundGenerator {
  readonly id = 'coastal-wind';
  readonly name = 'Coastal Wind';
  readonly category: SoundCategory = 'basic';

  private noiseSource: AudioBufferSourceNode | null = null;
  private lowpass: BiquadFilterNode | null = null;
  private windGain: GainNode | null = null;
  private lfo: OscillatorNode | null = null;
  private lfoGain: GainNode | null = null;
  private gustInterval: ReturnType<typeof setInterval> | null = null;

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

    this.lowpass = ctx.createBiquadFilter();
    this.lowpass.type = 'lowpass';
    this.lowpass.frequency.value = 1200;
    this.lowpass.Q.value = 0.8;

    this.windGain = ctx.createGain();
    this.windGain.gain.value = 0.15;

    this.lfo = ctx.createOscillator();
    this.lfo.type = 'sine';
    this.lfo.frequency.value = 0.12;
    this.lfoGain = ctx.createGain();
    this.lfoGain.gain.value = 500;
    this.lfo.connect(this.lfoGain);
    this.lfoGain.connect(this.lowpass.frequency);

    this.noiseSource.connect(this.lowpass);
    this.lowpass.connect(this.windGain);
    this.windGain.connect(output);
    this.startLoopingSource(this.noiseSource);
    this.lfo.start();

    // Gust bursts every 4–10 seconds
    this.gustInterval = setInterval(() => {
      if (!this.windGain || ctx.state !== 'running') return;
      if (Math.random() > 0.6) return;
      const peak = 0.22 + Math.random() * 0.1;
      this.windGain.gain.setValueAtTime(this.windGain.gain.value, ctx.currentTime);
      this.windGain.gain.linearRampToValueAtTime(peak, ctx.currentTime + 0.3);
      this.windGain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 1.5 + Math.random());
    }, 4000 + Math.random() * 6000);
  }

  protected teardownAudioGraph(): void {
    if (this.gustInterval) { clearInterval(this.gustInterval); this.gustInterval = null; }
    if (this.lfo) { try { this.lfo.stop(); } catch { /* ok */ } this.lfo.disconnect(); this.lfo = null; }
    if (this.lfoGain) { this.lfoGain.disconnect(); this.lfoGain = null; }
    if (this.noiseSource) {
      this.noiseSource.onended = null;
      try { this.noiseSource.stop(); } catch { /* ok */ }
      this.noiseSource.disconnect();
      this.noiseSource = null;
    }
    if (this.lowpass) { this.lowpass.disconnect(); this.lowpass = null; }
    if (this.windGain) { this.windGain.disconnect(); this.windGain = null; }
  }
}
