import AVFoundation

/// Crickets & Night — ambient night bed with rhythmic cricket chirps.
final class CricketsNightGenerator: BaseSoundGenerator {
    private var ambPlayer: AVAudioPlayerNode?
    private var ambEq: AVAudioUnitEQ?
    private var ambGain: AVAudioMixerNode?

    init() { super.init(id: "crickets-night", name: "Crickets & Night") }

    override func buildAudioGraph(engine: AVAudioEngine, output: AVAudioMixerNode) {
        let noise = createNoiseBuffer(engine: engine)

        // Night ambience — lowpass 250Hz
        ambGain = createGainNode(engine: engine, volume: 0.04, output: output)
        ambEq = createEQ(engine: engine, type: .lowPass, frequency: 250, output: ambGain!)
        ambPlayer = createLoopingPlayer(engine: engine, buffer: noise, output: ambEq!)

        // Chirp pool
        setupOneshotPool(engine: engine, output: output, size: 6)
    }

    override func startAudioGraph() {
        guard let engine, let ambPlayer else { return }
        let noise = createNoiseBuffer(engine: engine)
        startLooping(player: ambPlayer, buffer: noise)

        // Cricket 1: 5500Hz, 2-3 pulses, ~1s interval
        scheduleCricket(freq: 5500, vol: 0.012, minPulses: 2, maxPulses: 3,
                        interval: 0.9 + Double.random(in: 0...0.2))
        // Cricket 2: 4800Hz, 3-4 pulses, ~1.4s interval
        scheduleCricket(freq: 4800, vol: 0.008, minPulses: 3, maxPulses: 4,
                        interval: 1.2 + Double.random(in: 0...0.4))
        // Cricket 3: random freq, 2-4 pulses, ~4s interval
        scheduleCricket(freq: 6200 + Float.random(in: 0...400), vol: 0.006,
                        minPulses: 2, maxPulses: 4,
                        interval: 2.5 + Double.random(in: 0...3))
    }

    private func scheduleCricket(freq: Float, vol: Float, minPulses: Int, maxPulses: Int, interval: Double) {
        guard isPlaying else { return }
        scheduleDelayed(delay: interval) { [weak self] in
            guard let self, self.isPlaying else { return }
            let pulseCount = Int.random(in: minPulses...maxPulses)
            self.playChirpBurst(freq: freq, vol: vol, pulses: pulseCount)
            self.scheduleCricket(freq: freq, vol: vol, minPulses: minPulses,
                                 maxPulses: maxPulses, interval: interval)
        }
    }

    private func playChirpBurst(freq: Float, vol: Float, pulses: Int) {
        let sr = sampleRate
        let pulseInterval = 0.055 + Double.random(in: 0...0.015)
        let pulseDuration = 0.030 + Double.random(in: 0...0.010)

        for i in 0..<pulses {
            let burst = createSineBurst(sampleRate: sr, frequency: freq, duration: pulseDuration, decay: 30)
            let delay = Double(i) * pulseInterval
            scheduleDelayed(delay: delay) { [weak self] in
                self?.playOneShot(buffer: burst, volume: vol)
            }
        }
    }

    override func stopAudioGraph() {
        ambPlayer?.stop()
    }

    override func teardownAudioGraph() {
        teardownOneshotPool()
        if let p = ambPlayer { engine?.detach(p) }
        if let e = ambEq { engine?.detach(e) }
        if let g = ambGain { engine?.detach(g) }
        ambPlayer = nil; ambEq = nil; ambGain = nil
    }
}
