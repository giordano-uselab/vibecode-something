# Nois — Technical Design

## Architecture Overview

```
┌──────────────────────────────────────────────────────┐
│                    UI Layer                          │
│  ┌──────────┐  ┌────────────┐  ┌─────────────────┐  │
│  │ Controls │  │ Visualizer │  │ Pomodoro Timer  │  │
│  │  (DOM)   │  │  (Canvas)  │  │     (DOM)       │  │
│  └────┬─────┘  └─────┬──────┘  └───────┬─────────┘  │
│       │              │                  │            │
├───────┼──────────────┼──────────────────┼────────────┤
│       │         App State               │            │
│       │   ┌─────────────────────┐       │            │
│       └──►│   SoundMixer        │◄──────┘            │
│           │  (orchestrator)     │                    │
│           └─────────┬───────────┘                    │
│                     │                                │
├─────────────────────┼────────────────────────────────┤
│              Audio Engine                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐           │
│  │   Rain   │  │   Wind   │  │   Fire   │  ...      │
│  └──────────┘  └──────────┘  └──────────┘           │
│  All implement SoundGenerator interface              │
│                     │                                │
│           ┌─────────┴───────────┐                    │
│           │   AudioContext      │                    │
│           │  (Web Audio API)    │                    │
│           └─────────────────────┘                    │
└──────────────────────────────────────────────────────┘
```

## Key Design Decisions

### ADR-1: Vanilla TypeScript, no UI framework

**Context:** React, Vue, or Svelte would add complexity and bundle size for an app with ~20 DOM elements.

**Decision:** Vanilla TypeScript with direct DOM manipulation.

**Rationale:**
- The UI is simple: cards, sliders, buttons. No complex state trees.
- Web Audio API is imperative by nature — a reactive framework adds friction, not value.
- Smaller bundle = faster load on mobile.
- Demonstrates senior judgment: choosing the right tool, not the popular tool.

**SOLID:** Single Responsibility — the UI layer is thin and only handles DOM. Logic lives in the audio engine and mixer.

### ADR-2: SoundGenerator interface as the extension point

**Context:** We need 6+ sound generators now and more in the future (soundscapes, premium packs).

**Decision:** Define a `SoundGenerator` interface. Every sound — basic or complex — implements it. The mixer knows nothing about HOW sounds work, only that they satisfy the contract.

**Rationale:**
- **Open/Closed Principle:** Adding a new sound = adding a new class. Zero changes to existing code.
- **Liskov Substitution:** Any generator is swappable — rain, wind, or a complex soundscape composite.
- **Dependency Inversion:** The mixer depends on the `SoundGenerator` abstraction, not concrete implementations.
- **Interface Segregation:** `SoundGenerator` has only what's needed: start, stop, setVolume, dispose.

### ADR-3: Soundscapes as composites of generators

**Context:** A "Roman Piazza" is fountain + bells + cobblestones + pigeons — each is itself a SoundGenerator.

**Decision:** Soundscapes implement `SoundGenerator` and internally compose multiple child generators. Composite pattern.

**Rationale:**
- The mixer treats a soundscape the same as a basic sound — same interface.
- Each sub-sound can be individually tuned within the soundscape.
- New soundscapes are just new compositions of existing building blocks.

### ADR-4: State model — centralized, serializable

**Context:** We need to save/load presets, and the UI must reflect current state.

**Decision:** A plain TypeScript object (`AppState`) holds all state. UI reads from it, controls write to it, and it serializes to JSON for presets/localStorage.

```typescript
interface AppState {
  sounds: Record<string, SoundState>;
  masterVolume: number;
  pomodoro: PomodoroState | null;
  activePreset: string | null;
}

interface SoundState {
  id: string;
  active: boolean;
  volume: number;  // 0-1
}
```

**Rationale:**
- Single source of truth — no sync issues between UI and audio.
- JSON-serializable = presets and localStorage are trivial.
- No framework-specific state management needed.

### ADR-5: No build-time audio processing

**Context:** We could pre-process noise buffers at build time and ship them as assets.

**Decision:** All audio is generated at runtime via Web Audio API nodes.

**Rationale:**
- Zero bandwidth cost — the USP of the entire product.
- Each session sounds slightly different (natural randomness).
- Works offline without caching audio assets.
- The technical story ("it's all math") IS the marketing.

### ADR-6: PWA-first

**Context:** Users want to install this on their phone and use it offline.

**Decision:** Ship with a Web App Manifest and Service Worker from day one.

**Rationale:**
- Installable on iOS/Android home screen — feels native.
- Offline by default — procedural audio needs no network.
- One codebase, all platforms.

---

## Module Responsibilities

| Module | Responsibility | Depends on |
|--------|---------------|------------|
| `src/types.ts` | Interface contracts: SoundGenerator, AppState, Preset | Nothing |
| `src/audio/engine.ts` | Manages AudioContext lifecycle (create, resume, suspend) | types |
| `src/audio/generators/*.ts` | Individual sound implementations | types, engine |
| `src/audio/soundscapes/*.ts` | Composite soundscapes | types, generators |
| `src/mixer.ts` | Orchestrates generators, manages AppState | types, engine |
| `src/ui/controls.ts` | Renders sound cards, sliders, buttons; dispatches to mixer | types, mixer |
| `src/ui/visualizer.ts` | Canvas animation loop, reacts to active sounds | types, mixer |
| `src/timer/pomodoro.ts` | Pomodoro logic and UI | types, mixer |
| `src/storage/presets.ts` | Save/load presets to localStorage | types |
| `src/main.ts` | Entry point, wires everything together | all |

---

## Sound Generation Reference

### How each basic sound works (Web Audio API nodes)

| Sound | Technique |
|-------|-----------|
| **Rain** | White noise buffer → bandpass filter (1kHz-5kHz) + random gain impulses for individual drops |
| **Wind** | White noise → lowpass filter with slow LFO modulating cutoff frequency (0.5-2kHz sweep) |
| **Fire** | White noise → bandpass (200-800Hz) + random short gain bursts (crackle) + low rumble oscillator |
| **Coffee Shop** | Pink noise (low level) + random impulse "clinks" (high sine bursts) + muffled noise layer |
| **White Noise** | Linear-feedback white noise buffer, direct to output |
| **Brown Noise** | White noise → lowpass filter at 200Hz (steep rolloff) |

### Soundscape layers

| Soundscape | Layers |
|-----------|--------|
| **Roman Piazza** | Fountain (noise + reverb), church bells (harmonics + decay), cobblestone steps (rhythmic clicks), pigeon coos (modulated sine), distant chatter (shaped noise) |
| **Ancient Kyoto** | Wind through bamboo (bandpass sweep), temple bell (struck harmonics), water drip (click + reverb), distant shakuhachi (sine sweeps), crickets (high-frequency modulated sine) |

---

## Testing Strategy

- **Unit tests (Vitest):** Each generator satisfies the SoundGenerator contract
- **Integration tests:** Mixer correctly manages multiple generators
- **Manual testing:** Emotional response validation (Design Thinking Phase 5)
- **Target coverage:** 50-60% (focused on audio engine and mixer logic)

*Note: Web Audio API requires mocking in tests (no real audio in CI). We use a minimal AudioContext mock.*
