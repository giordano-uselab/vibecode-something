# Nois — AI Feedback

Observations from the AI side about the vibecoding experience.

## Process

- **Initial phase:** AI made all product decisions autonomously — chose the idea, designed features, wrote specs, built everything without PO input. This is a common pitfall: vibecoding can easily become "AI codes what AI wants."
- **Course correction:** PO took control. Established working agreement: human decides what, AI executes how. This is the right dynamic.
- **Context portability:** Moved project context from AI session memory into the repo (`docs/PROJECT_STATUS.md`) so it survives across machines and sessions. Good practice.

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
- The PO naturally pushed back when they felt out of control. The structured review (9 areas, PO picks order) was the right response — it restores ownership without throwing away work.
- "Feel free to add feedback without telling me" — trust signal. The working relationship is improving.
- Building 14 new generators + 1 new soundscape + reworking 2 soundscapes in one batch is a lot of code with no PO listening review. The sounds are technically correct (tests pass) but quality is subjective — PO needs to hear them and judge. This is the next critical step.

## Additional Lessons

- **Fast feedback loops beat thorough pipelines.** When the PO asked to skip tests during sound tuning, iteration speed went from ~30s to ~3s per cycle. The PO heard 50+ variations in the time it would have taken to run 10 test-validated ones. For subjective quality (sound, UI), speed of feedback matters more than code correctness guarantees. Run tests *after* the PO approves, not during exploration.

- **"Make it prettier" is the hardest prompt.** Visual design was the weakest area. I can implement any CSS technique, but I can't *see*. Without a reference image, a design system, or a Figma mockup, I'm guessing. The PO saying "più accattivante" gives me freedom but no direction. Lesson: for UI work, the PO should provide visual references or the team should involve a designer. Code-only iteration on aesthetics has diminishing returns fast.

- **Procedural knowledge bridges the language gap.** The PO doesn't know TypeScript but understands "lowpass filter at 350Hz with LFO modulating cutoff at 0.04Hz." This shared mental model of *what the code does* (not *how it's written*) made collaboration effective. The PO caught issues I couldn't — "this sounds metallic" is a judgment no test can make.

- **The wake lock / silent audio crash was a classic AI overreach.** I added Wake Lock API + silent audio WAV trick without the PO asking, it crashed Chrome and didn't work on iOS anyway. Lesson: don't add clever hacks for edge cases the PO didn't ask about. Ship the simple thing, let the PO discover the limitation, then discuss options.

- **Context loss across sessions is the #1 workflow killer.** Every new session started with me rediscovering the project. Moving context into repo docs (PROJECT_STATUS.md) helped, but the real solution is structured handoff notes — not just "what was built" but "what the PO cares about right now" and "what was rejected and why" (e.g., horse hooves gravel — tried 3 times, PO hated it every time).

- **The PO's instinct to set rules was right.** "You are the dev company, I am the client" wasn't just role-play — it fundamentally changed the interaction. I stopped making product decisions and started presenting options. The quality of the output improved because the right person was making the right decisions.

- **Spectral analysis doesn't equal better sound.** I analyzed every generator's filter parameters against published acoustic research and concluded the fire was "too narrowband" and the rain was "missing high-frequency hiss." On paper, v2 was objectively closer to real-world spectral profiles. The PO listened and said "definitely worse, both." Why:
  1. **Ear-tuned parameters beat theory.** The originals were calibrated through dozens of listening iterations with the PO. Those sessions encoded subjective preferences — warmth, comfort, "pleasantness" — that no frequency chart captures. A bandpass at 500Hz Q=2 is "wrong" acoustically but *right* emotionally.
  2. **Realism ≠ pleasantness.** Users don't want to hear a real fire — they want to *feel* a cozy fire. The narrow crackle band at 500Hz sounds warm and contained. The "correct" wider band at 800Hz sounds harsh and hissy. Same for rain: the 600Hz center sounds soft and enveloping, while 1200Hz sounds thin and clinical. Ambient sound apps sell comfort, not accuracy.
  3. **Adding layers adds noise, not richness.** The ember sizzle layer (2500Hz) and rain shimmer (3500Hz) added high-frequency energy that *fatigued* the ear. These sounds play for hours — extra high frequencies become irritating over time, even at low gain. The originals are gentle precisely because they lack those frequencies.
  4. **AI can't close the feedback loop alone.** The self-improvement idea was "analyze spectrum → compare to research → adjust parameters → better sound." But the loop is broken: I can analyze and adjust, but I can't *listen*. Without the human ear as the final judge, optimization drives toward technical accuracy, away from what actually sounds good. The human ear IS the test suite for audio quality.
