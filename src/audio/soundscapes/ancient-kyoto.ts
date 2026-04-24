import type { SoundCategory } from '../../types';
import { BaseSoundGenerator } from '../base-generator';

/**
 * Ancient Kyoto Temple soundscape — a composite of procedural layers:
 * - Wind through bamboo (bandpass-swept noise)
 * - Temple bell / singing bowl (struck harmonics with very long decay)
 * - Water drip in stone basin (single click + high reverb)
 * - Distant shakuhachi-like tones (slow sine sweeps)
 * - Crickets (high-frequency modulated sine)
 */
export class AncientKyotoGenerator extends BaseSoundGenerator {
  readonly id = 'ancient-kyoto';
  readonly name = 'Ancient Kyoto';
  readonly category: SoundCategory = 'soundscape';

  private windSource: AudioBufferSourceNode | null = null;
  private windFilter: BiquadFilterNode | null = null;
  private windVolume: GainNode | null = null;
  private windLfo: OscillatorNode | null = null;
  private windLfoGain: GainNode | null = null;
  private cricketOsc: OscillatorNode | null = null;
  private cricketLfo: OscillatorNode | null = null;
  private cricketLfoGain: GainNode | null = null;
  private cricketGain: GainNode | null = null;
  private cricketOutGain: GainNode | null = null;
  private bellInterval: ReturnType<typeof setInterval> | null = null;
  private dripInterval: ReturnType<typeof setInterval> | null = null;
  private fluteInterval: ReturnType<typeof setInterval> | null = null;
  private activeOscillators: OscillatorNode[] = [];

  protected buildAudioGraph(ctx: AudioContext, output: GainNode): void {
    const bufferSize = ctx.sampleRate * 2;

    // Layer 1: Wind through bamboo
    const noiseBuffer = this.createNoiseBuffer(ctx, bufferSize);
    this.windSource = ctx.createBufferSource();
    this.windSource.buffer = noiseBuffer;
    this.windSource.loop = true;

    this.windFilter = ctx.createBiquadFilter();
    this.windFilter.type = 'bandpass';
    this.windFilter.frequency.value = 800;
    this.windFilter.Q.value = 2;

    this.windLfo = ctx.createOscillator();
    this.windLfo.type = 'sine';
    this.windLfo.frequency.value = 0.08;

    this.windLfoGain = ctx.createGain();
    this.windLfoGain.gain.value = 400;

    this.windLfo.connect(this.windLfoGain);
    this.windLfoGain.connect(this.windFilter.frequency);

    this.windVolume = ctx.createGain();
    this.windVolume.gain.value = 0.08;

    this.windSource.connect(this.windFilter);
    this.windFilter.connect(this.windVolume);
    this.windVolume.connect(output);

    this.startLoopingSource(this.windSource);
    this.windLfo.start();

    // Layer 2: Crickets — high-frequency AM-modulated sine
    this.cricketOsc = ctx.createOscillator();
    this.cricketOsc.type = 'sine';
    this.cricketOsc.frequency.value = 5500;

    this.cricketLfo = ctx.createOscillator();
    this.cricketLfo.type = 'square';
    this.cricketLfo.frequency.value = 12;

    this.cricketLfoGain = ctx.createGain();
    this.cricketLfoGain.gain.value = 1;

    this.cricketGain = ctx.createGain();
    this.cricketGain.gain.value = 0;

    this.cricketLfo.connect(this.cricketLfoGain);
    this.cricketLfoGain.connect(this.cricketGain.gain);

    this.cricketOutGain = ctx.createGain();
    this.cricketOutGain.gain.value = 0.008;

    this.cricketOsc.connect(this.cricketGain);
    this.cricketGain.connect(this.cricketOutGain);
    this.cricketOutGain.connect(output);

    this.cricketOsc.start();
    this.cricketLfo.start();

    // Layer 3: Temple bell — every 12-25 seconds
    this.bellInterval = setInterval(() => {
      if (ctx.state !== 'running') return;
      this.playTempleBell(ctx, output);
    }, 12000 + Math.random() * 13000);

    // Play one immediately for atmosphere
    this.playTempleBell(ctx, output);

    // Layer 4: Water drip — every 3-8 seconds
    this.dripInterval = setInterval(() => {
      if (ctx.state !== 'running') return;
      this.playDrip(ctx, output);
    }, 3000 + Math.random() * 5000);

    // Layer 5: Distant shakuhachi — every 15-30 seconds
    this.fluteInterval = setInterval(() => {
      if (ctx.state !== 'running') return;
      if (Math.random() > 0.4) return;
      this.playFlute(ctx, output);
    }, 15000 + Math.random() * 15000);
  }

  private playTempleBell(ctx: AudioContext, output: GainNode): void {
    // Singing bowl: fundamental + inharmonic partials with very long decay
    const fundamental = 220 + Math.random() * 60;
    const partials = [
      { ratio: 1, amp: 0.04 },
      { ratio: 2.71, amp: 0.02 },
      { ratio: 5.04, amp: 0.01 },
      { ratio: 7.8, amp: 0.005 },
    ];

    for (const partial of partials) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.value = fundamental * partial.ratio;

      gain.gain.setValueAtTime(partial.amp, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 8);

      osc.connect(gain);
      gain.connect(output);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 9);

      this.activeOscillators.push(osc);
      osc.onended = () => {
        osc.disconnect();
        gain.disconnect();
        this.activeOscillators = this.activeOscillators.filter((o) => o !== osc);
      };
    }
  }

  private playDrip(ctx: AudioContext, output: GainNode): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1800 + Math.random() * 600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.15);

    filter.type = 'lowpass';
    filter.frequency.value = 3000;

    gain.gain.setValueAtTime(0.04, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.3);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(output);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.35);

    this.activeOscillators.push(osc);
    osc.onended = () => {
      osc.disconnect();
      filter.disconnect();
      gain.disconnect();
      this.activeOscillators = this.activeOscillators.filter((o) => o !== osc);
    };
  }

  private playFlute(ctx: AudioContext, output: GainNode): void {
    // Shakuhachi-like: slow sine sweep with vibrato
    const osc = ctx.createOscillator();
    const vibrato = ctx.createOscillator();
    const vibratoGain = ctx.createGain();
    const gain = ctx.createGain();

    const baseFreq = 300 + Math.random() * 200;
    osc.type = 'sine';
    osc.frequency.value = baseFreq;
    osc.frequency.linearRampToValueAtTime(baseFreq * 1.1, ctx.currentTime + 2);
    osc.frequency.linearRampToValueAtTime(baseFreq * 0.95, ctx.currentTime + 4);

    vibrato.type = 'sine';
    vibrato.frequency.value = 5;
    vibratoGain.gain.value = 8;

    vibrato.connect(vibratoGain);
    vibratoGain.connect(osc.frequency);

    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.015, ctx.currentTime + 1);
    gain.gain.linearRampToValueAtTime(0.02, ctx.currentTime + 2);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 5);

    osc.connect(gain);
    gain.connect(output);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 5.5);
    vibrato.start(ctx.currentTime);
    vibrato.stop(ctx.currentTime + 5.5);

    this.activeOscillators.push(osc, vibrato);
    const cleanup = () => {
      osc.disconnect();
      vibrato.disconnect();
      vibratoGain.disconnect();
      gain.disconnect();
      this.activeOscillators = this.activeOscillators.filter((o) => o !== osc && o !== vibrato);
    };
    osc.onended = cleanup;
  }

  private createNoiseBuffer(ctx: AudioContext, size: number): AudioBuffer {
    const buffer = ctx.createBuffer(1, size, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < size; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  private stopOscillator(osc: OscillatorNode | null): void {
    if (!osc) return;
    try { osc.stop(); } catch { /* already stopped */ }
    osc.disconnect();
  }

  private stopSource(source: AudioBufferSourceNode | null): void {
    if (!source) return;
    try { source.stop(); } catch { /* already stopped */ }
    source.disconnect();
  }

  protected teardownAudioGraph(): void {
    for (const interval of [this.bellInterval, this.dripInterval, this.fluteInterval]) {
      if (interval) clearInterval(interval);
    }
    this.bellInterval = null;
    this.dripInterval = null;
    this.fluteInterval = null;

    for (const osc of this.activeOscillators) {
      this.stopOscillator(osc);
    }
    this.activeOscillators = [];

    this.stopOscillator(this.cricketOsc);
    this.stopOscillator(this.cricketLfo);
    this.stopOscillator(this.windLfo);
    this.cricketOsc = null;
    this.cricketLfo = null;
    this.windLfo = null;

    if (this.windSource) {
      this.windSource.onended = null;
    }
    this.stopSource(this.windSource);
    this.windSource = null;

    for (const node of [this.windFilter, this.windLfoGain, this.windVolume, this.cricketLfoGain, this.cricketGain, this.cricketOutGain]) {
      if (node) node.disconnect();
    }
    this.windFilter = null;
    this.windLfoGain = null;
    this.windVolume = null;
    this.cricketLfoGain = null;
    this.cricketGain = null;
    this.cricketOutGain = null;
  }
}
