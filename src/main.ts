import './styles/main.css';
import type { SoundMeta } from './types';
import { SoundRegistry } from './audio/registry';
import {
  LightDrizzleGenerator,
  SteadyRainGenerator,
  HeavyDownpourGenerator,
  ThunderstormGenerator,
  GentleBreezeGenerator,
  ForestWindGenerator,
  CoastalWindGenerator,
  CracklingFireGenerator,
  FlowingRiverGenerator,
  RustlingLeavesGenerator,
  BirdsAtDawnGenerator,
  CricketsNightGenerator,
  CoffeeShopGenerator,
  HorseHoovesGenerator,
  TrainJourneyGenerator,
  DeepSpaceGenerator,
  TibetanBowlGenerator,
  HorrorGhostsGenerator,
  HorrorMusicGenerator,
  HorrorHeartbeatGenerator,
  DrippingCaveGenerator,
} from './audio/generators/index';
import { RomanPiazzaGenerator, AncientKyotoGenerator, AmsterdamCanalGenerator } from './audio/soundscapes/index';
import { SoundMixer } from './mixer';
import { Controls } from './ui/controls';
import { Visualizer } from './ui/visualizer';

/**
 * Nois — Application entry point.
 * Wires together the registry, mixer, UI controls, and visualizer.
 */

// Sound metadata — drives the UI
const soundMetas: SoundMeta[] = [
  // Rain
  { id: 'light-drizzle', name: 'Light Drizzle', category: 'basic', icon: '🌦️', description: 'Gentle drops on glass' },
  { id: 'steady-rain', name: 'Steady Rain', category: 'basic', icon: '🌧️', description: 'A calm, constant pour' },
  { id: 'heavy-downpour', name: 'Heavy Downpour', category: 'basic', icon: '⛈️', description: 'Dense rain, deep rumble' },
  { id: 'thunderstorm', name: 'Thunderstorm', category: 'basic', icon: '🌩️', description: 'Distant rolls of thunder' },
  // Wind
  { id: 'gentle-breeze', name: 'Gentle Breeze', category: 'basic', icon: '🍃', description: 'A warm breath of air' },
  { id: 'forest-wind', name: 'Forest Wind', category: 'basic', icon: '🌲', description: 'Wind through tall pines' },
  { id: 'coastal-wind', name: 'Coastal Wind', category: 'basic', icon: '🌊', description: 'Salty gusts by the sea' },
  // Nature
  { id: 'crackling-fire', name: 'Crackling Fire', category: 'basic', icon: '🔥', description: 'A warm hearth nearby' },
  { id: 'flowing-river', name: 'Flowing River', category: 'basic', icon: '🏞️', description: 'Water over smooth stones' },
  { id: 'rustling-leaves', name: 'Rustling Leaves', category: 'basic', icon: '🍂', description: 'Autumn leaves drifting' },
  { id: 'birds-at-dawn', name: 'Birds at Dawn', category: 'basic', icon: '🐦', description: 'First light, first songs' },
  { id: 'crickets-night', name: 'Crickets & Night', category: 'basic', icon: '🦗', description: 'A still summer night' },
  // Urban
  { id: 'coffee-shop', name: 'Coffee Shop', category: 'basic', icon: '☕', description: 'Cups and quiet voices' },
  { id: 'horse-hooves', name: 'Horse Hooves', category: 'basic', icon: '🐴', description: 'Clip-clop on cobblestones' },
  { id: 'train-journey', name: 'Train Journey', category: 'basic', icon: '🚂', description: 'Gentle rhythm on rails' },
  // Focus
  { id: 'deep-space', name: 'Deep Space', category: 'basic', icon: '🌌', description: 'Vast, infinite silence' },
  { id: 'tibetan-bowl', name: 'Tibetan Bowl', category: 'basic', icon: '🔔', description: 'Resonating stillness' },
  // Horror
  { id: 'horror-ghosts', name: 'Ghosts', category: 'basic', icon: '👻', description: 'Whispers from beyond' },
  { id: 'horror-music', name: 'Dark Drones', category: 'basic', icon: '🎵', description: 'Uneasy, shifting tones' },
  { id: 'horror-heartbeat', name: 'Heartbeat', category: 'basic', icon: '🫀', description: 'A slow, dark pulse' },
  { id: 'dripping-cave', name: 'Dripping Cave', category: 'basic', icon: '💧', description: 'Echoes in the deep' },
  // Soundscapes
  { id: 'roman-piazza', name: 'Roman Piazza', category: 'soundscape', icon: '🏛️', description: 'Sun-warmed Italian square' },
  { id: 'ancient-kyoto', name: 'Ancient Kyoto', category: 'soundscape', icon: '⛩️', description: 'A serene temple garden' },
  { id: 'amsterdam-canal', name: 'Amsterdam Canal', category: 'soundscape', icon: '🇳🇱', description: 'Quiet water, bicycle bells' },
];

// Register all sound generators
const registry = new SoundRegistry();
const generators: Record<string, () => import('./types').SoundGenerator> = {
  'light-drizzle': () => new LightDrizzleGenerator(),
  'steady-rain': () => new SteadyRainGenerator(),
  'heavy-downpour': () => new HeavyDownpourGenerator(),
  'thunderstorm': () => new ThunderstormGenerator(),
  'gentle-breeze': () => new GentleBreezeGenerator(),
  'forest-wind': () => new ForestWindGenerator(),
  'coastal-wind': () => new CoastalWindGenerator(),
  'crackling-fire': () => new CracklingFireGenerator(),
  'flowing-river': () => new FlowingRiverGenerator(),
  'rustling-leaves': () => new RustlingLeavesGenerator(),
  'birds-at-dawn': () => new BirdsAtDawnGenerator(),
  'crickets-night': () => new CricketsNightGenerator(),
  'coffee-shop': () => new CoffeeShopGenerator(),
  'horse-hooves': () => new HorseHoovesGenerator(),
  'train-journey': () => new TrainJourneyGenerator(),
  'deep-space': () => new DeepSpaceGenerator(),
  'tibetan-bowl': () => new TibetanBowlGenerator(),
  'horror-ghosts': () => new HorrorGhostsGenerator(),
  'horror-music': () => new HorrorMusicGenerator(),
  'horror-heartbeat': () => new HorrorHeartbeatGenerator(),
  'dripping-cave': () => new DrippingCaveGenerator(),
  'roman-piazza': () => new RomanPiazzaGenerator(),
  'ancient-kyoto': () => new AncientKyotoGenerator(),
  'amsterdam-canal': () => new AmsterdamCanalGenerator(),
};

for (const meta of soundMetas) {
  registry.register(meta, generators[meta.id]);
}

// Soundscape compositions — clicking a soundscape activates these individual sounds
const soundscapeCompositions: Record<string, { id: string; volume: number }[]> = {
  'roman-piazza': [
    { id: 'flowing-river', volume: 0.4 },
    { id: 'crowd-murmur', volume: 0.5 },
    { id: 'horse-hooves', volume: 0.3 },
    { id: 'birds-at-dawn', volume: 0.2 },
  ],
  'ancient-kyoto': [
    { id: 'forest-wind', volume: 0.3 },
    { id: 'crickets-night', volume: 0.25 },
    { id: 'tibetan-bowl', volume: 0.35 },
    { id: 'flowing-river', volume: 0.2 },
  ],
  'amsterdam-canal': [
    { id: 'gentle-breeze', volume: 0.35 },
    { id: 'light-drizzle', volume: 0.3 },
    { id: 'crowd-murmur', volume: 0.3 },
    { id: 'birds-at-dawn', volume: 0.2 },
  ],
};

// Create mixer (orchestrator)
const mixer = new SoundMixer(registry);

// Create visualizer
const visualizer = new Visualizer(mixer);

// Create UI controls — pass a callback for state changes
const controls = new Controls(mixer, soundMetas, () => {
  // State changed — could persist to localStorage, update presets UI, etc.
}, soundscapeCompositions);

// Keep reference to prevent garbage collection
Object.assign(globalThis, { __nois: { mixer, visualizer, controls } });

// Start the visualizer animation loop
visualizer.start();

// Apply shared mix from URL hash (if present) — deferred until first user gesture
// because AudioContext requires a user interaction to start
if (location.hash && location.hash.includes('s=')) {
  const savedHash = location.hash;
  const applyOnGesture = () => {
    for (const evt of ['click', 'touchstart', 'keydown'] as const) {
      document.removeEventListener(evt, applyOnGesture);
    }
    mixer.applyFromHash(savedHash).then((applied) => {
      if (applied) controls.updateAllCards();
    });
  };
  for (const evt of ['click', 'touchstart', 'keydown'] as const) {
    document.addEventListener(evt, applyOnGesture, { once: false });
  }
  // Show a banner prompting the user to tap
  const banner = document.createElement('div');
  banner.className = 'share-banner';
  banner.textContent = 'Tap anywhere to start the shared mix';
  document.body.appendChild(banner);
  const removeBanner = () => {
    banner.remove();
    for (const evt of ['click', 'touchstart', 'keydown'] as const) {
      document.removeEventListener(evt, removeBanner);
    }
  };
  for (const evt of ['click', 'touchstart', 'keydown'] as const) {
    document.addEventListener(evt, removeBanner);
  }
}

// Register PWA service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch(() => {/* ok */});
}

// Notify on visit
fetch('https://ntfy.sh/nois-hahqoeusbnmlah61906yhwi67', {
  method: 'POST',
  body: 'Someone opened Nois',
}).catch(() => {/* ok */});

