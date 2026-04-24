import type { SoundGenerator, SoundCategory } from '../types';

/**
 * Base class for all sound generators.
 * Centralizes common logic: volume clamping, state tracking, lifecycle.
 * 
 * SOLID: Single Responsibility — only shared generator concerns.
 * Concrete generators override buildAudioGraph() and teardownAudioGraph().
 */
export abstract class BaseSoundGenerator implements SoundGenerator {
  abstract readonly id: string;
  abstract readonly name: string;
  abstract readonly category: SoundCategory;

  protected ctx: AudioContext | null = null;
  protected destination: AudioNode | null = null;
  protected gainNode: GainNode | null = null;
  private _volume = 0;
  protected _playing = false;
  protected _disposed = false;

  connect(ctx: AudioContext, destination: AudioNode): void {
    this.ctx = ctx;
    this.destination = destination;
    this.gainNode = ctx.createGain();
    this.gainNode.gain.value = this._volume;
    this.gainNode.connect(destination);
  }

  start(): void {
    if (this._playing || this._disposed || !this.ctx || !this.gainNode) return;
    this._playing = true;
    this.buildAudioGraph(this.ctx, this.gainNode);
  }

  stop(): void {
    if (!this._playing) return;
    this._playing = false;
    this.teardownAudioGraph();
  }

  setVolume(volume: number): void {
    this._volume = Math.max(0, Math.min(1, volume));
    if (this.gainNode) {
      this.gainNode.gain.value = this._volume;
    }
  }

  getVolume(): number {
    return this._volume;
  }

  isPlaying(): boolean {
    return this._playing;
  }

  dispose(): void {
    this.stop();
    if (this.gainNode) {
      this.gainNode.disconnect();
      this.gainNode = null;
    }
    this._disposed = true;
    this.ctx = null;
    this.destination = null;
  }

  /**
   * Build the Web Audio graph specific to this sound.
   * Called when start() is invoked. Override in subclasses.
   */
  protected abstract buildAudioGraph(ctx: AudioContext, output: GainNode): void;

  /**
   * Tear down the Web Audio graph. Called when stop() is invoked.
   * Override in subclasses to clean up oscillators, buffers, etc.
   */
  protected abstract teardownAudioGraph(): void;

  /**
   * Start a buffer source with loop=true and auto-restart on unexpected end.
   * Guards against browsers that fail to loop AudioBufferSourceNode.
   */
  protected startLoopingSource(source: AudioBufferSourceNode): void {
    source.loop = true;
    source.onended = () => {
      if (this._playing && !this._disposed && this.ctx && this.gainNode) {
        this.teardownAudioGraph();
        this.buildAudioGraph(this.ctx, this.gainNode);
      }
    };
    source.start();
  }
}
