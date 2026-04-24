import type { SoundCategory } from '../../types';
import { BaseSoundGenerator } from '../base-generator';

/**
 * Coffee shop ambient sound generator — indoor cafe.
 *
 * Technique: Heavily muffled pink noise for enclosed room murmur +
 * occasional cup clinks (high sine bursts through lowpass for
 * indoor damping) + a low rumble layer for room/HVAC presence.
 */
export class CoffeeShopGenerator extends BaseSoundGenerator {
  readonly id = 'coffee-shop';
  readonly name = 'Coffee Shop';
  readonly category: SoundCategory = 'basic';

  private murmurSource: AudioBufferSourceNode | null = null;
  private murmurFilter: BiquadFilterNode | null = null;
  private murmurGain: GainNode | null = null;
  private roomSource: AudioBufferSourceNode | null = null;
  private roomFilter: BiquadFilterNode | null = null;
  private roomGain: GainNode | null = null;
  private clinkTimeout: ReturnType<typeof setTimeout> | null = null;
  private activeOscillators: OscillatorNode[] = [];
  private stopped = false;

  protected buildAudioGraph(ctx: AudioContext, output: GainNode): void {
    // Background murmur: pink-ish noise, heavily lowpassed for indoor feel
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    // Pink noise approximation (Paul Kellet's algorithm)
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.969 * b2 + white * 0.153852;
      b3 = 0.8665 * b3 + white * 0.3104856;
      b4 = 0.55 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.016898;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }

    this.murmurSource = ctx.createBufferSource();
    this.murmurSource.buffer = buffer;
    this.murmurSource.loop = true;

    // Very low cutoff for muffled, enclosed sound
    this.murmurFilter = ctx.createBiquadFilter();
    this.murmurFilter.type = 'lowpass';
    this.murmurFilter.frequency.value = 500;
    this.murmurFilter.Q.value = 0.5;

    this.murmurGain = ctx.createGain();
    this.murmurGain.gain.value = 0.18;

    this.murmurSource.connect(this.murmurFilter);
    this.murmurFilter.connect(this.murmurGain);
    this.murmurGain.connect(output);
    this.startLoopingSource(this.murmurSource);

    // Room presence — low rumble (HVAC, room tone)
    const roomBuf = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const roomData = roomBuf.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      roomData[i] = Math.random() * 2 - 1;
    }

    this.roomSource = ctx.createBufferSource();
    this.roomSource.buffer = roomBuf;
    this.roomSource.loop = true;

    this.roomFilter = ctx.createBiquadFilter();
    this.roomFilter.type = 'lowpass';
    this.roomFilter.frequency.value = 120;

    this.roomGain = ctx.createGain();
    this.roomGain.gain.value = 0.06;

    this.roomSource.connect(this.roomFilter);
    this.roomFilter.connect(this.roomGain);
    this.roomGain.connect(output);
    this.startLoopingSource(this.roomSource);

    // Random clinks — muffled for indoor
    this.stopped = false;
    this.scheduleClink(ctx, output);
  }

  private scheduleClink(ctx: AudioContext, output: GainNode): void {
    if (this.stopped) return;
    const delay = 1500 + Math.random() * 3000;
    this.clinkTimeout = setTimeout(() => {
      if (this.stopped || ctx.state !== 'running') return;
      this.playClink(ctx, output);
      this.scheduleClink(ctx, output);
    }, delay);
  }

  private playClink(ctx: AudioContext, output: GainNode): void {
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const clinkGain = ctx.createGain();

    osc.type = 'sine';
    // Indoor clinks — slightly lower and damped
    osc.frequency.value = 1500 + Math.random() * 2000;

    // Lowpass to muffle the clink (indoor)
    filter.type = 'lowpass';
    filter.frequency.value = 3000 + Math.random() * 1000;

    clinkGain.gain.setValueAtTime(0.008 + Math.random() * 0.012, ctx.currentTime);
    clinkGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.06 + Math.random() * 0.04);

    osc.connect(filter);
    filter.connect(clinkGain);
    clinkGain.connect(output);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.12);

    this.activeOscillators.push(osc);
    osc.onended = () => {
      osc.disconnect();
      filter.disconnect();
      clinkGain.disconnect();
      this.activeOscillators = this.activeOscillators.filter((o) => o !== osc);
    };
  }

  protected teardownAudioGraph(): void {
    this.stopped = true;
    if (this.clinkTimeout) {
      clearTimeout(this.clinkTimeout);
      this.clinkTimeout = null;
    }
    for (const osc of this.activeOscillators) {
      try { osc.stop(); } catch { /* already stopped */ }
      osc.disconnect();
    }
    this.activeOscillators = [];

    for (const src of [this.murmurSource, this.roomSource]) {
      if (src) {
        src.onended = null;
        try { src.stop(); } catch { /* already stopped */ }
        src.disconnect();
      }
    }
    this.murmurSource = null;
    this.roomSource = null;
    for (const node of [this.murmurFilter, this.murmurGain, this.roomFilter, this.roomGain]) {
      if (node) node.disconnect();
    }
    this.murmurFilter = null;
    this.murmurGain = null;
    this.roomFilter = null;
    this.roomGain = null;
  }
}
