import AVFoundation

/// Heartbeat — slow ominous heartbeat with drifting tempo.
final class HorrorHeartbeatGenerator: BaseSoundGenerator {
    private var bpm: Float = 55

    init() { super.init(id: "horror-heartbeat", name: "Heartbeat") }

    override func buildAudioGraph(engine: AVAudioEngine, output: AVAudioMixerNode) {
        setupOneshotPool(engine: engine, output: output, size: 4)
    }

    override func startAudioGraph() {
        bpm = 50 + Float.random(in: 0...10) // 50-60 BPM start
        scheduleHeartbeat()
    }

    private func scheduleHeartbeat() {
        guard isPlaying else { return }
        let sr = sampleRate

        // S1 "lub" — low thud at 35Hz
        let lub = createSineBurst(sampleRate: sr, frequency: 35, duration: 0.35, decay: 4)
        playOneShot(buffer: lub, volume: 0.12)

        // S2 "dub" — higher at 55Hz, offset 0.25s
        scheduleDelayed(delay: 0.25) { [weak self] in
            guard let self else { return }
            let dub = self.createSineBurst(sampleRate: sr, frequency: 55, duration: 0.2, decay: 6)
            self.playOneShot(buffer: dub, volume: 0.08)
        }

        // Drift tempo ±4 BPM per beat, clamp 40-80
        bpm += Float.random(in: -4...4)
        bpm = max(40, min(80, bpm))

        let beatInterval = 60.0 / Double(bpm)
        scheduleDelayed(delay: beatInterval) { [weak self] in
            self?.scheduleHeartbeat()
        }
    }

    override func stopAudioGraph() {}

    override func teardownAudioGraph() {
        teardownOneshotPool()
    }
}
