import AVFoundation

/// Ghosts — eerie ghostly whispers with Klatt-model voice formants.
final class HorrorGhostsGenerator: BaseSoundGenerator {
    private var bedPlayer: AVAudioPlayerNode?
    private var bedEq: AVAudioUnitEQ?
    private var bedGain: AVAudioMixerNode?

    init() { super.init(id: "horror-ghosts", name: "Ghosts") }

    override func buildAudioGraph(engine: AVAudioEngine, output: AVAudioMixerNode) {
        let pink = createPinkNoiseBuffer(engine: engine)

        // Ambient bed — lowpass 400Hz
        bedGain = createGainNode(engine: engine, volume: 0.02, output: output)
        bedEq = createEQ(engine: engine, type: .lowPass, frequency: 400, output: bedGain!)
        bedPlayer = createLoopingPlayer(engine: engine, buffer: pink, output: bedEq!)

        // Whisper pool
        setupOneshotPool(engine: engine, output: output, size: 6)
    }

    override func startAudioGraph() {
        guard let engine, let bedPlayer else { return }
        let pink = createPinkNoiseBuffer(engine: engine)
        startLooping(player: bedPlayer, buffer: pink)

        // Schedule 8 voice streams with different timings
        let voices: [(f0: Float, gain: Float)] = [
            (95, 0.030), (110, 0.028), (125, 0.026), (140, 0.025),
            (195, 0.022), (220, 0.020), (245, 0.018), (170, 0.024),
        ]
        for (i, voice) in voices.enumerated() {
            let initialDelay = Double(i) * 2.5 + Double.random(in: 0...2)
            scheduleDelayed(delay: initialDelay) { [weak self] in
                self?.scheduleVoiceBurst(f0: voice.f0, vol: voice.gain)
            }
        }
    }

    private func scheduleVoiceBurst(f0: Float, vol: Float) {
        guard isPlaying else { return }
        let sr = sampleRate

        // Speak duration 1.5-4s
        let dur = 1.5 + Double.random(in: 0...2.5)

        // Create a breathy whisper tone with formant-like spectral shape
        let format = AVAudioFormat(standardFormatWithSampleRate: sr, channels: 1)!
        let frameCount = AVAudioFrameCount(sr * dur)
        let buffer = AVAudioPCMBuffer(pcmFormat: format, frameCapacity: frameCount)!
        buffer.frameLength = frameCount
        let data = buffer.floatChannelData![0]

        let driftedF0 = f0 * Float.random(in: 0.8...1.2)

        for i in 0..<Int(frameCount) {
            let t = Float(i) / Float(sr)
            let tNorm = t / Float(dur)

            // Envelope: fade in 0.12s, sustain, fade out
            let fadeIn: Float = min(t / 0.12, 1)
            let fadeOut: Float = max(0, min(1, (1 - tNorm) * 5))
            let envelope = fadeIn * fadeOut

            // Mix of glottal (sawtooth) and noise (breathiness)
            let phase = t * driftedF0
            let sawtooth = 2 * (phase - floorf(phase)) - 1
            let noise = Float.random(in: -1...1)
            let sample = (sawtooth * 0.4 + noise * 0.6) * envelope

            data[i] = sample
        }

        playOneShot(buffer: buffer, volume: vol)

        // Pause 0.5-3s then speak again
        let pause = 0.5 + Double.random(in: 0...2.5)
        scheduleDelayed(delay: dur + pause) { [weak self] in
            self?.scheduleVoiceBurst(f0: f0, vol: vol)
        }
    }

    override func stopAudioGraph() {
        bedPlayer?.stop()
    }

    override func teardownAudioGraph() {
        teardownOneshotPool()
        if let p = bedPlayer { engine?.detach(p) }
        if let e = bedEq { engine?.detach(e) }
        if let g = bedGain { engine?.detach(g) }
        bedPlayer = nil; bedEq = nil; bedGain = nil
    }
}
