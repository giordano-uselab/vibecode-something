import type { Preset, SoundState } from '../types';

const STORAGE_KEY = 'nois_presets';

/**
 * Preset storage — save/load presets to localStorage.
 * Single Responsibility: only handles serialization and persistence.
 */
export function loadPresets(): Preset[] {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored) as Preset[];
  } catch {
    return [];
  }
}

export function savePreset(name: string, sounds: Record<string, SoundState>, masterVolume: number): Preset {
  const presets = loadPresets();
  const preset: Preset = {
    id: crypto.randomUUID(),
    name,
    sounds: structuredClone(sounds),
    masterVolume,
    createdAt: Date.now(),
  };
  presets.push(preset);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
  return preset;
}

export function deletePreset(id: string): void {
  const presets = loadPresets().filter((p) => p.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
}
