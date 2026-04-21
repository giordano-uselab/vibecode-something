# Nois

**Procedural ambient soundscapes for focus, calm, and productivity.**

Nois generates rich, layered ambient sounds entirely in your browser — no audio files, no downloads, no subscriptions. Every raindrop, every crackling fire, every distant temple bell is synthesized in real-time using the Web Audio API.

## Features

- **6 Core Sounds** — Rain, Wind, Fire, Coffee Shop, White Noise, Brown Noise
- **Themed Soundscapes** — "Roman Piazza", "Ancient Kyoto Temple" — immersive worlds built from procedural layers
- **Mix & Match** — Blend any combination with individual volume controls
- **Pomodoro Timer** — Focus sessions with ambient sound transitions
- **Save Presets** — Keep your favorite mixes
- **Zero Audio Files** — Every sound is math. Pure Web Audio API synthesis.
- **Works Offline** — Installable as a PWA
- **Free & Private** — No accounts, no tracking, no data leaves your browser

## Tech Stack

- TypeScript + Vite
- HTML5 Canvas (visualizations)
- Web Audio API (procedural audio synthesis)
- Vitest (testing)
- GitHub Pages (hosting)

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

## Build & Deploy

```bash
npm run build    # Production build → dist/
npm run preview  # Preview production build locally
```

## Tests

```bash
npm run test        # Run tests
npm run test:watch  # Watch mode
```

## Design Process

This project follows the **Design Thinking** methodology:

- [Design Thinking Artifacts](docs/DESIGN_THINKING.md) — Empathize, Define, Ideate phases
- [Product Spec](docs/PRODUCT_SPEC.md) — User stories, personas, scope
- [Technical Design](docs/TECHNICAL_DESIGN.md) — Architecture decisions, contracts

## License

MIT
