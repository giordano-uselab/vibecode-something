import type { SoundGenerator, SoundMeta, SoundGeneratorFactory, SoundCategory, SoundRegistry as ISoundRegistry } from '../types';

/**
 * Sound registry — the single place to register and create sound generators.
 *
 * SOLID: Open/Closed — adding a new sound is just a register() call.
 * SOLID: Dependency Inversion — consumers depend on this abstraction, not concrete generators.
 */
export class SoundRegistry implements ISoundRegistry {
  private readonly metas: Map<string, SoundMeta> = new Map();
  private readonly factories: Map<string, SoundGeneratorFactory> = new Map();

  register(meta: SoundMeta, factory: SoundGeneratorFactory): void {
    this.metas.set(meta.id, meta);
    this.factories.set(meta.id, factory);
  }

  getAll(): SoundMeta[] {
    return Array.from(this.metas.values());
  }

  getByCategory(category: SoundCategory): SoundMeta[] {
    return this.getAll().filter((m) => m.category === category);
  }

  create(id: string): SoundGenerator {
    const factory = this.factories.get(id);
    if (!factory) {
      throw new Error(`No generator registered for id: ${id}`);
    }
    return factory();
  }
}
