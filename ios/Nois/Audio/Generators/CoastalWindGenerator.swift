import AVFoundation

/// Coastal Wind — strong wind with gusts and wave crashes.
final class CoastalWindGenerator: BaseSoundGenerator {
    private var windPlayer: AVAudioPlayerNode?
    private var windEq: AVAudioUnitEQ?
    private var windGain: AVAudioMixerNode?

    init() { super.init(id: "coastal-wind", name: "Coastal Wind") }

    override func buildAudioGraph(engine: AVAudioEngine, output: AVAudioMixerNode) {
        let noise = createNoiseBuffer(engine: engine)

        windGain = createGainNode(engine: engine, volume: 0.12, output: output)
        windEq = createEQ(engine: engine, type: .lowPass, frequency: 1200, bandwidth: 1.25, output: windGain!)
        windPlayer = createLoopingPlayer(engine: engine, buffer: noise, output: windEq!)

        setupOneshotPool(engine: engine, output: output, size: 4)
    }

    override func startAudioGraph() {
        guard let engine else { return }
        let noise = createNoiseBuffer(engine: engine)
        if let wp = windPlayer { startLooping(player: wp, buffer: noise) }
        scheduleGusts()
        scheduleWaveCrash()
    }

    private func scheduleGusts() {
        let interval = 4.0 + Double.random(in: 0...6)
        scheduleTimer(interval: interval) { [weak self] in
            guard let self, Float.random(in: 0...1) < 0.6 else { return }
            let peak: Float = 0.18 + Float.random(in: 0...0.08)
            self.windGain?.outputVolume = peak
            self.scheduleDelayed(delay: 1.5 + Double.random(in: 0...1)) { [weak self] in
                self?.windGain?.outputVolume = 0.12
            }
        }
    }

    private func scheduleWaveCrash() {
        guard isPlaying else { return }
        let delay = 7.0 + Double.random(in: 0...2)
        scheduleDelayed(delay: delay) { [weak self] in
            guard let self, self.isPlaying else { return }
            let sr = self.sampleRate
            let intensity: Float = 0.4 + Float.random(in: 0...0.3)
            // Crash noise burst
            let burst = self.createNoiseBurst(sampleRate: sr, duration: 0.8) { t in
                let attack = min(t * 5, 1.0) // fast attack
                let decay = max(0, 1 - (t - 0.2) * 1.5) // slower decay
                return attack * decay
            }
            self.playOneShot(buffer: burst, volume: 0.15 * intensity)
            // Foam hiss
            self.scheduleDelayed(delay: 0.5) { [weak self] in
                guard let self else { return }
                let foam = self.createNoiseBurst(sampleRate: sr, duration: 2.5) { t in
                    max(0, 1 - t * 0.5) // slow decay
                }
                self.playOneShot(buffer: foam, volume: 0.06 * intensity)
            }
            self.scheduleWaveCrash()
        }
    }

    override func stopAudioGraph() {
        windPlayer?.stop()
    }

    override func teardownAudioGraph() {
        teardownOneshotPool()
        if let p = windPlayer { engine?.detach(p) }
        if let e = windEq { engine?.detach(e) }
        if let g = windGain { engine?.detach(g) }
        windPlayer = nil; windEq = nil; windGain = nil
    }
}
