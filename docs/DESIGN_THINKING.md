# Nois — Design Thinking Process

## Phase 1: Empathize

### Research Findings

**The noise problem is universal and growing:**
- Open-plan offices expose workers to 60-70dB of ambient noise, reducing cognitive performance by up to 66% (University of Sydney, 2013)
- Remote workers face unpredictable home noise: kids, neighbors, street traffic, construction
- 72% of workers say they'd be more productive with better sound management (Oxford Economics, 2019)

**What people currently do:**
- YouTube "rain sounds 10 hours" — interrupted by ads, kills battery, can't customize
- Spotify "focus playlists" — require Premium to avoid ads, can't mix/customize
- Apps like Noisli ($10/year), Calm ($70/year), Brain.fm ($7/month) — expensive for what is fundamentally simple
- Some just suffer in silence or use earplugs

**Interviews & Observations (5 informal conversations with colleagues):**
- *"I just want rain and coffee shop noise mixed together. Why do I need an account for that?"*
- *"I tried one of those apps but the free tier is useless and I'm not paying monthly for white noise."*
- *"The YouTube videos are fine but I can't adjust the volume of individual sounds."*
- *"I'd love something that makes the office feel like a different place entirely."*

### Empathy Map

| | Thinks | Feels | Does | Says |
|---|--------|-------|------|------|
| **Open-office worker** | "I can't concentrate with all this chatter" | Frustrated, distracted | Puts on headphones, plays YouTube rain videos | "Can everyone keep it down?" |
| **Remote worker** | "My home is too quiet/noisy depending on the hour" | Isolated, restless | Switches between music and silence all day | "I miss the office background hum" |
| **Student** | "I need to study but I can't focus" | Anxious about deadlines | Tries Pomodoro apps, lo-fi playlists | "I'm more productive in coffee shops" |
| **ADHD individual** | "Brown noise is the only thing that helps" | Relieved when it works, desperate when it doesn't | Searches for brown noise generators constantly | "This literally changes my ability to function" |

---

## Phase 2: Define

### Point of View Statement

> **People who need to focus, relax, or escape their current environment** need a **lightweight, instant, and customizable ambient sound experience** because **existing tools are subscription-heavy, generic, and fail to create the feeling of being somewhere specific.**

### How Might We...

- **HMW** make ambient sound creation feel personal, not generic?
- **HMW** eliminate the barrier to entry (no signup, no payment, instant)?
- **HMW** create the feeling of *being somewhere* (Rome, Kyoto) using only algorithmic sound?
- **HMW** make focus tools work for offices/teams, not just individuals?
- **HMW** build something that requires zero bandwidth/server costs to scale?

### Key Insight

The existing market treats ambient sound as **content** (audio files to stream). We treat it as **computation** (algorithms to run). This means:
- Zero hosting cost per user
- Infinite variation (no two sessions sound identical)
- Works offline by default
- Privacy by design — no data, no accounts

---

## Phase 3: Ideate

### Ideas Generated (convergence from broad exploration)

1. ~~Retro space shooter~~ — saturated market
2. ~~Generative art studio~~ — merged into concept
3. ~~Bill splitter~~ — too simple without payments
4. ~~Mario Kart multiplayer~~ — scope too large
5. ~~Birthday song generator~~ — fun but novelty
6. ~~QR menu generator~~ — good market but pivoted
7. ~~Color palette extractor~~ — narrow audience
8. ~~Route builder~~ — requires external APIs
9. **Procedural ambient sound mixer** ← SELECTED
10. **Themed world soundscapes** ← UNIQUE DIFFERENTIATOR
11. **Office productivity integration (Pomodoro)** ← PREMIUM ANGLE

### Why This Idea Won

| Criterion | Score | Reasoning |
|-----------|-------|-----------|
| Originality | 10/10 | No competitor uses fully procedural audio |
| Demo impact | 10/10 | "There are zero audio files" is a mic drop |
| Technical depth | 9/10 | Web Audio API, Canvas, PWA — impressive stack from a backend dev |
| Monetization | 8/10 | Proven market (Noisli, Calm), undercut with one-time pricing |
| 1-day feasibility | 8/10 | Core is achievable; soundscapes stretch it |
| User need | 9/10 | Universal problem, validated by research |

### Selected Concept: Nois

A browser-based ambient sound mixer where every sound is procedurally generated. Users mix basic sounds (rain, fire, wind), explore themed soundscapes (Roman Piazza, Ancient Kyoto), and use focus tools (Pomodoro timer) — all without a single audio file.

---

## Phase 4: Prototype

Defined in [PRODUCT_SPEC.md](PRODUCT_SPEC.md) — vertical slices, each producing a testable increment:
- Slice 1 validates the **emotional response** to procedural rain
- Slice 2 validates the **visual engagement** (Canvas)
- Slice 3 validates the **mixing experience** (core value prop)
- Slices 5-6 validate the **soundscape concept** (uniqueness)

---

## Phase 5: Test

### Test Plan (before chapter presentation)
1. Share link with 3-5 colleagues (diverse: dev, designer, PM)
2. Observe without explaining — can they figure it out?
3. Ask: "How does this make you feel?" (not "does it work?")
4. Ask: "Would you keep this tab open during work?"
5. Ask: "Would you pay $3.99 for the premium features?"
6. Iterate on friction points before the demo

### Success Metrics
- **Engagement**: Users keep it open for >10 minutes
- **Discoverability**: Users find the mixer without instructions
- **Emotional response**: At least 3/5 testers describe a positive feeling
- **Sharing**: At least 1 tester shares the link unprompted
