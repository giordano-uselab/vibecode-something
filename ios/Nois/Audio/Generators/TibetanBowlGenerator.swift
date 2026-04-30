import AVFoundation

/// Tibetan Bowl — resonating singing bowl with periodic strikes.
final class TibetanBowlGenerator: BaseSoundGenerator {

    init() { super.init(id: "tibetan-bowl", name: "Tibetan Bowl") }

    override func buildAudioGraph(engine: AVAudioEngine, output: AVAudioMixerNode) {
        setupOneshotPool(engine: engine, output: output, size: 6)
    }

    override func startAudioGraph() {
        // First strike immediately
        playStrike()
        scheduleNextStrike()
    }

    private func scheduleNextStrike() {
        guard isPlaying else { return }
        let delay = 10.0 + Double.random(in: 0...10) // 10-20s
        scheduleDelayed(delay: delay) { [weak self] in
            guard let self, self.isPlaying else { return }
            self.playStrike()
            self.scheduleNextStrike()
        }
    }

    private func playStrike() {
        let sr = sampleRate
        let fundamental = 180 + Float.random(in: 0...80) // 180-260Hz

        // Inharmonic partials — characteristic of singing bowls
        let partials: [(ratio: Float, amp: Float)] = [
            (1.0, 0.06),
            (2.71, 0.035),
            (4.95, 0.02),
            (7.2, 0.01),
            (10.1, 0.005),
        ]

        let decayTime = 8.0 + Double.random(in: 0...4) // 8-12s

        for partial in partials {
            let freq = fundamental * partial.ratio
            let decay = Float(1.0 / decayTime) * 2 // faster decay for higher partials
            let buf = createSineBurst(sampleRate: sr, frequency: freq, duration: decayTime, decay: decay)
            playOneShot(buffer: buf, volume: partial.amp)
        }
    }

    override func stopAudioGraph() {}

    override func teardownAudioGraph() {
        teardownOneshotPool()
    }
}
