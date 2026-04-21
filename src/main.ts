import './styles/main.css';
import type { SoundMeta } from './types';
import { SoundRegistry } from './audio/registry';
import {
  RainGenerator,
  WindGenerator,
  FireGenerator,
  CoffeeShopGenerator,
  WhiteNoiseGenerator,
  BrownNoiseGenerator,
} from './audio/generators/index';
import { RomanPiazzaGenerator, AncientKyotoGenerator } from './audio/soundscapes/index';
import { SoundMixer } from './mixer';
import { Controls } from './ui/controls';
import { Visualizer } from './ui/visualizer';

/**
 * Nois — Application entry point.
 * Wires together the registry, mixer, UI controls, and visualizer.
 */

// Sound metadata — drives the UI
const soundMetas: SoundMeta[] = [
  { id: 'rain', name: 'Rain', category: 'basic', icon: '🌧️', description: 'Gentle rainfall with random drop patterns' },
  { id: 'wind', name: 'Wind', category: 'basic', icon: '💨', description: 'Howling wind with sweeping frequency modulation' },
  { id: 'fire', name: 'Fire', category: 'basic', icon: '🔥', description: 'Crackling fire with low rumble and random bursts' },
  { id: 'coffee-shop', name: 'Coffee Shop', category: 'basic', icon: '☕', description: 'Background murmur with glass clinks' },
  { id: 'white-noise', name: 'White Noise', category: 'basic', icon: '📡', description: 'Pure broadband noise — all frequencies equal' },
  { id: 'brown-noise', name: 'Brown Noise', category: 'basic', icon: '🟤', description: 'Deep low-frequency noise — great for focus & ADHD' },
  { id: 'roman-piazza', name: 'Roman Piazza', category: 'soundscape', icon: '🏛️', description: 'Fountain, church bells, cobblestones, and pigeons in a sun-warmed Italian square' },
  { id: 'ancient-kyoto', name: 'Ancient Kyoto', category: 'soundscape', icon: '⛩️', description: 'Temple bells, bamboo wind, water drips, and distant shakuhachi in a serene Japanese garden' },
];

// Register all sound generators
// SOLID: Open/Closed — adding a new sound = one register() call here
const registry = new SoundRegistry();
registry.register(soundMetas[0], () => new RainGenerator());
registry.register(soundMetas[1], () => new WindGenerator());
registry.register(soundMetas[2], () => new FireGenerator());
registry.register(soundMetas[3], () => new CoffeeShopGenerator());
registry.register(soundMetas[4], () => new WhiteNoiseGenerator());
registry.register(soundMetas[5], () => new BrownNoiseGenerator());
registry.register(soundMetas[6], () => new RomanPiazzaGenerator());
registry.register(soundMetas[7], () => new AncientKyotoGenerator());

// Create mixer (orchestrator)
const mixer = new SoundMixer(registry);

// Create visualizer
const visualizer = new Visualizer(mixer);

// Create UI controls — pass a callback for state changes
const controls = new Controls(mixer, soundMetas, () => {
  // State changed — could persist to localStorage, update presets UI, etc.
});

// Keep reference to prevent garbage collection
Object.assign(globalThis, { __nois: { mixer, visualizer, controls } });

// Start the visualizer animation loop
visualizer.start();
