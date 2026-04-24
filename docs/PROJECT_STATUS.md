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
- 6 sound generators: rain, wind, fire, coffee shop, white noise, brown noise
- 2 soundscapes: Roman Piazza, Ancient Kyoto
- Sound mixer with per-sound and master volume
- Canvas particle visualizer
- Pomodoro timer logic (no UI integration)
- Preset save/load to localStorage (no UI list)
- 9 unit tests (generators + timer)
- Basic HTML/CSS UI with sound cards

### Not Done
- Pomodoro UI
- Preset UI (list, load, delete)
- PWA service worker / offline
- Premium tier / paywall
- Sound quality review (user flagged some sounds as not good enough)
- Feature review (deferred — needs proper discussion)

## Open Decisions (Pending Human Input)

1. **Sound quality review** — Go through each sound, decide what to keep/change/cut.
2. **Feature scope** — Which features matter, in what order. Deferred for proper review.
3. **Monetization model** — Product spec mentions $3.99 one-time, but not confirmed by PO.
4. **Sound selection** — Current 6+2 lineup not confirmed by PO.
