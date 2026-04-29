import type { SoundMeta } from '../types';
import { SoundMixer } from '../mixer';

/** Generators that support per-layer mute */
interface LayeredGenerator {
  setLayerMuted(layer: string, muted: boolean): void;
  isLayerMuted(layer: string): boolean;
}

interface LayerDef { key: string; label: string }

/** IDs of sounds that have layer controls + their static LAYERS */
const LAYERED_SOUNDS: Record<string, LayerDef[]> = {};

// Lazy-load layer definitions from the generators to avoid circular deps
function getLayerDefs(id: string): LayerDef[] | undefined {
  return LAYERED_SOUNDS[id];
}

/** Register a layered sound's definitions (called at module init) */
export function registerLayeredSound(id: string, layers: readonly LayerDef[]): void {
  LAYERED_SOUNDS[id] = [...layers];
}

function isLayeredGenerator(gen: unknown): gen is LayeredGenerator {
  return gen != null
    && typeof (gen as LayeredGenerator).setLayerMuted === 'function'
    && typeof (gen as LayeredGenerator).isLayerMuted === 'function';
}

/**
 * UI Controls — renders sound cards, sliders, and master controls.
 * Single Responsibility: only DOM rendering and event binding.
 * All logic is delegated to the SoundMixer.
 */
export class Controls {
  private readonly container: HTMLElement;
  private readonly activeSoundscapes = new Set<string>();

  constructor(
    private readonly mixer: SoundMixer,
    private readonly sounds: SoundMeta[],
    private readonly onStateChange: () => void,
    private readonly compositions: Record<string, { id: string; volume: number }[]> = {},
  ) {
    this.container = document.getElementById('app')!;
    this.render();
  }

  private render(): void {
    const basicSounds = this.sounds.filter((s) => s.category === 'basic');
    const soundscapes = this.sounds.filter((s) => s.category === 'soundscape');

    this.container.innerHTML = `
      <header class="header">
        <h1>Nois</h1>
        <p>Nice noise, mixed by you.</p>
        <p class="header__sub">No loops. No downloads. Works offline.</p>
      </header>

      <div class="visualizer-container">
        <canvas class="visualizer-canvas" id="visualizer"></canvas>
      </div>

      <div class="sound-grid" id="sound-grid">
        <div class="section-label">Basic Sounds</div>
        ${basicSounds.map((s) => this.renderCard(s)).join('')}
        ${soundscapes.length > 0 ? `
          <div class="section-label">Soundscapes</div>
          ${soundscapes.map((s) => this.renderCard(s)).join('')}
        ` : ''}
      </div>

      <div class="master-controls">
        <span class="master-controls__label">Master</span>
        <input type="range" class="master-volume-slider" id="master-volume"
               min="0" max="100" value="${this.mixer.state.masterVolume * 100}" />
        <button class="stop-all-btn" id="stop-all">Stop All</button>
      </div>

      <div class="presets-bar" id="presets-bar">
        <span class="presets-bar__label">Presets</span>
        <button class="save-preset-btn" id="save-preset">+ Save current</button>
      </div>

      <footer class="footer">
        <p>Nois — every sound is math, every session is unique</p>
      </footer>
    `;

    this.bindEvents();
  }

  private renderCard(meta: SoundMeta): string {
    const state = this.mixer.state.sounds[meta.id];
    const isActive = state?.active ?? false;
    const volume = state?.volume ?? 0.3;
    const layers = getLayerDefs(meta.id);
    const showLayers = isActive && layers;

    return `
      <div class="sound-card ${isActive ? 'active' : ''}" data-sound-id="${meta.id}">
        <div class="sound-card__header">
          <span class="sound-card__icon">${meta.icon}</span>
          <div class="sound-card__info">
            <span class="sound-card__name">${meta.name}</span>
            <span class="sound-card__desc">${meta.description}</span>
          </div>
          <span class="sound-card__status">${isActive ? 'ON' : 'OFF'}</span>
        </div>
        <input type="range" class="volume-slider" data-volume-id="${meta.id}"
               min="0" max="100" value="${volume * 100}" />
        ${showLayers ? this.renderLayerControls(meta.id, layers) : ''}
      </div>
    `;
  }

  private renderLayerControls(soundId: string, layers: LayerDef[]): string {
    const gen = this.mixer.getGenerator(soundId);
    const layered = isLayeredGenerator(gen);

    return `
      <div class="layer-controls" data-layer-parent="${soundId}">
        ${layers.map(({ key, label }) => {
          const muted = layered && gen.isLayerMuted(key);
          return `
            <button class="layer-mute-btn ${muted ? 'muted' : ''}"
                    data-layer-sound="${soundId}" data-layer-key="${key}">
              ${muted ? '🔇' : '🔊'} ${label}
            </button>
          `;
        }).join('')}
      </div>
    `;
  }

  private bindEvents(): void {
    // Sound card clicks
    this.container.querySelectorAll<HTMLElement>('.sound-card').forEach((card) => {
      const id = card.dataset.soundId ?? '';

      card.addEventListener('click', async (e) => {
        // Don't toggle when clicking the slider
        if ((e.target as HTMLElement).classList.contains('volume-slider')) return;

        if (this.compositions[id]) {
          await this.toggleSoundscape(id);
        } else {
          await this.mixer.toggleSound(id);
          this.updateCard(id);
        }
        this.onStateChange();
      });
    });

    // Volume sliders
    this.container.querySelectorAll('.volume-slider').forEach((slider) => {
      const id = (slider as HTMLInputElement).dataset.volumeId ?? '';
      slider.addEventListener('input', (e) => {
        e.stopPropagation();
        const value = Number((e.target as HTMLInputElement).value) / 100;
        this.mixer.setVolume(id, value);
        this.onStateChange();
      });
    });

    // Master volume
    const masterSlider = document.getElementById('master-volume') as HTMLInputElement;
    masterSlider?.addEventListener('input', (e) => {
      const value = Number((e.target as HTMLInputElement).value) / 100;
      this.mixer.setMasterVolume(value);
      this.onStateChange();
    });

    // Stop all
    document.getElementById('stop-all')?.addEventListener('click', () => {
      this.mixer.stopAll();
      this.activeSoundscapes.clear();
      this.updateAllCards();
      this.onStateChange();
    });

    // Layer mute buttons
    this.bindLayerMuteButtons();
  }

  private bindLayerMuteButtons(): void {
    this.container.querySelectorAll<HTMLButtonElement>('.layer-mute-btn').forEach((btn) => {
      const soundId = btn.dataset.layerSound;
      const key = btn.dataset.layerKey;
      if (!soundId || !key) return;

      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const gen = this.mixer.getGenerator(soundId);
        if (!isLayeredGenerator(gen)) return;

        const wasMuted = gen.isLayerMuted(key);
        gen.setLayerMuted(key, !wasMuted);

        const layers = getLayerDefs(soundId);
        const label = layers?.find(l => l.key === key)?.label ?? key;
        btn.classList.toggle('muted', !wasMuted);
        btn.textContent = `${!wasMuted ? '🔇' : '🔊'} ${label}`;
      });
    });
  }

  private updateCard(id: string): void {
    const card = this.container.querySelector(`[data-sound-id="${id}"]`);
    if (!card) return;

    const state = this.mixer.state.sounds[id];
    card.classList.toggle('active', state.active);

    const status = card.querySelector('.sound-card__status');
    if (status) status.textContent = state.active ? 'ON' : 'OFF';

    const slider = card.querySelector('.volume-slider') as HTMLInputElement;
    if (slider) slider.value = String(state.volume * 100);

    // Show/hide layer controls for layered sounds
    const layers = getLayerDefs(id);
    const existing = card.querySelector('.layer-controls');
    if (layers && state.active) {
      if (!existing) {
        const div = document.createElement('div');
        div.innerHTML = this.renderLayerControls(id, layers);
        const layerEl = div.firstElementChild;
        if (layerEl) {
          card.appendChild(layerEl);
          this.bindLayerMuteButtons();
        }
      }
    } else {
      existing?.remove();
    }
  }

  updateAllCards(): void {
    for (const id of Object.keys(this.mixer.state.sounds)) {
      if (!this.compositions[id]) {
        this.updateCard(id);
      }
    }
    for (const id of Object.keys(this.compositions)) {
      this.updateSoundscapeCard(id);
    }
  }

  private async toggleSoundscape(id: string): Promise<void> {
    const composition = this.compositions[id];
    if (!composition) return;

    const isActive = this.activeSoundscapes.has(id);

    if (isActive) {
      // Turn off all component sounds
      for (const component of composition) {
        if (this.mixer.state.sounds[component.id]?.active) {
          await this.mixer.toggleSound(component.id);
          this.updateCard(component.id);
        }
      }
      this.activeSoundscapes.delete(id);
    } else {
      // Turn on all component sounds with preset volumes
      for (const component of composition) {
        this.mixer.setVolume(component.id, component.volume);
        if (!this.mixer.state.sounds[component.id]?.active) {
          await this.mixer.toggleSound(component.id);
        }
        this.updateCard(component.id);
      }
      this.activeSoundscapes.add(id);
    }

    this.updateSoundscapeCard(id);
  }

  private updateSoundscapeCard(id: string): void {
    const card = this.container.querySelector(`[data-sound-id="${id}"]`);
    if (!card) return;

    const isActive = this.activeSoundscapes.has(id);
    card.classList.toggle('active', isActive);

    const status = card.querySelector('.sound-card__status');
    if (status) status.textContent = isActive ? 'ON' : 'OFF';
  }
}
