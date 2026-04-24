import type { SoundCategory } from '../../types';
import { BaseSoundGenerator } from '../base-generator';

/**
 * Coastal Wind — salty wind with waves crashing on rocks.
 *
 * The wind is the backdrop; the waves crashing on rocky shore
 * are the main character. Each wave builds, crashes with a sharp
 * broadband impact, then hisses as foam runs back over rocks.
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
  private waveTimeout: ReturnType<typeof setTimeout> | null = null;
  private activeNodes: AudioNode[] = [];

  protected buildAudioGraph(ctx: AudioContext, output: GainNode): void {
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    // Wind layer — constant backdrop
    this.noiseSource = ctx.createBufferSource();
    this.noiseSource.buffer = buffer;
    this.noiseSource.loop = true;

    this.lowpass = ctx.createBiquadFilter();
    this.lowpass.type = 'lowpass';
    this.lowpass.frequency.value = 1200;
    this.lowpass.Q.value = 0.8;

    this.windGain = ctx.createGain();
    this.windGain.gain.value = 0.12;

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

    // Wind gusts
    this.gustInterval = setInterval(() => {
      if (!this.windGain || ctx.state !== 'running') return;
      if (Math.random() > 0.6) return;
      const peak = 0.18 + Math.random() * 0.08;
      this.windGain.gain.setValueAtTime(this.windGain.gain.value, ctx.currentTime);
      this.windGain.gain.linearRampToValueAtTime(peak, ctx.currentTime + 0.3);
      this.windGain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 1.5 + Math.random());
    }, 4000 + Math.random() * 6000);

    // Waves crashing on rocks — the main event
    this.scheduleWaveCrash(ctx, output);
  }

  private scheduleWaveCrash(ctx: AudioContext, output: GainNode): void {
    // Waves at nearly fixed cadence — like a real shoreline rhythm
    const delay = 7000 + Math.random() * 2000;
    this.waveTimeout = setTimeout(() => {
      if (ctx.state !== 'running' || !this._playing) {
        this.scheduleWaveCrash(ctx, output);
        return;
      }
      this.playWaveCrash(ctx, output);
      this.scheduleWaveCrash(ctx, output);
    }, delay);
  }

  private playWaveCrash(ctx: AudioContext, output: GainNode): void {
    const now = ctx.currentTime;
    const bufferSize = ctx.sampleRate * 2;
    const buf = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      d[i] = Math.random() * 2 - 1;
    }

    const intensity = 0.4 + Math.random() * 0.3; // gentler waves

    // --- Wave swell: low rumble approaching ---
    const swellSrc = ctx.createBufferSource();
    swellSrc.buffer = buf;
    swellSrc.loop = true;
    const swellFilter = ctx.createBiquadFilter();
    swellFilter.type = 'lowpass';
    swellFilter.frequency.value = 300;
    const swellGain = ctx.createGain();
    const swellDuration = 3 + Math.random() * 1;

    swellGain.gain.setValueAtTime(0, now);
    swellGain.gain.linearRampToValueAtTime(0.1 * intensity, now + swellDuration);
    // Filter opens as wave builds
    swellFilter.frequency.setValueAtTime(300, now);
    swellFilter.frequency.linearRampToValueAtTime(800, now + swellDuration);

    swellSrc.connect(swellFilter);
    swellFilter.connect(swellGain);
    swellGain.connect(output);
    swellSrc.start(now);

    // --- CRASH: broadband impact on rocks ---
    const crashTime = now + swellDuration;
    const crashSrc = ctx.createBufferSource();
    crashSrc.buffer = buf;
    crashSrc.loop = true;
    const crashFilter = ctx.createBiquadFilter();
    crashFilter.type = 'bandpass';
    crashFilter.frequency.value = 600 + Math.random() * 400;
    crashFilter.Q.value = 0.2;
    const crashGain = ctx.createGain();
    const crashVol = 0.15 * intensity;
    const crashDuration = 0.5 + Math.random() * 0.3;

    crashGain.gain.setValueAtTime(0, crashTime);
    crashGain.gain.linearRampToValueAtTime(crashVol, crashTime + 0.1);
    crashGain.gain.exponentialRampToValueAtTime(crashVol * 0.3, crashTime + crashDuration);
    crashGain.gain.exponentialRampToValueAtTime(0.001, crashTime + crashDuration + 0.8);

    crashSrc.connect(crashFilter);
    crashFilter.connect(crashGain);
    crashGain.connect(output);
    crashSrc.start(crashTime);
    crashSrc.stop(crashTime + crashDuration + 0.9);
    this.activeNodes.push(crashSrc);
    crashSrc.onended = () => { crashSrc.disconnect(); crashFilter.disconnect(); crashGain.disconnect(); this.activeNodes = this.activeNodes.filter(n => n !== crashSrc); };

    // Swell dies into the crash
    swellGain.gain.linearRampToValueAtTime(0.001, crashTime + crashDuration);
    swellSrc.stop(crashTime + crashDuration + 0.1);
    this.activeNodes.push(swellSrc);
    swellSrc.onended = () => { swellSrc.disconnect(); swellFilter.disconnect(); swellGain.disconnect(); this.activeNodes = this.activeNodes.filter(n => n !== swellSrc); };

    // --- Foam hiss: water rushing back over rocks ---
    const foamSrc = ctx.createBufferSource();
    foamSrc.buffer = buf;
    foamSrc.loop = true;
    const foamFilter = ctx.createBiquadFilter();
    foamFilter.type = 'highpass';
    foamFilter.frequency.value = 2000 + Math.random() * 1000;
    const foamGain = ctx.createGain();
    const foamStart = crashTime + crashDuration * 0.3;
    const foamDuration = 2.5 + Math.random() * 2;

    foamGain.gain.setValueAtTime(0, foamStart);
    foamGain.gain.linearRampToValueAtTime(0.06 * intensity, foamStart + 0.3);
    foamGain.gain.exponentialRampToValueAtTime(0.001, foamStart + foamDuration);

    foamSrc.connect(foamFilter);
    foamFilter.connect(foamGain);
    foamGain.connect(output);
    foamSrc.start(foamStart);
    foamSrc.stop(foamStart + foamDuration + 0.2);
    this.activeNodes.push(foamSrc);
    foamSrc.onended = () => { foamSrc.disconnect(); foamFilter.disconnect(); foamGain.disconnect(); this.activeNodes = this.activeNodes.filter(n => n !== foamSrc); };

    // --- Low thud: the bass impact of water hitting rock ---
    const thudSrc = ctx.createBufferSource();
    thudSrc.buffer = buf;
    thudSrc.loop = true;
    const thudFilter = ctx.createBiquadFilter();
    thudFilter.type = 'lowpass';
    thudFilter.frequency.value = 120;
    const thudGain = ctx.createGain();

    thudGain.gain.setValueAtTime(0, crashTime);
    thudGain.gain.linearRampToValueAtTime(0.1 * intensity, crashTime + 0.06);
    thudGain.gain.exponentialRampToValueAtTime(0.001, crashTime + 1 + Math.random() * 0.5);

    thudSrc.connect(thudFilter);
    thudFilter.connect(thudGain);
    thudGain.connect(output);
    thudSrc.start(crashTime);
    thudSrc.stop(crashTime + 1.5);
    this.activeNodes.push(thudSrc);
    thudSrc.onended = () => { thudSrc.disconnect(); thudFilter.disconnect(); thudGain.disconnect(); this.activeNodes = this.activeNodes.filter(n => n !== thudSrc); };
  }

  protected teardownAudioGraph(): void {
    if (this.gustInterval) { clearInterval(this.gustInterval); this.gustInterval = null; }
    if (this.waveTimeout) { clearTimeout(this.waveTimeout); this.waveTimeout = null; }
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
    for (const node of this.activeNodes) {
      try { (node as AudioBufferSourceNode).stop(); } catch { /* ok */ }
      node.disconnect();
    }
    this.activeNodes = [];
  }
}
