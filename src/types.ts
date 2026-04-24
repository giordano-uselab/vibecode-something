/**
 * Core interface for all sound generators.
 * Every sound in Nois — basic or complex — implements this contract.
 *
 * SOLID: Interface Segregation — only what's needed.
 * SOLID: Liskov Substitution — any implementation is swappable.
 */
export interface SoundGenerator {
  readonly id: string;
  readonly name: string;
  readonly category: SoundCategory;

  /** Connect this generator's audio graph to the given destination. */
  connect(ctx: AudioContext, destination: AudioNode): void;

  /** Start producing sound. Idempotent — calling twice has no effect. */
  start(): void;

  /** Stop producing sound. Idempotent — calling twice has no effect. */
  stop(): void;

  /** Set output volume. Value is clamped to 0–1. */
  setVolume(volume: number): void;

  /** Get current volume. */
  getVolume(): number;

  /** Whether this generator is currently producing sound. */
  isPlaying(): boolean;

  /** Release all audio resources. After this, the generator cannot be reused. */
  dispose(): void;
}

export type SoundCategory = 'basic' | 'soundscape';

/**
 * Metadata for a sound — used by the UI to render cards.
 */
export interface SoundMeta {
  readonly id: string;
  readonly name: string;
  readonly category: SoundCategory;
  readonly icon: string;
  readonly description: string;
}

/**
 * State of a single sound in the mixer.
 */
export interface SoundState {
  id: string;
  active: boolean;
  volume: number; // 0-1
}

/**
 * Full application state — serializable to JSON for presets/localStorage.
 */
export interface AppState {
  sounds: Record<string, SoundState>;
  masterVolume: number;
  activePreset: string | null;
}

/**
 * A saved preset — a snapshot of sound states.
 */
export interface Preset {
  id: string;
  name: string;
  sounds: Record<string, SoundState>;
  masterVolume: number;
  createdAt: number;
}

/**
 * Factory function type for creating sound generators.
 * SOLID: Dependency Inversion — the mixer uses factories, not constructors.
 */
export type SoundGeneratorFactory = () => SoundGenerator;

/**
 * Registry of available sounds.
 * SOLID: Open/Closed — add new sounds by registering them, not modifying existing code.
 */
export interface SoundRegistry {
  register(meta: SoundMeta, factory: SoundGeneratorFactory): void;
  getAll(): SoundMeta[];
  getByCategory(category: SoundCategory): SoundMeta[];
  create(id: string): SoundGenerator;
}
