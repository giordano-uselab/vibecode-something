import type { SoundCategory } from '../../types';
import { BaseSoundGenerator } from '../base-generator';

/**
 * Train Journey — relaxing rhythmic rail sounds with gentle sway
 * and bridge crossings.
 *
 * Warm, soft rumble. Slow, gentle rail clicks. A subtle hollow
 * resonance always present (like distant echo off tunnels and
 * structures). Occasionally the train crosses a bridge and the
 * sound opens up and becomes more metallic.
 */
export class TrainJourneyGenerator extends BaseSoundGenerator {
  readonly id = 'train-journey';
  readonly name = 'Train Journey';
  readonly category: SoundCategory = 'basic';

  private rumbleSource: AudioBufferSourceNode | null = null;
  private rumbleFilter: BiquadFilterNode | null = null;
  private rumbleGain: GainNode | null = null;
  private bridgeTimeout: ReturnType<typeof setTimeout> | null = null;
  private activeNodes: AudioNode[] = [];
  private swayLfo: OscillatorNode | null = null;
  private swayGain: GainNode | null = null;
  private stopped = false;

  /** Per-layer mute gain nodes for debugging/tuning */
  private layerGains: Record<string, GainNode> = {};
  private layerMuted: Record<string, boolean> = {};

  static readonly LAYERS = [
    { key: 'sub-bass', label: 'Sub-bass (< 60Hz)' },
    { key: 'low-rumble', label: 'Rombo basso (80-140Hz)' },
    { key: 'mid-rumble', label: 'Rombo medio (140-220Hz)' },
    { key: 'sway', label: 'Oscillazione (sway)' },
    { key: 'resonance', label: 'Risonanze cave' },
    { key: 'bridge', label: 'Ponte' },
  ] as const;

  /** Mute or unmute a specific layer */
  setLayerMuted(layer: string, muted: boolean): void {
    this.layerMuted[layer] = muted;
    const g = this.layerGains[layer];
    if (g) {
      g.gain.value = muted ? 0 : 1;
    }
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
    const subBassOut = this.getLayerOutput(ctx, output, 'sub-bass');
    const lowRumbleOut = this.getLayerOutput(ctx, output, 'low-rumble');
    const midRumbleOut = this.getLayerOutput(ctx, output, 'mid-rumble');
    const swayOut = this.getLayerOutput(ctx, output, 'sway');
    const resonanceOut = this.getLayerOutput(ctx, output, 'resonance');
    const bridgeOut = this.getLayerOutput(ctx, output, 'bridge');

    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    // Shared noise source
    this.rumbleSource = ctx.createBufferSource();
    this.rumbleSource.buffer = buffer;
    this.rumbleSource.loop = true;

    // Overall gain node (bridge still modulates this for the opening effect)
    this.rumbleGain = ctx.createGain();
    this.rumbleGain.gain.value = 1.0;

    // Keep the main LP filter for bridge modulation
    this.rumbleFilter = ctx.createBiquadFilter();
    this.rumbleFilter.type = 'lowpass';
    this.rumbleFilter.frequency.value = 220;
    this.rumbleFilter.Q.value = 0.3;

    this.rumbleSource.connect(this.rumbleFilter);
    this.rumbleFilter.connect(this.rumbleGain);

    // === Sub-bass band: deep vibration under 60Hz ===
    const subBassFilter = ctx.createBiquadFilter();
    subBassFilter.type = 'lowpass';
    subBassFilter.frequency.value = 60;
    subBassFilter.Q.value = 0.5;
    const subBassGain = ctx.createGain();
    subBassGain.gain.value = 0.08;
    this.rumbleGain.connect(subBassFilter);
    subBassFilter.connect(subBassGain);
    subBassGain.connect(subBassOut);

    // === Low rumble band: 80-140Hz — main body + heartbeat ===
    const lowBp = ctx.createBiquadFilter();
    lowBp.type = 'bandpass';
    lowBp.frequency.value = 110;
    lowBp.Q.value = 2.5; // high Q makes 2s loop bump more audible
    const lowGain = ctx.createGain();
    lowGain.gain.value = 0.10;
    this.rumbleGain.connect(lowBp);
    lowBp.connect(lowGain);
    lowGain.connect(lowRumbleOut);

    // === Mid rumble band: 140-220Hz — warmth/presence ===
    const midBp = ctx.createBiquadFilter();
    midBp.type = 'bandpass';
    midBp.frequency.value = 175;
    midBp.Q.value = 0.9;
    const midGain = ctx.createGain();
    midGain.gain.value = 0.04;
    this.rumbleGain.connect(midBp);
    midBp.connect(midGain);
    midGain.connect(midRumbleOut);

    this.activeNodes.push(subBassFilter, subBassGain, lowBp, lowGain, midBp, midGain);

    // === Sway — much gentler, routed through own mutable output ===
    // Sway modulates the overall rumble gain very subtly
    this.swayLfo = ctx.createOscillator();
    this.swayLfo.type = 'sine';
    this.swayLfo.frequency.value = 0.06 + Math.random() * 0.02;
    this.swayGain = ctx.createGain();
    this.swayGain.gain.value = 0.008; // much reduced: was 0.025

    // Sway output: a separate subtle filtered copy that adds body during sway
    const swayFilter = ctx.createBiquadFilter();
    swayFilter.type = 'bandpass';
    swayFilter.frequency.value = 130;
    swayFilter.Q.value = 1.0;
    const swayModGain = ctx.createGain();
    swayModGain.gain.value = 0.03;
    this.rumbleGain.connect(swayFilter);
    swayFilter.connect(swayModGain);
    this.swayLfo.connect(this.swayGain);
    this.swayGain.connect(swayModGain.gain); // modulate the sway band volume
    swayModGain.connect(swayOut);

    // Minimal filter modulation — keeps the rumble alive without drops
    const filterSwayGain = ctx.createGain();
    filterSwayGain.gain.value = 4; // very small: was 10
    this.swayLfo.connect(filterSwayGain);
    filterSwayGain.connect(this.rumbleFilter.frequency);

    this.startLoopingSource(this.rumbleSource);
    this.swayLfo.start();

    this.activeNodes.push(swayFilter, swayModGain, filterSwayGain);

    // Subtle ambient resonance — always present, like distant echoes
    this.createAmbientResonance(ctx, resonanceOut);

    // Occasional bridge crossing
    this.stopped = false;
    this.scheduleBridge(ctx, bridgeOut);
  }

  /**
   * Ambient resonance: subtle hollow character always present.
   * Like the train's sound reflecting off the landscape — tunnels,
   * cuttings, bridges in the distance. Very quiet, with slow
   * modulation.
   */
  private createAmbientResonance(ctx: AudioContext, output: GainNode): void {
    const buf = ctx.createBuffer(1, ctx.sampleRate * 4, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;

    // Low hollow resonance — primary
    const bp1 = ctx.createBiquadFilter();
    bp1.type = 'bandpass';
    bp1.frequency.value = 220 + Math.random() * 40;
    bp1.Q.value = 4.0;

    const gain1 = ctx.createGain();
    gain1.gain.value = 0.008;

    // Second low resonance — slightly different freq for richness
    const bp3 = ctx.createBiquadFilter();
    bp3.type = 'bandpass';
    bp3.frequency.value = 350 + Math.random() * 50;
    bp3.Q.value = 3.5;

    const gain3 = ctx.createGain();
    gain3.gain.value = 0.004;

    // Slow breathing — the resonance swells and recedes
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.03 + Math.random() * 0.02;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.001;

    src.connect(bp1);
    src.connect(bp3);
    bp1.connect(gain1);
    bp3.connect(gain3);
    lfo.connect(lfoGain);
    lfoGain.connect(gain1.gain);
    lfoGain.connect(gain3.gain);
    gain1.connect(output);
    gain3.connect(output);

    this.startLoopingSource(src);
    lfo.start();

    this.activeNodes.push(src, bp1, bp3, gain1, gain3, lfo, lfoGain);
  }

  /**
   * Bridge crossing: the existing rumble transforms — filter opens up
   * to reveal the hollow metallic character of the bridge structure.
   * On top: sharp, clear rhythmic impacts from wheels on bridge joints,
   * with structural echo. The bridge is not a separate sound — it's
   * the train's own rumble changing character.
   */
  private scheduleBridge(ctx: AudioContext, output: GainNode): void {
    if (this.stopped) return;
    const delay = 20000 + Math.random() * 30000;
    this.bridgeTimeout = setTimeout(() => {
      if (this.stopped || ctx.state !== 'running') return;
      this.playBridgeCrossing(ctx, output);
      this.scheduleBridge(ctx, output);
    }, delay);
  }

  private playBridgeCrossing(ctx: AudioContext, output: GainNode): void {
    const now = ctx.currentTime;
    const bridgeDuration = 6 + Math.random() * 5;
    const fadeIn = 3.5;
    const fadeOut = 2.5;

    // === Transform the existing rumble ===
    // Open up the lowpass filter — the rumble becomes more open on the bridge
    if (this.rumbleFilter) {
      this.rumbleFilter.frequency.linearRampToValueAtTime(380, now + fadeIn);
      this.rumbleFilter.Q.linearRampToValueAtTime(0.6, now + fadeIn);
      this.rumbleFilter.frequency.setValueAtTime(380, now + bridgeDuration - fadeOut);
      this.rumbleFilter.frequency.linearRampToValueAtTime(220, now + bridgeDuration);
      this.rumbleFilter.Q.linearRampToValueAtTime(0.3, now + bridgeDuration);
    }

    // Gentle volume increase during bridge — rumbleGain is 1.0 hub
    if (this.rumbleGain) {
      this.rumbleGain.gain.linearRampToValueAtTime(1.15, now + fadeIn);
      this.rumbleGain.gain.setValueAtTime(1.15, now + bridgeDuration - fadeOut);
      this.rumbleGain.gain.linearRampToValueAtTime(1.0, now + bridgeDuration);
    }

    // === Added metallic resonance on top of the transformed rumble ===
    const resLen = Math.ceil(ctx.sampleRate * (bridgeDuration + 1));
    const resBuf = ctx.createBuffer(1, resLen, ctx.sampleRate);
    const resData = resBuf.getChannelData(0);
    for (let i = 0; i < resLen; i++) {
      resData[i] = Math.random() * 2 - 1;
    }

    const resSrc = ctx.createBufferSource();
    resSrc.buffer = resBuf;

    // Hollow mid-frequency resonance — blends with the opened rumble
    const bp1 = ctx.createBiquadFilter();
    bp1.type = 'bandpass';
    bp1.frequency.value = 350 + Math.random() * 80;
    bp1.Q.value = 2.5;

    const resGain1 = ctx.createGain();
    resGain1.gain.setValueAtTime(0.0001, now);
    resGain1.gain.linearRampToValueAtTime(0.004, now + fadeIn);
    resGain1.gain.setValueAtTime(0.004, now + bridgeDuration - fadeOut);
    resGain1.gain.linearRampToValueAtTime(0.0001, now + bridgeDuration);

    resSrc.connect(bp1);
    bp1.connect(resGain1);
    resGain1.connect(output);
    resSrc.start(now);
    resSrc.stop(now + bridgeDuration + 0.5);

    this.activeNodes.push(resSrc, bp1, resGain1);
    resSrc.onended = () => {
      resSrc.disconnect(); bp1.disconnect(); resGain1.disconnect();
      this.activeNodes = this.activeNodes.filter(
        (n) => n !== resSrc && n !== bp1 && n !== resGain1
      );
    };
  }

  protected teardownAudioGraph(): void {
    this.stopped = true;
    if (this.bridgeTimeout) { clearTimeout(this.bridgeTimeout); this.bridgeTimeout = null; }
    if (this.swayLfo) { try { this.swayLfo.stop(); } catch { /* ok */ } this.swayLfo.disconnect(); this.swayLfo = null; }
    if (this.swayGain) { this.swayGain.disconnect(); this.swayGain = null; }
    for (const node of this.activeNodes) {
      try { (node as AudioBufferSourceNode).stop?.(); } catch { /* ok */ }
      node.disconnect();
    }
    this.activeNodes = [];
    if (this.rumbleSource) {
      this.rumbleSource.onended = null;
      try { this.rumbleSource.stop(); } catch { /* ok */ }
      this.rumbleSource.disconnect();
      this.rumbleSource = null;
    }
    if (this.rumbleFilter) { this.rumbleFilter.disconnect(); this.rumbleFilter = null; }
    if (this.rumbleGain) { this.rumbleGain.disconnect(); this.rumbleGain = null; }
    for (const g of Object.values(this.layerGains)) {
      g.disconnect();
    }
    this.layerGains = {};
  }
}
