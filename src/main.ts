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
  OceanWavesGenerator,
  RustlingLeavesGenerator,
  BirdsAtDawnGenerator,
  CricketsNightGenerator,
  CoffeeShopGenerator,
  HorseHoovesGenerator,
  CrowdMurmurGenerator,
  TrainJourneyGenerator,
  DeepSpaceGenerator,
  DeepWaterGenerator,
  TibetanBowlGenerator,
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
  { id: 'light-drizzle', name: 'Light Drizzle', category: 'basic', icon: '🌦️', description: 'Soft, sparse drops on a window' },
  { id: 'steady-rain', name: 'Steady Rain', category: 'basic', icon: '🌧️', description: 'Classic medium rain on pavement' },
  { id: 'heavy-downpour', name: 'Heavy Downpour', category: 'basic', icon: '⛈️', description: 'Intense, dense rain with low rumble' },
  { id: 'thunderstorm', name: 'Thunderstorm', category: 'basic', icon: '🌩️', description: 'Rain with distant thunder rolls' },
  // Wind
  { id: 'gentle-breeze', name: 'Gentle Breeze', category: 'basic', icon: '🍃', description: 'Soft, slow, warm wind' },
  { id: 'forest-wind', name: 'Forest Wind', category: 'basic', icon: '🌲', description: 'Wind through trees with rustling leaves' },
  { id: 'coastal-wind', name: 'Coastal Wind', category: 'basic', icon: '🌊', description: 'Strong coastal wind with occasional gusts' },
  // Nature
  { id: 'crackling-fire', name: 'Crackling Fire', category: 'basic', icon: '🔥', description: 'Fireplace with wood snapping and low rumble' },
  { id: 'flowing-river', name: 'Flowing River', category: 'basic', icon: '🏞️', description: 'Continuous water flowing over rocks' },
  { id: 'ocean-waves', name: 'Ocean Waves', category: 'basic', icon: '🏖️', description: 'Rhythmic shoreline waves' },
  { id: 'rustling-leaves', name: 'Rustling Leaves', category: 'basic', icon: '🍂', description: 'Dry leaves shifting on the ground' },
  { id: 'birds-at-dawn', name: 'Birds at Dawn', category: 'basic', icon: '🐦', description: 'Morning birdsong with sparse chirps' },
  { id: 'crickets-night', name: 'Crickets & Night', category: 'basic', icon: '🦗', description: 'Evening insects in a calm night' },
  // Urban
  { id: 'coffee-shop', name: 'Coffee Shop', category: 'basic', icon: '☕', description: 'Background murmur with glass clinks' },
  { id: 'horse-hooves', name: 'Horse Hooves', category: 'basic', icon: '🐴', description: 'Rhythmic clip-clop on cobblestones' },
  { id: 'crowd-murmur', name: 'Crowd Murmur', category: 'basic', icon: '👥', description: 'Distant people talking, indistinct' },
  { id: 'train-journey', name: 'Train Journey', category: 'basic', icon: '🚂', description: 'Rhythmic rail clacking with gentle sway' },
  // Focus
  { id: 'deep-space', name: 'Deep Space', category: 'basic', icon: '🌌', description: 'Low cosmic hum — vast and empty' },
  { id: 'deep-water', name: 'Deep Water', category: 'basic', icon: '🫧', description: 'Submerged, muffled, pressure feeling' },
  { id: 'tibetan-bowl', name: 'Tibetan Bowl', category: 'basic', icon: '🔔', description: 'Resonating singing bowl tones' },
  // Soundscapes
  { id: 'roman-piazza', name: 'Roman Piazza', category: 'soundscape', icon: '🏛️', description: 'Fountain, crowds, horse hooves, and church bells in a sun-warmed Italian square' },
  { id: 'ancient-kyoto', name: 'Ancient Kyoto', category: 'soundscape', icon: '⛩️', description: 'Temple gong, bamboo wind, kendo swords, and shakuhachi in a serene Japanese garden' },
  { id: 'amsterdam-canal', name: 'Amsterdam Canal', category: 'soundscape', icon: '🇳🇱', description: 'Water lapping, bicycle bells, seagulls, and boat engines along a Dutch canal' },
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
  'ocean-waves': () => new OceanWavesGenerator(),
  'rustling-leaves': () => new RustlingLeavesGenerator(),
  'birds-at-dawn': () => new BirdsAtDawnGenerator(),
  'crickets-night': () => new CricketsNightGenerator(),
  'coffee-shop': () => new CoffeeShopGenerator(),
  'horse-hooves': () => new HorseHoovesGenerator(),
  'crowd-murmur': () => new CrowdMurmurGenerator(),
  'train-journey': () => new TrainJourneyGenerator(),
  'deep-space': () => new DeepSpaceGenerator(),
  'deep-water': () => new DeepWaterGenerator(),
  'tibetan-bowl': () => new TibetanBowlGenerator(),
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
    { id: 'ocean-waves', volume: 0.35 },
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
