import type { SoundCategory } from '../../types';
import { BaseSoundGenerator } from '../base-generator';

/**
 * Deep Water sound generator — submerged underwater ambience.
 *
 * Technique: Brown noise with lowpass for submerged feel + resonant
 * bubble bursts at random intervals + "water drip" sine pings with
 * pitch bend + slow current modulation.
 */
export class DeepWaterGenerator extends BaseSoundGenerator {
  readonly id = 'deep-water';
  readonly name = 'Deep Water';
  readonly category: SoundCategory = 'basic';

  private source: AudioBufferSourceNode | null = null;
  private lowpass: BiquadFilterNode | null = null;
  private bubbleSource: AudioBufferSourceNode | null = null;
  private bubbleFilter: BiquadFilterNode | null = null;
  private bubbleGain: GainNode | null = null;
  private lfo: OscillatorNode | null = null;
  private lfoGain: GainNode | null = null;
  private bubbleLfo: OscillatorNode | null = null;
  private bubbleLfoGain: GainNode | null = null;
  private dripTimeout: ReturnType<typeof setTimeout> | null = null;
  private activeNodes: AudioNode[] = [];
  private stopped = false;

  protected buildAudioGraph(ctx: AudioContext, output: GainNode): void {
    // Layer 1: Deep brown noise — submerged pressure
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      lastOut = (lastOut + 0.02 * white) / 1.02;
      data[i] = lastOut * 3.5;
    }

    this.source = ctx.createBufferSource();
    this.source.buffer = buffer;
    this.source.loop = true;

    this.lowpass = ctx.createBiquadFilter();
    this.lowpass.type = 'lowpass';
    this.lowpass.frequency.value = 200;
    this.lowpass.Q.value = 0.5;

    this.source.connect(this.lowpass);
    this.lowpass.connect(output);
    this.startLoopingSource(this.source);

    // LFO on the lowpass for slow current movement
    this.lfo = ctx.createOscillator();
    this.lfo.type = 'sine';
    this.lfo.frequency.value = 0.04 + Math.random() * 0.03;
    this.lfoGain = ctx.createGain();
    this.lfoGain.gain.value = 80;
    this.lfo.connect(this.lfoGain);
    this.lfoGain.connect(this.lowpass.frequency);
    this.lfo.start();

    // Layer 2: Continuous bubble texture — bandpass noise with modulation
    const bubbleBuf = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const bubbleData = bubbleBuf.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      bubbleData[i] = Math.random() * 2 - 1;
    }

    this.bubbleSource = ctx.createBufferSource();
    this.bubbleSource.buffer = bubbleBuf;
    this.bubbleSource.loop = true;

    this.bubbleFilter = ctx.createBiquadFilter();
    this.bubbleFilter.type = 'bandpass';
    this.bubbleFilter.frequency.value = 400;
    this.bubbleFilter.Q.value = 8;

    this.bubbleGain = ctx.createGain();
    this.bubbleGain.gain.value = 0.03;

    // Modulate bubble filter for watery movement
    this.bubbleLfo = ctx.createOscillator();
    this.bubbleLfo.type = 'sine';
    this.bubbleLfo.frequency.value = 0.3 + Math.random() * 0.2;
    this.bubbleLfoGain = ctx.createGain();
    this.bubbleLfoGain.gain.value = 200;
    this.bubbleLfo.connect(this.bubbleLfoGain);
    this.bubbleLfoGain.connect(this.bubbleFilter.frequency);

    this.bubbleSource.connect(this.bubbleFilter);
    this.bubbleFilter.connect(this.bubbleGain);
    this.bubbleGain.connect(output);
    this.startLoopingSource(this.bubbleSource);
    this.bubbleLfo.start();

    // Layer 3: Occasional "drip" pings — resonant sine with pitch bend
    this.stopped = false;
    this.scheduleDrip(ctx, output);
  }

  private scheduleDrip(ctx: AudioContext, output: GainNode): void {
    if (this.stopped) return;
    const delay = 1500 + Math.random() * 4000;
    this.dripTimeout = setTimeout(() => {
      if (this.stopped || ctx.state !== 'running') return;
      this.playDrip(ctx, output);
      this.scheduleDrip(ctx, output);
    }, delay);
  }

  private playDrip(ctx: AudioContext, output: GainNode): void {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    const startFreq = 800 + Math.random() * 600;
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(startFreq * 0.5, now + 0.15);

    const vol = 0.006 + Math.random() * 0.008;
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12 + Math.random() * 0.08);

    osc.connect(gain);
    gain.connect(output);
    osc.start(now);
    osc.stop(now + 0.25);

    this.activeNodes.push(osc, gain);
    osc.onended = () => {
      osc.disconnect(); gain.disconnect();
      this.activeNodes = this.activeNodes.filter((n) => n !== osc && n !== gain);
    };
  }

  protected teardownAudioGraph(): void {
    this.stopped = true;
    if (this.dripTimeout) { clearTimeout(this.dripTimeout); this.dripTimeout = null; }
    for (const osc of [this.lfo, this.bubbleLfo]) {
      if (osc) { try { osc.stop(); } catch { /* already stopped */ } osc.disconnect(); }
    }
    this.lfo = null;
    this.bubbleLfo = null;
    for (const g of [this.lfoGain, this.bubbleLfoGain]) {
      if (g) g.disconnect();
    }
    this.lfoGain = null;
    this.bubbleLfoGain = null;
    for (const src of [this.source, this.bubbleSource]) {
      if (src) {
        src.onended = null;
        try { src.stop(); } catch { /* already stopped */ }
        src.disconnect();
      }
    }
    this.source = null;
    this.bubbleSource = null;
    for (const node of [this.lowpass, this.bubbleFilter, this.bubbleGain]) {
      if (node) node.disconnect();
    }
    this.lowpass = null;
    this.bubbleFilter = null;
    this.bubbleGain = null;
    for (const node of this.activeNodes) {
      try { (node as OscillatorNode).stop?.(); } catch { /* ok */ }
      node.disconnect();
    }
    this.activeNodes = [];
  }
}
