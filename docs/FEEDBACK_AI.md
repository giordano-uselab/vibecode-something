# Nois — AI Feedback

Observations from the AI side about the vibecoding experience.

## Process

- **Initial phase:** AI made all product decisions autonomously — chose the idea, designed features, wrote specs, built everything without PO input. This is a common pitfall: vibecoding can easily become "AI codes what AI wants."
- **Course correction (April 22):** PO took control. Established working agreement: human decides what, AI executes how. This is the right dynamic.
- **Context portability (April 24):** Moved project context from AI session memory into the repo (`docs/PROJECT_STATUS.md`) so it survives across machines and sessions. Good practice.

## What Worked

- Procedural audio with Web Audio API — zero dependencies, genuinely interesting tech.
- Contract testing pattern for sound generators — clean, scalable.
- Fast iteration: full working prototype in a short time.

## What Didn't Work

- AI acting as both product owner and developer led to a project the human didn't feel ownership over.
- Sound quality wasn't validated by a human ear before moving on to more features.
- Too many features built before confirming the core (sounds) was right.

## Lessons

- Vibecoding works best when the human stays in the driver's seat for *what* and *why*.
- AI should ask before building, not build and then present.
- Start with the smallest thing that can be experienced (one good sound), not the full architecture.
