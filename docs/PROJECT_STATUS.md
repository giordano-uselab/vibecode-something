# Nois — Project Status & Decisions

## Context

- **Primary goal:** Tech chapter "vibecode" exercise — build something unusual with AI, share impressions/feedback about the experience.
- **Secondary goal:** Make it monetizable.
- **Product owner:** The human. All feature decisions, priorities, and scope choices go through them. The AI executes.

## Working Agreement

- AI does NOT pick features, prioritize tasks, or make product decisions autonomously.
- Human defines what to build and why. AI builds how.
- Work in small increments: human describes → AI builds → human reviews.

## Workflow

Every work session follows this cycle:

1. **Start** — AI reads `docs/PROJECT_STATUS.md` to pick up context.
2. **Plan** — Human says what to work on. AI confirms understanding before coding.
3. **Build** — AI implements the task.
4. **Test** — AI runs tests to verify nothing is broken.
5. **Update docs** — AI updates this file (current state, decisions, etc.) and `FEEDBACK_AI.md`.
6. **Commit** — AI stages changes and commits with a clear message. Format: `type: description` (e.g. `feat:`, `fix:`, `docs:`, `refactor:`).
7. **Push** — AI pushes to `origin/main` (only after human confirms, or human pushes manually).

**On session end:** AI ensures PROJECT_STATUS.md is current and all work is committed, so the human can close the laptop and resume from any machine.

**Git remote:** `origin` → `https://github.com/giordano-uselab/vibecode-something.git` (branch: `main`)

## Current State (April 2026)

### Done
- 20 sound generators: Light Drizzle, Steady Rain, Heavy Downpour, Thunderstorm, Gentle Breeze, Forest Wind, Coastal Wind, Crackling Fire, Flowing River, Ocean Waves, Rustling Leaves, Birds at Dawn, Crickets & Night, Coffee Shop, Horse Hooves, Crowd Murmur, Train Journey, Deep Space, Deep Water, Tibetan Bowl
- 3 soundscapes: Roman Piazza (reworked), Ancient Kyoto (reworked), Amsterdam Canal (new)
- Sound mixer with per-sound and master volume
- Canvas particle visualizer
- Pomodoro timer logic (no UI integration — parked)
- Preset save/load to localStorage (no UI list)
- 24 test files, 284 tests passing
- Basic HTML/CSS UI with sound cards

### Not Done
- Sound quality review (PO needs to listen to each sound and give feedback)
- UI review and rework
- Preset UI (list, load, delete)
- PWA service worker / offline
- Premium tier / paywall
- 3 more soundscapes planned: African Savanna, Parisian Café, Viking Coast

## Decisions Made (April 24)

### Product Vision — CONFIRMED
- **What:** Ambient sound mixer with general sounds + location-based soundscape presets (Amsterdam, Ancient Rome, etc.)
- **Name:** Nois — keep it. Play on "Nice" in the UI.
- **Differentiator:** All sounds generated with math, no audio files. Game changer.
- **Target:** Demo for tech chapter, but built for real users too.
- **Platforms:** Desktop + mobile (Android + iPhone). Must be deployed and accessible.
- **Priority order:** Define features → fix sounds → fix UI.

### Review Progress
- [x] 1. Product vision
- [ ] 2. Sound selection — DONE (see confirmed lists below)
- [ ] 3. UX / interaction design
- [ ] 4. Visual design
- [x] 5. Features & priorities — sounds and soundscapes confirmed
- [ ] 6. Technical design
- [ ] 7. Testing strategy
- [ ] 8. Deployment
- [ ] 9. Monetization

### Confirmed Sounds (20 total)

**Rain (4):** Light Drizzle, Steady Rain, Heavy Downpour, Thunderstorm
**Wind (3):** Gentle Breeze, Forest Wind, Coastal Wind
**Nature (6):** Crackling Fire, Flowing River, Ocean Waves, Rustling Leaves, Birds at Dawn, Crickets & Night
**Urban (4):** Coffee Shop, Horse Hooves, Crowd Murmur, Train Journey
**Focus (3):** Deep Space, Deep Water, Tibetan Bowl

### Confirmed Soundscapes (6 total, 3 for today)

**Today:** Roman Piazza (reworked), Ancient Kyoto (reworked), Amsterdam Canal (new)
**Later:** African Savanna, Parisian Café, Viking Coast

### Parked Features
- Pomodoro timer — deferred, revisit later
- I/J/K/L (PWA, offline, paywall, packs) — not discussed yet

## Open Decisions (Pending Human Input)

1. **Feature scope** — Which features to include, what's MVP, what's cut.
2. **Sound quality review** — Go through each sound, decide what to keep/change/cut.
3. **UI review** — Look, feel, layout.
4. **Monetization model** — Not yet discussed.
5. **Soundscape selection** — Which locations/presets to include.
