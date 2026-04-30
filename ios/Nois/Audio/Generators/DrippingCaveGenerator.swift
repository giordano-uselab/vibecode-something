import AVFoundation

/// Dripping Cave — sparse drip echoes in silence.
final class DrippingCaveGenerator: BaseSoundGenerator {

    init() { super.init(id: "dripping-cave", name: "Dripping Cave") }

    override func buildAudioGraph(engine: AVAudioEngine, output: AVAudioMixerNode) {
        setupOneshotPool(engine: engine, output: output, size: 4)
    }

    override func startAudioGraph() {
        scheduleDrip()
    }

    private func scheduleDrip() {
        guard isPlaying else { return }
        let interval = 2.8 + Double.random(in: 0...0.4) // ~3s between drips
        scheduleDelayed(delay: interval) { [weak self] in
            guard let self, self.isPlaying else { return }
            let sr = self.sampleRate
            let freq = 2000 + Float.random(in: 0...800)
            let vol: Float = 0.12 + Float.random(in: 0...0.04)

            // Short noise burst shaped like a drip
            let burst = self.createNoiseBurst(sampleRate: sr, duration: 0.03) { t in
                expf(-t * 60) // extremely fast decay
            }
            self.playOneShot(buffer: burst, volume: vol)

            // Resonant ping for tonal quality
            let ping = self.createSineBurst(sampleRate: sr, frequency: freq, duration: 0.15, decay: 15)
            self.playOneShot(buffer: ping, volume: vol * 0.3)

            self.scheduleDrip()
        }
    }

    override func stopAudioGraph() {}

    override func teardownAudioGraph() {
        teardownOneshotPool()
    }
}
