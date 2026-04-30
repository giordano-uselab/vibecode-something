import AVFoundation

/// Birds at Dawn — oscillator-based birdsong with varied call types.
final class BirdsAtDawnGenerator: BaseSoundGenerator {

    init() { super.init(id: "birds-at-dawn", name: "Birds at Dawn") }

    override func buildAudioGraph(engine: AVAudioEngine, output: AVAudioMixerNode) {
        setupOneshotPool(engine: engine, output: output, size: 6)
    }

    override func startAudioGraph() {
        scheduleBirdCall()
    }

    private func scheduleBirdCall() {
        guard isPlaying else { return }
        // 20% long pause, 80% normal spacing
        let delay: Double
        if Float.random(in: 0...1) < 0.2 {
            delay = 2.0 + Double.random(in: 0...4) // 2-6s
        } else {
            delay = 0.4 + Double.random(in: 0...1.2) // 0.4-1.6s
        }
        scheduleDelayed(delay: delay) { [weak self] in
            guard let self, self.isPlaying else { return }
            self.playRandomCall()
            self.scheduleBirdCall()
        }
    }

    private func playRandomCall() {
        let sr = sampleRate
        let roll = Float.random(in: 0...1)

        if roll < 0.2 {
            playChirp(sr: sr)
        } else if roll < 0.35 {
            playTrill(sr: sr)
        } else if roll < 0.5 {
            playTwitter(sr: sr)
        } else if roll < 0.7 {
            playWhistleSong(sr: sr)
        } else if roll < 0.85 {
            playTwoNote(sr: sr)
        } else {
            playWarble(sr: sr)
        }
    }

    private func playChirp(sr: Double) {
        let freq = 3000 + Float.random(in: 0...3000)
        let burst = createSineBurst(sampleRate: sr, frequency: freq, duration: 0.14, decay: 10)
        playOneShot(buffer: burst, volume: 0.025)
    }

    private func playTrill(sr: Double) {
        let baseFreq = 4000 + Float.random(in: 0...2500)
        let noteCount = Int.random(in: 4...9)
        let speed = 0.04 + Double.random(in: 0...0.03)
        let interval = 200 + Float.random(in: 0...400)

        for i in 0..<noteCount {
            let freq = i % 2 == 0 ? baseFreq : baseFreq + interval
            let burst = createSineBurst(sampleRate: sr, frequency: freq, duration: speed, decay: 15)
            scheduleDelayed(delay: Double(i) * speed) { [weak self] in
                self?.playOneShot(buffer: burst, volume: 0.018)
            }
        }
    }

    private func playTwitter(sr: Double) {
        let baseFreq = 5000 + Float.random(in: 0...2000)
        let noteCount = Int.random(in: 6...13)
        for i in 0..<noteCount {
            let jitter = Float.random(in: -400...400)
            let burst = createSineBurst(sampleRate: sr, frequency: baseFreq + jitter, duration: 0.025, decay: 20)
            scheduleDelayed(delay: Double(i) * 0.025) { [weak self] in
                self?.playOneShot(buffer: burst, volume: 0.012)
            }
        }
    }

    private func playWhistleSong(sr: Double) {
        let baseFreq = 2000 + Float.random(in: 0...1500)
        let noteCount = Int.random(in: 4...8)
        var t: Double = 0
        for i in 0..<noteCount {
            let dur = 0.12 + Double.random(in: 0...0.15)
            let arcPos = Float(i) / Float(noteCount - 1) // 0..1
            let arcOffset = sin(arcPos * Float.pi) * 1200 - 600
            let freq = baseFreq + arcOffset
            let burst = createSineBurst(sampleRate: sr, frequency: max(freq, 300), duration: dur, decay: 4)
            let capturedT = t
            scheduleDelayed(delay: capturedT) { [weak self] in
                self?.playOneShot(buffer: burst, volume: 0.02 + Float.random(in: 0...0.01))
            }
            t += dur + 0.02
        }
    }

    private func playTwoNote(sr: Double) {
        let high = 3500 + Float.random(in: 0...2000)
        let low = high * (0.65 + Float.random(in: 0...0.15))
        let descending = Float.random(in: 0...1) < 0.6
        let dur = 0.15 + Double.random(in: 0...0.12)
        let vol: Float = 0.025 + Float.random(in: 0...0.01)

        let first = descending ? high : low
        let second = descending ? low : high

        let b1 = createSineBurst(sampleRate: sr, frequency: first, duration: dur, decay: 6)
        playOneShot(buffer: b1, volume: vol)
        let b2 = createSineBurst(sampleRate: sr, frequency: second, duration: dur, decay: 6)
        scheduleDelayed(delay: dur + 0.05) { [weak self] in
            self?.playOneShot(buffer: b2, volume: vol * 0.85)
        }
    }

    private func playWarble(sr: Double) {
        let freq = 2500 + Float.random(in: 0...2000)
        let dur = 0.3 + Double.random(in: 0...0.3)
        // Create a warbling tone with vibrato baked in
        let format = AVAudioFormat(standardFormatWithSampleRate: sr, channels: 1)!
        let frameCount = AVAudioFrameCount(sr * dur)
        let buffer = AVAudioPCMBuffer(pcmFormat: format, frameCapacity: frameCount)!
        buffer.frameLength = frameCount
        let data = buffer.floatChannelData![0]
        let vibratoRate = 15 + Float.random(in: 0...20)
        let vibratoDepth = 150 + Float.random(in: 0...150)
        for i in 0..<Int(frameCount) {
            let t = Float(i) / Float(sr)
            let vibrato = sin(2 * Float.pi * vibratoRate * t) * vibratoDepth
            let envelope = expf(-t * 3)
            data[i] = sin(2 * Float.pi * (freq + vibrato) * t) * envelope
        }
        playOneShot(buffer: buffer, volume: 0.018)
    }

    override func stopAudioGraph() {}

    override func teardownAudioGraph() {
        teardownOneshotPool()
    }
}
