import { describe, it, expect, beforeEach } from 'vitest';
import { createMockAudioContext } from '../test-utils/audio-context-mock';
import type { SoundGenerator } from '../types';

/**
 * Contract test suite — any SoundGenerator implementation MUST pass these.
 * This is the spec-as-code: the tests define behavior before implementation exists.
 */
export function describeSoundGeneratorContract(
  name: string,
  factory: () => SoundGenerator,
) {
  describe(`SoundGenerator contract: ${name}`, () => {
    let generator: SoundGenerator;
    let ctx: AudioContext;

    beforeEach(() => {
      generator = factory();
      ctx = createMockAudioContext();
    });

    it('has a non-empty id', () => {
      expect(generator.id).toBeTruthy();
      expect(typeof generator.id).toBe('string');
    });

    it('has a non-empty name', () => {
      expect(generator.name).toBeTruthy();
      expect(typeof generator.name).toBe('string');
    });

    it('has a valid category', () => {
      expect(['basic', 'soundscape']).toContain(generator.category);
    });

    it('starts in a non-playing state', () => {
      expect(generator.isPlaying()).toBe(false);
    });

    it('starts with volume 0', () => {
      expect(generator.getVolume()).toBe(0);
    });

    it('can connect to an AudioContext', () => {
      expect(() => generator.connect(ctx, ctx.destination)).not.toThrow();
    });

    it('can start after connecting', () => {
      generator.connect(ctx, ctx.destination);
      generator.start();
      expect(generator.isPlaying()).toBe(true);
    });

    it('can stop after starting', () => {
      generator.connect(ctx, ctx.destination);
      generator.start();
      generator.stop();
      expect(generator.isPlaying()).toBe(false);
    });

    it('start is idempotent', () => {
      generator.connect(ctx, ctx.destination);
      generator.start();
      generator.start();
      expect(generator.isPlaying()).toBe(true);
    });

    it('stop is idempotent', () => {
      generator.connect(ctx, ctx.destination);
      generator.stop();
      generator.stop();
      expect(generator.isPlaying()).toBe(false);
    });

    it('setVolume clamps to 0-1 range', () => {
      generator.connect(ctx, ctx.destination);
      generator.setVolume(0.5);
      expect(generator.getVolume()).toBeCloseTo(0.5);

      generator.setVolume(-1);
      expect(generator.getVolume()).toBe(0);

      generator.setVolume(2);
      expect(generator.getVolume()).toBe(1);
    });

    it('can be disposed', () => {
      generator.connect(ctx, ctx.destination);
      generator.start();
      expect(() => generator.dispose()).not.toThrow();
      expect(generator.isPlaying()).toBe(false);
    });
  });
}
