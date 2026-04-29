import type { SoundCategory } from '../../types';
import { BaseSoundGenerator } from '../base-generator';

/**
 * Coffee Shop — a relaxing café ambience.
 *
 * Designed to induce calm. Warm, enveloping room tone with
 * gentle distant murmur. Soft discrete events tell micro-stories
 * of customers coming and going, but everything is muted and
 * distant — like sitting in a corner with your eyes closed.
 */
export class CoffeeShopGenerator extends BaseSoundGenerator {
  readonly id = 'coffee-shop';
  readonly name = 'Coffee Shop';
  readonly category: SoundCategory = 'basic';

  private nodes: AudioNode[] = [];
  private stopped = false;
  private _timeouts: ReturnType<typeof setTimeout>[] = [];

  /** Per-layer mute gain nodes */
  private layerGains: Record<string, GainNode> = {};
  private layerMuted: Record<string, boolean> = {};

  static readonly LAYERS = [
    { key: 'warm-bed', label: 'Letto caldo (hum)' },
    { key: 'events', label: 'Eventi (clienti)' },
  ] as const;

  setLayerMuted(layer: string, muted: boolean): void {
    this.layerMuted[layer] = muted;
    const g = this.layerGains[layer];
    if (g) g.gain.value = muted ? 0 : 1;
  }

  isLayerMuted(layer: string): boolean {
    return this.layerMuted[layer] ?? false;
  }

  private getLayerOutput(ctx: AudioContext, output: GainNode, layer: string): GainNode {
    const g = ctx.createGain();
    g.gain.value = this.layerMuted[layer] ? 0 : 1;
    g.connect(output);
    this.layerGains[layer] = g;
    return g;
  }

  protected buildAudioGraph(ctx: AudioContext, output: GainNode): void {
    this.stopped = false;
    const warmBedOut = this.getLayerOutput(ctx, output, 'warm-bed');
    const eventsOut = this.getLayerOutput(ctx, output, 'events');

    // Warm ambient bed — the soul of the relaxation
    this.createWarmBed(ctx, warmBedOut);

    // Single customer stream — one story per minute
    this.scheduleStory(ctx, eventsOut, 5000 + Math.random() * 5000);
  }

  /**
   * Warm ambient bed: soft ventilation hum + low-frequency warmth.
   * Like the comforting background of a cozy café.
   */
  private createWarmBed(ctx: AudioContext, output: GainNode): void {
    const buf = this.createNoiseBuffer(ctx, ctx.sampleRate * 4);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;

    // Warm low layer
    const lpLow = ctx.createBiquadFilter();
    lpLow.type = 'lowpass';
    lpLow.frequency.value = 180;
    lpLow.Q.value = 0.4;

    const gainLow = ctx.createGain();
    gainLow.gain.value = 0.010;

    // Gentle mid hum — ventilation/AC character
    const bpMid = ctx.createBiquadFilter();
    bpMid.type = 'bandpass';
    bpMid.frequency.value = 350 + Math.random() * 50;
    bpMid.Q.value = 1.2;

    const gainMid = ctx.createGain();
    gainMid.gain.value = 0.003;

    // Very slow breathing — glacial, barely perceptible swells
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.015 + Math.random() * 0.01;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.006;

    // Second ultra-slow LFO — long-term drift
    const lfo2 = ctx.createOscillator();
    lfo2.type = 'sine';
    lfo2.frequency.value = 0.005 + Math.random() * 0.005;
    const lfo2Gain = ctx.createGain();
    lfo2Gain.gain.value = 0.004;

    src.connect(lpLow);
    src.connect(bpMid);
    lpLow.connect(gainLow);
    bpMid.connect(gainMid);
    lfo.connect(lfoGain);
    lfoGain.connect(gainLow.gain);
    lfo2.connect(lfo2Gain);
    lfo2Gain.connect(gainLow.gain);
    gainLow.connect(output);
    gainMid.connect(output);

    this.startLoopingSource(src);
    lfo.start();
    lfo2.start();

    this.nodes.push(src, lpLow, bpMid, lfo, lfoGain, lfo2, lfo2Gain, gainLow, gainMid);
  }

  private scheduleStory(ctx: AudioContext, output: GainNode, initialDelay = 0): void {
    if (this.stopped) return;

    const start = () => {
      if (this.stopped) return;
      this.playStory(ctx, output);

      // Next customer: ~60s
      const pause = 55000 + Math.random() * 10000;
      const t2 = setTimeout(() => this.scheduleStory(ctx, output), pause);
      this._timeouts.push(t2);
    };

    const t = setTimeout(start, initialDelay);
    this._timeouts.push(t);
  }

  /**
   * One full customer story — all events are soft and distant.
   */
  private playStory(ctx: AudioContext, output: GainNode): void {
    if (this.stopped) return;

    let t = 0;

    // 1. Door opens — soft air movement
    this.scheduleAt(() => this.playDoorOpen(ctx, output), t);
    t += 2.5;

    // 2. Footsteps approaching (3-4 steps, unhurried)
    const numSteps = 3 + Math.floor(Math.random() * 2);
    for (let i = 0; i < numSteps; i++) {
      const stepTime = t + i * (0.65 + Math.random() * 0.2);
      this.scheduleAt(() => this.playFootstep(ctx, output), stepTime);
    }
    t += numSteps * 0.7 + 2.0;

    // 3. Gentle knock — muffled
    this.scheduleAt(() => this.playKnock(ctx, output), t);
    t += 3.0;

    // 4. Soft metallic click
    this.scheduleAt(() => this.playMetalClick(ctx, output), t);
    t += 2.0;

    // 5. Espresso hiss — gentle, like a sigh
    this.scheduleAt(() => this.playEspressoHiss(ctx, output), t);
    t += 6.0;

    // 6. Cup on saucer — delicate
    this.scheduleAt(() => this.playCeramicClink(ctx, output), t);
    t += 2.0;

    // 7. Coins (1-2, gentle)
    const numCoins = 1 + Math.floor(Math.random() * 2);
    for (let i = 0; i < numCoins; i++) {
      const coinTime = t + i * (0.3 + Math.random() * 0.2);
      this.scheduleAt(() => this.playCoin(ctx, output), coinTime);
    }
    t += 3.0;

    // 8. Spoon stirring — slow, meditative
    this.scheduleAt(() => this.playStirring(ctx, output), t);
    t += 4.0;

    // 9. Long pause — drinking, savoring (8-15s)
    t += 8 + Math.random() * 7;

    // 10. Cup placed down
    this.scheduleAt(() => this.playCeramicClink(ctx, output), t);
    t += 2.0;

    // 11. Footsteps leaving (3-4 steps)
    const leaveSteps = 3 + Math.floor(Math.random() * 2);
    for (let i = 0; i < leaveSteps; i++) {
      const stepTime = t + i * (0.6 + Math.random() * 0.15);
      this.scheduleAt(() => this.playFootstep(ctx, output), stepTime);
    }
    t += leaveSteps * 0.65 + 1.5;

    // 12. Door closes — soft
    this.scheduleAt(() => this.playDoorClose(ctx, output), t);
  }

  private scheduleAt(fn: () => void, delaySec: number): void {
    if (this.stopped) return;
    const t = setTimeout(() => {
      if (!this.stopped) fn();
    }, delaySec * 1000);
    this._timeouts.push(t);
  }

  // === Sound primitives (all softened for relaxation) ===

  /** Door opening: gentle air movement */
  private playDoorOpen(ctx: AudioContext, output: GainNode): void {
    const now = ctx.currentTime;
    const dur = 0.5 + Math.random() * 0.2;
    const buf = this.createNoiseBuffer(ctx, Math.ceil(ctx.sampleRate * (dur + 0.2)));
    const src = ctx.createBufferSource();
    src.buffer = buf;

    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 250 + Math.random() * 150;
    bp.Q.value = 0.6;

    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, now);
    env.gain.linearRampToValueAtTime(0.03, now + 0.15);
    env.gain.linearRampToValueAtTime(0.015, now + dur * 0.7);
    env.gain.linearRampToValueAtTime(0.0001, now + dur);

    src.connect(bp); bp.connect(env); env.connect(output);
    src.start(now); src.stop(now + dur + 0.1);
    src.onended = () => { src.disconnect(); bp.disconnect(); env.disconnect(); };
  }

  /** Door closing: soft thud */
  private playDoorClose(ctx: AudioContext, output: GainNode): void {
    const now = ctx.currentTime;
    const dur = 0.2 + Math.random() * 0.1;
    const buf = this.createNoiseBuffer(ctx, Math.ceil(ctx.sampleRate * 0.4));
    const src = ctx.createBufferSource();
    src.buffer = buf;

    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 300 + Math.random() * 100;
    lp.Q.value = 0.5;

    const env = ctx.createGain();
    env.gain.setValueAtTime(0.03, now);
    env.gain.exponentialRampToValueAtTime(0.001, now + dur);

    src.connect(lp); lp.connect(env); env.connect(output);
    src.start(now); src.stop(now + 0.4);
    src.onended = () => { src.disconnect(); lp.disconnect(); env.disconnect(); };
  }

  /** Footstep: very soft, distant thump */
  private playFootstep(ctx: AudioContext, output: GainNode): void {
    const now = ctx.currentTime;
    const vol = 0.015 + Math.random() * 0.01;

    // Low thump — soft
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(60 + Math.random() * 30, now);
    osc.frequency.exponentialRampToValueAtTime(35, now + 0.05);
    const oscEnv = ctx.createGain();
    oscEnv.gain.setValueAtTime(vol, now);
    oscEnv.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);
    osc.connect(oscEnv); oscEnv.connect(output);
    osc.start(now); osc.stop(now + 0.06);

    // Very subtle noise texture
    const buf = this.createNoiseBuffer(ctx, Math.ceil(ctx.sampleRate * 0.04));
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 400;
    const nEnv = ctx.createGain();
    nEnv.gain.setValueAtTime(vol * 0.3, now);
    nEnv.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);
    src.connect(lp); lp.connect(nEnv); nEnv.connect(output);
    src.start(now); src.stop(now + 0.04);

    osc.onended = () => { osc.disconnect(); oscEnv.disconnect(); };
    src.onended = () => { src.disconnect(); lp.disconnect(); nEnv.disconnect(); };
  }

  /** Knock: muffled, gentle — like from another room */
  private playKnock(ctx: AudioContext, output: GainNode): void {
    const now = ctx.currentTime;
    const vol = 0.03 + Math.random() * 0.015;

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150 + Math.random() * 60, now);
    osc.frequency.exponentialRampToValueAtTime(50, now + 0.06);
    const oscEnv = ctx.createGain();
    oscEnv.gain.setValueAtTime(vol, now);
    oscEnv.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);
    osc.connect(oscEnv); oscEnv.connect(output);
    osc.start(now); osc.stop(now + 0.08);

    // Soft scatter
    const buf = this.createNoiseBuffer(ctx, Math.ceil(ctx.sampleRate * 0.06));
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 500;
    lp.Q.value = 0.5;
    const nEnv = ctx.createGain();
    nEnv.gain.setValueAtTime(vol * 0.25, now);
    nEnv.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);
    src.connect(lp); lp.connect(nEnv); nEnv.connect(output);
    src.start(now); src.stop(now + 0.06);

    osc.onended = () => { osc.disconnect(); oscEnv.disconnect(); };
    src.onended = () => { src.disconnect(); lp.disconnect(); nEnv.disconnect(); };
  }

  /** Metallic click: soft, brief */
  private playMetalClick(ctx: AudioContext, output: GainNode): void {
    const now = ctx.currentTime;
    const vol = 0.01 + Math.random() * 0.006;
    const baseFreq = 1800 + Math.random() * 800;

    const ratios = [1.0, 1.62];
    const decays = [0.03, 0.02];
    for (let p = 0; p < 2; p++) {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = baseFreq * ratios[p];
      const env = ctx.createGain();
      env.gain.setValueAtTime(vol / (p + 1), now);
      env.gain.exponentialRampToValueAtTime(0.0001, now + decays[p]);
      osc.connect(env); env.connect(output);
      osc.start(now); osc.stop(now + decays[p] + 0.01);
      osc.onended = () => { osc.disconnect(); env.disconnect(); };
    }
  }

  /** Espresso hiss: gentle, like a soft sigh */
  private playEspressoHiss(ctx: AudioContext, output: GainNode): void {
    const now = ctx.currentTime;
    const dur = 3.0 + Math.random() * 2.0;

    const buf = this.createNoiseBuffer(ctx, Math.ceil(ctx.sampleRate * (dur + 1)));
    const src = ctx.createBufferSource();
    src.buffer = buf;

    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 2000 + Math.random() * 800;

    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 3500 + Math.random() * 1000;
    bp.Q.value = 0.5;

    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, now);
    env.gain.linearRampToValueAtTime(0.014, now + 0.6);
    env.gain.setValueAtTime(0.014, now + dur - 0.8);
    env.gain.linearRampToValueAtTime(0.0001, now + dur);

    src.connect(hp); hp.connect(bp); bp.connect(env); env.connect(output);
    src.start(now); src.stop(now + dur + 0.1);
    src.onended = () => { src.disconnect(); hp.disconnect(); bp.disconnect(); env.disconnect(); };
  }

  /** Ceramic clink: delicate, soft */
  private playCeramicClink(ctx: AudioContext, output: GainNode): void {
    const now = ctx.currentTime;
    const vol = 0.008 + Math.random() * 0.005;
    const baseFreq = 2500 + Math.random() * 800;

    const ratios = [1.0, 1.47, 2.09];
    const decays = [0.04, 0.03, 0.02];
    const numP = 2 + Math.floor(Math.random() * 2);

    for (let p = 0; p < numP; p++) {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = baseFreq * ratios[p] * (0.97 + Math.random() * 0.06);
      const env = ctx.createGain();
      env.gain.setValueAtTime(vol / (p + 1), now);
      env.gain.exponentialRampToValueAtTime(0.0001, now + decays[p]);
      osc.connect(env); env.connect(output);
      osc.start(now); osc.stop(now + decays[p] + 0.01);
      osc.onended = () => { osc.disconnect(); env.disconnect(); };
    }
  }

  /** Coin: tiny soft tap */
  private playCoin(ctx: AudioContext, output: GainNode): void {
    const now = ctx.currentTime;
    const vol = 0.006 + Math.random() * 0.004;
    const baseFreq = 3000 + Math.random() * 1000;

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = baseFreq;
    const env = ctx.createGain();
    env.gain.setValueAtTime(vol, now);
    env.gain.exponentialRampToValueAtTime(0.0001, now + 0.025);
    osc.connect(env); env.connect(output);
    osc.start(now); osc.stop(now + 0.035);
    osc.onended = () => { osc.disconnect(); env.disconnect(); };
  }

  /** Spoon stirring: very slow, barely-there taps */
  private playStirring(ctx: AudioContext, output: GainNode): void {
    const numTaps = 4 + Math.floor(Math.random() * 3);
    const interval = 0.22 + Math.random() * 0.1;
    const baseFreq = 3200 + Math.random() * 800;

    for (let i = 0; i < numTaps; i++) {
      const startTime = ctx.currentTime + i * interval + (Math.random() * 0.02);
      const vol = 0.002 + Math.random() * 0.002;

      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = baseFreq * (0.98 + Math.random() * 0.04);
      const env = ctx.createGain();
      env.gain.setValueAtTime(vol, startTime);
      env.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.012);
      osc.connect(env); env.connect(output);
      osc.start(startTime); osc.stop(startTime + 0.02);
      osc.onended = () => { osc.disconnect(); env.disconnect(); };
    }
  }

  // === Utility ===

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
    for (const g of Object.values(this.layerGains)) g.disconnect();
    this.layerGains = {};
  }
}
