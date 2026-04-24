import type { SoundCategory } from '../../types';
import { BaseSoundGenerator } from '../base-generator';

/**
 * Heavy Downpour — intense, dense rain with low rumble.
 *
 * Technique: Broadband noise with lower-frequency bandpass for heavy rain,
 * boosted low-end rumble layer, and intermittent background thunder
 * that randomly fades in and out for natural variation.
 */
export class HeavyDownpourGenerator extends BaseSoundGenerator {
  readonly id = 'heavy-downpour';
  readonly name = 'Heavy Downpour';
  readonly category: SoundCategory = 'basic';

  private noiseSource: AudioBufferSourceNode | null = null;
  private bandpass: BiquadFilterNode | null = null;
  private mainGain: GainNode | null = null;
  private midSource: AudioBufferSourceNode | null = null;
  private midFilter: BiquadFilterNode | null = null;
  private midGain: GainNode | null = null;
  private shimmerSource: AudioBufferSourceNode | null = null;
  private shimmerFilter: BiquadFilterNode | null = null;
  private shimmerGain: GainNode | null = null;
  private rumbleSource: AudioBufferSourceNode | null = null;
  private rumbleFilter: BiquadFilterNode | null = null;
  private rumbleGain: GainNode | null = null;
  private intensityLfo: OscillatorNode | null = null;
  private intensityLfoGain: GainNode | null = null;
  private dripTimeout: ReturnType<typeof setTimeout> | null = null;
  private thunderSource: AudioBufferSourceNode | null = null;
  private thunderFilter: BiquadFilterNode | null = null;
  private thunderGain: GainNode | null = null;
  private thunderTimeout: ReturnType<typeof setTimeout> | null = null;
  private lightningTimeout: ReturnType<typeof setTimeout> | null = null;
  private activeNodes: AudioNode[] = [];
  private activeTimeouts: ReturnType<typeof setTimeout>[] = [];

  protected buildAudioGraph(ctx: AudioContext, output: GainNode): void {
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    // Master rain gain — all rain layers go through this for thunder surge control
    this.mainGain = ctx.createGain();
    this.mainGain.gain.value = 1.0;
    this.mainGain.connect(output);

    // Layer 1: Deep drops — low-freq "thud" of big fat raindrops
    this.noiseSource = ctx.createBufferSource();
    this.noiseSource.buffer = buffer;
    this.noiseSource.loop = true;

    this.bandpass = ctx.createBiquadFilter();
    this.bandpass.type = 'bandpass';
    this.bandpass.frequency.value = 250;
    this.bandpass.Q.value = 0.3;

    const deepGain = ctx.createGain();
    deepGain.gain.value = 0.025;

    this.noiseSource.connect(this.bandpass);
    this.bandpass.connect(deepGain);
    deepGain.connect(this.mainGain);
    this.startLoopingSource(this.noiseSource);

    // Layer 2: Mid rain body — the core "shhh" of rain on pavement
    const midBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const midData = midBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      midData[i] = Math.random() * 2 - 1;
    }
    this.midSource = ctx.createBufferSource();
    this.midSource.buffer = midBuffer;
    this.midSource.loop = true;

    this.midFilter = ctx.createBiquadFilter();
    this.midFilter.type = 'bandpass';
    this.midFilter.frequency.value = 500;
    this.midFilter.Q.value = 0.25;

    this.midGain = ctx.createGain();
    this.midGain.gain.value = 0.02;

    this.midSource.connect(this.midFilter);
    this.midFilter.connect(this.midGain);
    this.midGain.connect(this.mainGain);
    this.startLoopingSource(this.midSource);

    // Layer 3: High shimmer — spray, tiny droplets, splashes
    const shimmerBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const shimmerData = shimmerBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      shimmerData[i] = Math.random() * 2 - 1;
    }
    this.shimmerSource = ctx.createBufferSource();
    this.shimmerSource.buffer = shimmerBuffer;
    this.shimmerSource.loop = true;

    this.shimmerFilter = ctx.createBiquadFilter();
    this.shimmerFilter.type = 'highpass';
    this.shimmerFilter.frequency.value = 3000;

    this.shimmerGain = ctx.createGain();
    this.shimmerGain.gain.value = 0.005;

    this.shimmerSource.connect(this.shimmerFilter);
    this.shimmerFilter.connect(this.shimmerGain);
    this.shimmerGain.connect(this.mainGain);
    this.startLoopingSource(this.shimmerSource);

    // Layer 4: Low rumble — weight of dense rain
    this.rumbleSource = ctx.createBufferSource();
    this.rumbleSource.buffer = buffer;
    this.rumbleSource.loop = true;

    this.rumbleFilter = ctx.createBiquadFilter();
    this.rumbleFilter.type = 'lowpass';
    this.rumbleFilter.frequency.value = 150;

    this.rumbleGain = ctx.createGain();
    this.rumbleGain.gain.value = 0.04;

    this.rumbleSource.connect(this.rumbleFilter);
    this.rumbleFilter.connect(this.rumbleGain);
    this.rumbleGain.connect(this.mainGain);
    this.startLoopingSource(this.rumbleSource);

    // Slow intensity variation on the mid layer
    this.intensityLfo = ctx.createOscillator();
    this.intensityLfo.type = 'sine';
    this.intensityLfo.frequency.value = 0.07;
    this.intensityLfoGain = ctx.createGain();
    this.intensityLfoGain.gain.value = 0.03;
    this.intensityLfo.connect(this.intensityLfoGain);
    this.intensityLfoGain.connect(this.midGain.gain);
    this.intensityLfo.start();

    // Layer 5: Random drip impacts — individual drops hitting puddles
    this.scheduleDrip(ctx, output);

    // Background thunder — intermittent, sometimes silent
    const thunderBuf = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const tData = thunderBuf.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      tData[i] = Math.random() * 2 - 1;
    }

    this.thunderSource = ctx.createBufferSource();
    this.thunderSource.buffer = thunderBuf;
    this.thunderSource.loop = true;

    this.thunderFilter = ctx.createBiquadFilter();
    this.thunderFilter.type = 'lowpass';
    this.thunderFilter.frequency.value = 120;

    this.thunderGain = ctx.createGain();
    this.thunderGain.gain.value = 0;

    this.thunderSource.connect(this.thunderFilter);
    this.thunderFilter.connect(this.thunderGain);
    this.thunderGain.connect(output);
    this.startLoopingSource(this.thunderSource);

    this.scheduleThunderCycle(ctx);
    this.scheduleLightning(ctx, output);
  }

  private scheduleLightning(ctx: AudioContext, output: GainNode): void {
    // Highly variable interval — long silences make the next one surprising
    const roll = Math.random();
    let delay: number;
    if (roll < 0.15) {
      delay = 3000 + Math.random() * 3000; // 15% quick follow-up (3-6s)
    } else if (roll < 0.5) {
      delay = 10000 + Math.random() * 10000; // 35% normal (10-20s)
    } else if (roll < 0.8) {
      delay = 20000 + Math.random() * 20000; // 30% long wait (20-40s)
    } else {
      delay = 40000 + Math.random() * 25000; // 20% very long wait (40-65s) — forgot about it, then BAM
    }

    this.lightningTimeout = setTimeout(() => {
      if (ctx.state !== 'running') {
        this.scheduleLightning(ctx, output);
        return;
      }

      // Random volume class: distant (small), normal, or close (massive)
      const roll = Math.random();
      let volumeScale: number;
      if (roll < 0.2) {
        volumeScale = 0.15 + Math.random() * 0.15; // very distant — barely there
      } else if (roll < 0.4) {
        volumeScale = 0.3 + Math.random() * 0.2; // distant
      } else if (roll < 0.75) {
        volumeScale = 0.7 + Math.random() * 0.3; // normal
      } else {
        volumeScale = 1.0 + Math.random() * 0.3; // close — terrifying
      }

      // For close strikes: brief eerie calm before the boom
      if (volumeScale > 0.9 && this.mainGain) {
        const now = ctx.currentTime;
        this.mainGain.gain.cancelScheduledValues(now);
        this.mainGain.gain.setValueAtTime(this.mainGain.gain.value, now);
        this.mainGain.gain.linearRampToValueAtTime(0.4, now + 0.8); // rain drops low
        // The boom will come ~1s later, then surgeRainAfterThunder restores it
      }
      const boomDelay = volumeScale > 0.9 ? 1000 : 0;

      const boomTimeout = setTimeout(() => {
        if (ctx.state !== 'running' || !this._playing) return;

        // How many strikes in this sequence? Almost never single
        const seqRoll = Math.random();
        let strikeCount: number;
        if (seqRoll < 0.1) {
          strikeCount = 1; // rare single
        } else if (seqRoll < 0.4) {
          strikeCount = 2;
        } else if (seqRoll < 0.7) {
          strikeCount = 3;
        } else if (seqRoll < 0.9) {
          strikeCount = 4;
        } else {
          strikeCount = 5;
        }

        // Play the sequence
        let cumulativeDelay = 0;
        for (let i = 0; i < strikeCount; i++) {
          const strikeScale = i === 0
            ? volumeScale
            : volumeScale * (0.3 + Math.random() * 0.7);
          const strikeDelay = cumulativeDelay;
          const strikeTimeout = setTimeout(() => {
            if (ctx.state === 'running' && this._playing) {
              this.playLightningCrack(ctx, output, strikeScale);
            }
          }, strikeDelay);
          this.activeTimeouts.push(strikeTimeout);
          cumulativeDelay += 1500 + Math.random() * 3000;
        }

        // Rain surge tied to the strongest strike
        this.surgeRainAfterThunder(ctx, volumeScale);

        // 40% chance of a distant rumble 5-12s after the sequence
        if (Math.random() < 0.4) {
          const distantDelay = cumulativeDelay + 3000 + Math.random() * 7000;
          const distantScale = 0.1 + Math.random() * 0.15;
          const distantTimeout = setTimeout(() => {
            if (ctx.state === 'running' && this._playing) {
              this.playLightningCrack(ctx, output, distantScale);
            }
          }, distantDelay);
          this.activeTimeouts.push(distantTimeout);
        }
      }, boomDelay);
      this.activeTimeouts.push(boomTimeout);

      this.scheduleLightning(ctx, output);
    }, delay);
  }

  /** After thunder, rain surges up then slowly returns */
  private surgeRainAfterThunder(ctx: AudioContext, intensity: number): void {
    if (!this.mainGain) return;
    const now = ctx.currentTime;
    const baseVol = 1.0;
    const surgeVol = 1.0 + 0.5 * intensity;
    const surgeDuration = 10 + intensity * 8;

    // Whole rain bus surges together
    this.mainGain.gain.cancelScheduledValues(now);
    this.mainGain.gain.setValueAtTime(this.mainGain.gain.value, now);
    this.mainGain.gain.linearRampToValueAtTime(surgeVol, now + 4);
    this.mainGain.gain.setValueAtTime(surgeVol, now + surgeDuration * 0.35);
    this.mainGain.gain.linearRampToValueAtTime(baseVol, now + surgeDuration);
  }

  private playLightningCrack(ctx: AudioContext, output: GainNode, volumeScale: number = 1): void {
    const now = ctx.currentTime;
    const bufferSize = ctx.sampleRate * 2;
    const buf = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      d[i] = Math.random() * 2 - 1;
    }

    // Rolling thunder — the main event
    const rumbleSrc = ctx.createBufferSource();
    rumbleSrc.buffer = buf;
    rumbleSrc.loop = true;
    const rumbleLow = ctx.createBiquadFilter();
    rumbleLow.type = 'lowpass';
    rumbleLow.frequency.value = 300;
    const rumbleGain = ctx.createGain();
    const rumbleDuration = 9 + Math.random() * 6;
    const rumbleVol = (2.0 + Math.random() * 1.0) * volumeScale;
    const rumbleDelay = 0.08;
    const fadeOutDuration = 4;
    // BOOM — massive wall of sound
    rumbleGain.gain.setValueAtTime(0, now);
    rumbleGain.gain.linearRampToValueAtTime(rumbleVol, now + rumbleDelay + 0.05);
    // Sustain the overwhelming peak
    rumbleGain.gain.setValueAtTime(rumbleVol, now + rumbleDelay + 1.0);
    // Drop to rolling level
    const rollVol = rumbleVol * 0.35;
    rumbleGain.gain.linearRampToValueAtTime(rollVol, now + rumbleDelay + 2.0);
    // Rolling wobble — only in the middle section, leaving room for fade-out
    const peaks = 3 + Math.floor(Math.random() * 3);
    const rollStart = rumbleDelay + 2.0;
    const rollEnd = rumbleDelay + rumbleDuration - fadeOutDuration;
    const wobbleDuration = Math.max(0, rollEnd - rollStart);
    if (wobbleDuration > 0) {
      for (let i = 0; i < peaks; i++) {
        const t = rollStart + (wobbleDuration / peaks) * i;
        const peakVol = rollVol * (0.6 + Math.random() * 0.4);
        const dipVol = rollVol * (0.3 + Math.random() * 0.2);
        rumbleGain.gain.linearRampToValueAtTime(peakVol, now + t);
        rumbleGain.gain.linearRampToValueAtTime(dipVol, now + t + (wobbleDuration / peaks) * 0.5);
      }
      // Ensure we're at a known level before fade-out begins
      rumbleGain.gain.linearRampToValueAtTime(rollVol * 0.3, now + rollEnd);
    }
    // Very slow final fade-out — always has room to breathe
    rumbleGain.gain.linearRampToValueAtTime(rollVol * 0.08, now + rumbleDelay + rumbleDuration - 1);
    rumbleGain.gain.linearRampToValueAtTime(0.0001, now + rumbleDelay + rumbleDuration);
    rumbleSrc.connect(rumbleLow);
    rumbleLow.connect(rumbleGain);
    rumbleGain.connect(output);
    rumbleSrc.start(now);
    rumbleSrc.stop(now + rumbleDelay + rumbleDuration + 0.5);
    rumbleSrc.onended = () => { rumbleSrc.disconnect(); rumbleLow.disconnect(); rumbleGain.disconnect(); this.activeNodes = this.activeNodes.filter(n => n !== rumbleSrc); };
    this.activeNodes.push(rumbleSrc);

    // 3. Echo reflections — short, subtle
    const echoCount = 1 + Math.floor(Math.random() * 2); // 1-2 echoes
    for (let i = 0; i < echoCount; i++) {
      const echoDelay = rumbleDelay + 1.5 + (i + 1) * (1.5 + Math.random() * 1.5);
      const echoVol = rumbleVol * (0.10 / (i + 1));
      const echoDuration = 1.5 + Math.random() * 1.5;
      const echoFade = echoDuration * 0.5; // half the duration is fade-out
      const echoSrc = ctx.createBufferSource();
      echoSrc.buffer = buf;
      echoSrc.loop = true;
      const echoFilter = ctx.createBiquadFilter();
      echoFilter.type = 'lowpass';
      echoFilter.frequency.value = 160 - i * 30; // each echo duller
      const echoGain = ctx.createGain();
      echoGain.gain.setValueAtTime(0, now + echoDelay);
      echoGain.gain.linearRampToValueAtTime(echoVol, now + echoDelay + 0.1);
      echoGain.gain.setValueAtTime(echoVol, now + echoDelay + echoDuration - echoFade);
      echoGain.gain.linearRampToValueAtTime(0.0001, now + echoDelay + echoDuration);
      echoSrc.connect(echoFilter);
      echoFilter.connect(echoGain);
      echoGain.connect(output);
      echoSrc.start(now + echoDelay);
      echoSrc.stop(now + echoDelay + echoDuration + 0.5);
      echoSrc.onended = () => { echoSrc.disconnect(); echoFilter.disconnect(); echoGain.disconnect(); this.activeNodes = this.activeNodes.filter(n => n !== echoSrc); };
      this.activeNodes.push(echoSrc);
    }
  }

  private scheduleThunderCycle(ctx: AudioContext): void {
    if (!this.thunderGain) return;

    const now = ctx.currentTime;
    const silent = Math.random() < 0.4; // 40% chance of silence

    if (silent) {
      // Stay silent for 5-15 seconds
      this.thunderGain.gain.setValueAtTime(0, now);
      const silenceDuration = 5000 + Math.random() * 10000;
      this.thunderTimeout = setTimeout(() => this.scheduleThunderCycle(ctx), silenceDuration);
    } else {
      // Fade in thunder rumble, hold, then fade out
      const volume = 0.15 + Math.random() * 0.1;
      const fadeIn = 1.5 + Math.random() * 2;
      const hold = 3 + Math.random() * 6;
      const fadeOut = 2 + Math.random() * 3;
      this.thunderGain.gain.setValueAtTime(0, now);
      this.thunderGain.gain.linearRampToValueAtTime(volume, now + fadeIn);
      this.thunderGain.gain.setValueAtTime(volume, now + fadeIn + hold);
      this.thunderGain.gain.linearRampToValueAtTime(0, now + fadeIn + hold + fadeOut);
      const totalMs = (fadeIn + hold + fadeOut) * 1000 + 500;
      this.thunderTimeout = setTimeout(() => this.scheduleThunderCycle(ctx), totalMs);
    }
  }

  private scheduleDrip(ctx: AudioContext, output: GainNode): void {
    const delay = 40 + Math.random() * 160; // moderate density
    this.dripTimeout = setTimeout(() => {
      if (ctx.state !== 'running') {
        this.scheduleDrip(ctx, output);
        return;
      }
      this.playDrip(ctx, output);
      this.scheduleDrip(ctx, output);
    }, delay);
  }

  private playDrip(ctx: AudioContext, output: GainNode): void {
    const now = ctx.currentTime;
    // All drips are noise-based — no sine oscillators = no metallic/electronic feel
    const roll = Math.random();
    const bufLen = Math.floor(ctx.sampleRate * 0.1);
    const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) {
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufLen, 2); // fast-decaying noise
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filt = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    if (roll < 0.5) {
      // Fat raindrop — low thump on puddle
      filt.type = 'lowpass';
      filt.frequency.value = 250 + Math.random() * 200;
      const vol = 0.015 + Math.random() * 0.02;
      gain.gain.setValueAtTime(vol, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06 + Math.random() * 0.04);
    } else if (roll < 0.8) {
      // Medium splash
      filt.type = 'bandpass';
      filt.frequency.value = 500 + Math.random() * 500;
      filt.Q.value = 0.4;
      const vol = 0.01 + Math.random() * 0.015;
      gain.gain.setValueAtTime(vol, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04 + Math.random() * 0.03);
    } else {
      // Heavy splat on hard surface
      filt.type = 'bandpass';
      filt.frequency.value = 300 + Math.random() * 400;
      filt.Q.value = 0.3;
      const vol = 0.02 + Math.random() * 0.025;
      gain.gain.setValueAtTime(vol, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05 + Math.random() * 0.04);
    }

    src.connect(filt);
    filt.connect(gain);
    gain.connect(output);
    src.start(now);
    src.stop(now + 0.12);
    src.onended = () => { src.disconnect(); filt.disconnect(); gain.disconnect(); this.activeNodes = this.activeNodes.filter(n => n !== src); };
    this.activeNodes.push(src);
  }

  protected teardownAudioGraph(): void {
    if (this.thunderTimeout) {
      clearTimeout(this.thunderTimeout);
      this.thunderTimeout = null;
    }
    if (this.lightningTimeout) {
      clearTimeout(this.lightningTimeout);
      this.lightningTimeout = null;
    }
    if (this.dripTimeout) {
      clearTimeout(this.dripTimeout);
      this.dripTimeout = null;
    }
    for (const t of this.activeTimeouts) {
      clearTimeout(t);
    }
    this.activeTimeouts = [];
    for (const node of this.activeNodes) {
      try { (node as AudioBufferSourceNode).stop(); } catch { /* ok */ }
      node.disconnect();
    }
    this.activeNodes = [];
    if (this.intensityLfo) {
      try { this.intensityLfo.stop(); } catch { /* already stopped */ }
      this.intensityLfo.disconnect();
      this.intensityLfo = null;
    }
    if (this.intensityLfoGain) {
      this.intensityLfoGain.disconnect();
      this.intensityLfoGain = null;
    }
    for (const src of [this.noiseSource, this.midSource, this.shimmerSource, this.rumbleSource, this.thunderSource]) {
      if (src) {
        src.onended = null;
        try { src.stop(); } catch { /* already stopped */ }
        src.disconnect();
      }
    }
    this.noiseSource = null;
    this.midSource = null;
    this.shimmerSource = null;
    this.rumbleSource = null;
    this.thunderSource = null;
    for (const node of [this.bandpass, this.mainGain, this.midFilter, this.midGain, this.shimmerFilter, this.shimmerGain, this.rumbleFilter, this.rumbleGain, this.thunderFilter, this.thunderGain]) {
      if (node) node.disconnect();
    }
    this.bandpass = null;
    this.mainGain = null;
    this.midFilter = null;
    this.midGain = null;
    this.shimmerFilter = null;
    this.shimmerGain = null;
    this.rumbleFilter = null;
    this.rumbleGain = null;
    this.thunderFilter = null;
    this.thunderGain = null;
  }
}
