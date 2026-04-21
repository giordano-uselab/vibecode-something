# Nois — Product Specification

## Vision

> One sentence: **Nois turns math into calm.**

A zero-cost, zero-backend, privacy-first ambient sound mixer that generates all audio procedurally in the browser — with themed world soundscapes that transport you somewhere beautiful.

---

## Target Personas

### 1. Focused Worker ("Alex")
- 28, software developer in an open-plan office
- Wears headphones 6+ hours/day
- Currently uses YouTube rain videos (hates ads)
- Wants: instant focus sounds, no signup, customizable mix
- Willing to pay: one-time $3-5 for something they use daily

### 2. Remote Worker ("Sara")
- 35, marketing manager working from home
- Home is either too quiet or unpredictably noisy (kids, neighbors)
- Uses Spotify lo-fi playlists but gets bored
- Wants: ambient background that feels like a place, not a playlist
- Willing to pay: one-time for something premium-feeling

### 3. ADHD Focus Seeker ("Miko")
- 22, university student, recently diagnosed ADHD
- Brown noise is a lifeline — searches for it constantly
- Frustrated that good tools require subscriptions
- Wants: reliable, free brown noise + ability to layer other sounds
- Willing to pay: only if the premium features genuinely help focus

### 4. Team Lead ("Jordan")
- 40, manages a team of 12 in a hybrid office
- Looking for small tools that improve team wellbeing
- Wants: something to recommend to the team, ideally with a focus timer
- Willing to pay: company expense for team tools

---

## User Stories

### Core (Free Tier)

| # | As a... | I want to... | So that... |
|---|---------|-------------|------------|
| US-1 | User | Play a rain sound with one click | I can start focusing immediately |
| US-2 | User | Adjust volume of individual sounds | I can create my perfect mix |
| US-3 | User | Mix multiple sounds simultaneously | I can layer rain + coffee shop + fire |
| US-4 | User | Stop all sounds with one button | I can answer a call quickly |
| US-5 | User | See a visual animation for each active sound | I feel the sounds, not just hear them |
| US-6 | User | Use the app on my phone | I can use it anywhere |

### Premium Features

| # | As a... | I want to... | So that... |
|---|---------|-------------|------------|
| US-7 | User | Experience themed soundscapes (Roman Piazza, Ancient Kyoto) | I feel transported to a different place |
| US-8 | User | Set a Pomodoro timer with sound transitions | I can structure my focus sessions |
| US-9 | User | Save and load my favorite sound mixes | I don't have to recreate them every time |
| US-10 | User | Install the app on my device as a PWA | I can use it offline, like a native app |

---

## Free vs Premium Boundary

| Feature | Free | Premium ($3.99 one-time) |
|---------|------|--------------------------|
| Basic sounds (6) | Yes | Yes |
| Individual volume sliders | Yes | Yes |
| Mix & match | Yes | Yes |
| Master play/stop | Yes | Yes |
| Canvas visualizations | Yes | Yes |
| Themed soundscapes | — | Yes |
| Pomodoro timer | — | Yes |
| Save/load presets | — | Yes |
| New soundscape packs | — | Yes (future) |

---

## Non-Goals (Explicit)

- **No user accounts or authentication** — privacy by design
- **No backend/server** — everything runs client-side
- **No audio file streaming** — all sounds are procedural
- **No social features** — this is a personal focus tool
- **No mobile native app** — PWA is sufficient
- **No AI-generated content** — the synthesis IS the product

---

## User Journey

```
Land on nois.app
    → See dark UI with 6 sound cards, "Start" labels
    → Tap "Rain" → rain starts, card animates, slider appears
    → Tap "Coffee Shop" → layers on top of rain
    → Adjust sliders → perfect mix
    → Notice "Soundscapes" section (locked with "Pro" badge)
    → Curious, taps "Roman Piazza" → preview plays for 10s, then prompt
    → Decides to unlock Pro ($3.99)
    → All soundscapes + Pomodoro + Presets unlocked
    → Saves "My Focus Mix" preset
    → Installs as PWA on phone
    → Uses daily
```

---

## Information Architecture

```
┌─────────────────────────────────────────────┐
│                  NOIS                        │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │        Canvas Visualizer            │    │
│  │    (animated per active sound)      │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  BASIC SOUNDS                               │
│  ┌──────┐ ┌──────┐ ┌──────┐               │
│  │ Rain │ │ Wind │ │ Fire │               │
│  │ ━━━━ │ │ ━━━━ │ │ ━━━━ │               │
│  └──────┘ └──────┘ └──────┘               │
│  ┌──────┐ ┌──────┐ ┌──────┐               │
│  │Coffee│ │White │ │Brown │               │
│  │ Shop │ │Noise │ │Noise │               │
│  │ ━━━━ │ │ ━━━━ │ │ ━━━━ │               │
│  └──────┘ └──────┘ └──────┘               │
│                                             │
│  SOUNDSCAPES 🔒                             │
│  ┌────────────┐ ┌────────────┐             │
│  │Roman Piazza│ │Ancient     │             │
│  │            │ │Kyoto       │             │
│  └────────────┘ └────────────┘             │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │  ⏱ Pomodoro  │  💾 Presets  │  🔊  │    │
│  └─────────────────────────────────────┘    │
└─────────────────────────────────────────────┘
```
