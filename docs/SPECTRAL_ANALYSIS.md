# Spectral Analysis Report — Nois Generators

Static analysis of audio graph parameters vs. known acoustic profiles of real-world sounds.

## Methodology

Each generator uses Web Audio API biquad filters on white/brown/pink noise. We compute the theoretical frequency response from filter parameters (type, frequency, Q) and compare against published acoustic research on real sounds.

**Biquad filter basics:**
- Bandpass at `f₀` with Q: -3dB bandwidth = f₀/Q. Higher Q = narrower band.
- Lowpass at `f₀`: passes below f₀, -3dB at cutoff, 12dB/octave rolloff.
- Highpass at `f₀`: passes above f₀, same rolloff.

---

## 1. Steady Rain ⚠️ Needs Work

**Current:** White noise → Bandpass 600Hz Q=0.3 → gain 0.15
- Bandwidth = 600/0.3 = 2000Hz → passes ~100–2100Hz (very wide)
- Effectively a gentle bandpass, most energy 200–1500Hz

**Real rain profile (research):**
- Broadband, most energy 500–5000Hz
- Spectral peak shifts with intensity: light rain peaks ~2–4kHz (individual drop splashes), heavy rain is flatter
- Significant energy above 2kHz from drop impacts on surfaces
- Low-frequency rumble (<200Hz) from aggregate distant drops

**Issues:**
1. ❌ **Too little high-frequency energy** — bandpass at 600Hz cuts off the characteristic "hiss" of rain above 2kHz
2. ❌ **Missing surface impact texture** — real rain has distinct spectral signatures from drops hitting different surfaces (puddles, leaves, glass)
3. ⚠️ **Q too low** — the filter barely shapes the noise, resulting in a generic "whoosh" rather than rain character

**Recommendations:**
- Raise center frequency to ~1200Hz and increase Q to 0.5–0.8
- Add a second layer: highpass/bandpass ~3000–5000Hz at low gain (0.02) for the "sparkle" of individual drops
- Consider the raindrop impact synthesis from light-drizzle.ts — it's actually more realistic

---

## 2. Light Drizzle ✅ Good

**Current:** Faint background (bandpass 600Hz Q=0.3, gain 0.008) + individual drop events:
- 40% glass drops: bandpass 2500–4500Hz Q=0.6
- 35% leaf drops: bandpass 800–2000Hz Q=0.4
- 25% puddle drops: lowpass 400–700Hz

**Real light rain profile:**
- Individual drops dominate over continuous noise
- Drops on hard surfaces: brief broadband with peak 2–5kHz
- Drops on soft surfaces: lower frequency, 500–1500Hz
- Background is very quiet — mostly ambient

**Assessment:** This is well-designed. The three drop types create realistic variety. The quiet background lets drops stand out.

**Minor improvements:**
- Could add very slight highpass at ~4000Hz for occasional "tink" drops at gain 0.01

---

## 3. Heavy Downpour ✅ Good Architecture

**Current:** 5-layer continuous:
- Deep drops: bandpass 250Hz Q=0.3, gain 0.025
- Mid rain: bandpass 500Hz Q=0.25, gain 0.02
- Shimmer: highpass 3000Hz, gain 0.005
- Rumble: lowpass 150Hz, gain 0.04
- Thunder bed: lowpass 120Hz (event-driven)

**Real heavy rain:**
- Dense broadband noise, relatively flat 100Hz–8kHz
- More low-frequency energy than light rain (aggregate of many drops)
- Surface runoff adds constant mid-frequency noise
- Reduced individual drop distinction (everything blends)

**Assessment:** Good multi-layer approach covers the spectrum. The shimmer layer at 3kHz is a nice touch.

**Improvements:**
- ⚠️ Mid layer at 500Hz should be wider — consider bandpass 800Hz Q=0.2 or even 1200Hz to fill the 500–2000Hz gap
- The 2000–3000Hz range has no dedicated layer — add bandpass ~1800Hz Q=0.3, gain 0.015

---

## 4. Thunderstorm ✅ Good (same architecture as Heavy Downpour)

Same notes as Heavy Downpour. Thunder implementation with multi-strike sequences is excellent.

---

## 5. Gentle Breeze ⚠️ Minor Issues

**Current:** White noise → Lowpass 350Hz Q=0.2 → LFO sweep ±80Hz → gain 0.15

**Real gentle breeze:**
- Mostly below 400Hz — correct!
- Very soft spectral rolloff, no sharp cutoff
- Slow amplitude modulation — correct!
- Some broadband turbulence noise at very low level

**Assessment:** Mostly accurate. The breathing cycle is a great touch.

**Improvements:**
- ⚠️ Q=0.2 makes the rolloff very gentle (overdamped) — this is actually realistic for wind
- Could add a tiny amount of unfiltered noise (gain 0.003) for air turbulence texture

---

## 6. Forest Wind ✅ Good

**Current:** Two layers:
- Wind: lowpass 350Hz Q=0.3, gain 0.10, LFO depth 120
- Rustle: bandpass 6000Hz Q=0.3, gain 0.015, LFO modulated

**Real forest wind:**
- Base wind: below 400Hz (correct)
- Leaf rustle: broadband 3–8kHz (6kHz center is perfect)
- Rustle amplitude correlates with wind gusts

**Assessment:** Well-designed. Two-layer approach captures both components. LFO on rustle gain creates natural variation.

---

## 7. Coastal Wind ✅ Excellent

**Current:** Wind (lowpass 1200Hz Q=0.8, LFO depth 500) + wave crash events (4 sub-layers: swell, crash, foam, thud)

**Real coastal wind/waves:**
- Wind is louder and more mid-frequency than inland (salt air, open space)
- Wave crashes: complex broadband event with low thud, mid crash, high foam
- Spectral content changes through wave lifecycle

**Assessment:** This is the best-designed generator. Four wave sub-layers accurately model the spectral evolution of a wave crash.

---

## 8. Crackling Fire ⚠️ Needs Work

**Current:** 
- Crackle: bandpass 500Hz Q=2, gain 0.06 (bandwidth = 250Hz → passes 375–625Hz only)
- Rumble: lowpass 150Hz, gain 0.08

**Real fire:**
- Crackle transients are **broadband**, not narrowband — energy from 200Hz to 5000Hz+
- Individual crackles have fast attack, short duration (10–50ms)
- The "body" of fire is low-frequency rumble 40–200Hz (correct)
- Hot coals produce higher-frequency hiss 1–3kHz
- Wood pops are sharp broadband impulses

**Issues:**
1. ❌ **Crackle too narrowband** — Q=2 at 500Hz only passes 375–625Hz. Real crackles are broadband transients
2. ❌ **Missing high-frequency content** — no representation of the hiss/sizzle above 1kHz
3. ⚠️ **Crackle modulation too smooth** — gain ramps create swooshing rather than sharp pops

**Recommendations:**
- Lower Q to 0.5–0.8 for wider crackle bandwidth
- Raise crackle frequency to 800Hz for better center of the broadband crackle
- Add a third layer: bandpass ~2500Hz Q=0.5, very low gain (0.015) for ember sizzle
- Make crackle bursts shorter: decay 0.02–0.05s instead of 0.05–0.15s for sharper transients
- Add occasional "pop" events: very brief (5ms) high-gain burst followed by silence

---

## 9. Flowing River ✅ Good

**Current:** Three layers:
- Layer 1: bandpass 800Hz Q=0.5, gain 0.008, LFO depth 150
- Layer 2: bandpass 2200Hz Q=1.0, gain 0.006, LFO depth 600
- Gurgles: sine 400–1600Hz with bandpass Q=10–25, gain 0.01–0.025

**Real river:**
- Broadband turbulence noise 200–3000Hz (covered by layers 1+2)
- Gurgling from air entrainment: narrowband, 300–1500Hz (accurate)
- Low rumble from water volume: <200Hz

**Improvements:**
- ⚠️ Missing low-frequency "body" — add lowpass layer at 200Hz, gain 0.006 for water mass rumble
- Gurgle Q values (10–25) are very high — real gurgles are slightly wider, try Q=5–10

---

## 10. Rustling Leaves ✅ Good

**Current:** Bandpass 2500Hz Q=0.8 + bandpass 7000Hz Q=1.0 with gust events

**Real rustling leaves:**
- Broadband noise 2–10kHz — correct frequency range
- Amplitude is highly variable (gust-driven) — implemented
- Individual leaves: brief broadband bursts 3–6kHz

**Assessment:** Good spectral placement. The two-band approach captures both the swoosh and the crisp detail.

---

## 11. Birds at Dawn ✅ Excellent

**Current:** 6 call types using sine oscillators with frequency sweeps:
- Range: 1500Hz–8000Hz
- Variety: chirps, trills, twitters, whistles, two-note calls, warbles

**Real birdsong:**
- Most species: 1–8kHz (correct)
- Sine tones with frequency modulation (correct approach)
- Species have characteristic patterns (modeled by 6 call types)

**Assessment:** Excellent implementation. The variety of call types creates a convincing dawn chorus. The warble with vibrato oscillator is a nice touch.

---

## 12. Crickets & Night ✅ Good

**Current:** Night bed (lowpass 250Hz, gain 0.04) + 3 cricket voices (5500Hz, 4800Hz, 6200Hz)

**Real crickets:**
- Cricket chirps: pure tones, typically 3–7kHz (correct range)
- Different species at different frequencies (modeled by 3 voices)
- Night ambient: very low-frequency (insects, distant traffic) below 300Hz

**Improvements:**
- ⚠️ Cricket frequencies might be slightly high — most common species chirp at 4–5kHz
- Consider lowering cricket 1 from 5500Hz to 4500Hz

---

## 13. Coffee Shop ✅ Good

**Current:** Pink noise murmur (lowpass 500Hz), room tone (lowpass 120Hz), clink events (sine 1500–3500Hz)

**Real coffee shop:**
- Speech: formant bands at 300Hz, 700Hz, 1200Hz, 2500Hz
- HVAC/room: below 200Hz (correct)
- Espresso machine: broadband hiss 2–8kHz (missing)
- Cup/saucer clinks: 1–5kHz transients (modeled)

**Improvements:**
- ⚠️ Murmur filter at 500Hz is too low for speech — speech has significant energy at 700Hz and 1200Hz
- Consider adding a second murmur layer: bandpass ~1000Hz Q=1.0, gain 0.06
- Add occasional espresso machine hiss: highpass 3000Hz, gain 0.01, duration 2–4s

---

## 14. Horse Hooves ✅ Good

**Current:** Per-hoof: lowpass 220–280Hz Q=1.5 (body) + bandpass 450–650Hz Q=2–3.5 (knock)

**Real hooves on cobblestone:**
- Impact: broadband with peak 200–600Hz (correct)
- Cobblestone gives more high-frequency content than dirt
- Rhythmic gait patterns (well-implemented trot/walk)

**Assessment:** Good spectral placement. The trot gait implementation with paired beats is realistic.

---

## 15. Crowd Murmur ✅ Excellent

**Current:** 4 formant bands from pink noise:
- A: 350Hz Q=3, E: 700Hz Q=2.5, I: 1200Hz Q=2, Sibilance: 2500Hz Q=1.5
- All with independent LFO gain modulation

**Real crowd:**
- Speech formants exactly at these frequencies — textbook accurate
- Multiple independent speakers → independent modulation (correct)

**Assessment:** Acoustically the most accurate generator. The formant approach is spot-on.

---

## 16. Train Journey ✅ Good

**Current:** Rumble (lowpass 200Hz Q=0.5) + rail clicks (bandpass 500–700Hz Q=3) + bridge crossings (highpass 3000Hz)

**Real train:**
- Wheel rumble: 20–200Hz (correct)
- Rail joints: metallic click 400–800Hz (correct)
- Bridge/tunnel resonance: changed acoustic character (correct)
- Missing: HVAC hum, car sway creaks

**Assessment:** Good basic train sound. Rail click pattern is well-implemented.

---

## 17. Deep Space ⚠️ Minor Issues

**Current:** Lowpass noise at 120Hz Q=0.7 + 3 sine drones (40, 60, 80.5Hz) + LFO

**Assessment:** This is an abstract/ambient sound, so no "real" reference exists. The sub-bass drones create a spacious feeling.

**Improvements:**
- ⚠️ Drone frequencies are very close together (40, 60, 80.5Hz) — creates beating patterns which may or may not be desired
- Consider wider spacing: 40Hz, 75Hz, 110Hz for more distinct harmonics
- Could add very faint high-frequency "stars" — random sine pings at 3000–8000Hz, gain 0.002

---

## 18. Deep Water ✅ Good

**Current:** Brown noise (lowpass 200Hz) + bubbles (bandpass 400Hz Q=8) + sine drips (800–1400Hz)

**Real underwater:**
- Very low-frequency dominated (<200Hz) — correct
- Bubble pops: narrowband 300–600Hz — correct
- Distant drips/clicks: mid-frequency transients — modeled

**Assessment:** Good implementation. Brown noise gives more natural low-frequency character than white noise.

---

## 19. Tibetan Bowl ⚠️ Minor Issues

**Current:** 5 inharmonic partials: fundamental×[1, 2.71, 4.95, 7.2, 10.1]

**Real singing bowl:**
- Inharmonic spectrum — correct approach!
- Published ratios for Tibetan bowls (from Acoustics of Himalayan singing bowls):
  - Typical: 1 : 2.7–3.0 : 4.8–5.5 : 7.0–8.0 : 9.5–11.0
- Current ratios fit within these ranges — good!

**Improvements:**
- ⚠️ Missing the "wobble" — real bowls have two slightly detuned modes per partial (creates beating). Could add a second oscillator per partial, offset by 1–3Hz
- Decay times could vary per partial — higher partials decay faster in real bowls

---

## Priority Improvement Ranking

### High Impact (most noticeable to users)

1. **Crackling Fire** — Too narrowband, missing high-frequency sizzle. Widen Q, add ember layer.
2. **Steady Rain** — Center frequency too low, missing characteristic rain hiss above 2kHz.

### Medium Impact

3. **Coffee Shop** — Murmur needs higher frequency content for speech realism.
4. **Flowing River** — Missing low-frequency water mass rumble.
5. **Heavy Downpour** — Gap in 1–3kHz range.

### Low Impact (polish)

6. **Deep Space** — Drone spacing could be improved.
7. **Tibetan Bowl** — Adding wobble/beating would enhance realism.
8. **Crickets** — Slightly lower frequencies would be more natural.
9. **Gentle Breeze** — Add trace of turbulence noise.

---

## Proposed Code Changes

### 1. Fix Crackling Fire (highest priority)

```typescript
// Current:
this.bandpass.frequency.value = 500;
this.bandpass.Q.value = 2;

// Proposed:
this.bandpass.frequency.value = 800;
this.bandpass.Q.value = 0.6;

// Add third layer — ember sizzle:
// bandpass 2500Hz Q=0.5, gain 0.015
// with random hiss events every 2-5 seconds
```

### 2. Fix Steady Rain

```typescript
// Current:
this.filter.frequency.value = 600;
this.filter.Q.value = 0.3;

// Proposed:
this.filter.frequency.value = 1200;
this.filter.Q.value = 0.6;

// Add shimmer layer:
// highpass 3500Hz, gain 0.015 — the "sparkle" of drops
```

### 3. Enhance Coffee Shop

```typescript
// Add speech presence layer:
// bandpass 1000Hz Q=1.0, gain 0.06 — missing formant range
```
