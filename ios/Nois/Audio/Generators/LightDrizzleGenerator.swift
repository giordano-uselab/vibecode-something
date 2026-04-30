import AVFoundation

/// Light Drizzle — sparse drops on a window with a quiet noise bed.
final class LightDrizzleGenerator: BaseSoundGenerator {
    private var player: AVAudioPlayerNode?
    private var eq: AVAudioUnitEQ?
    private var gainNode: AVAudioMixerNode?

    init() { super.init(id: "light-drizzle", name: "Light Drizzle") }

    override func buildAudioGraph(engine: AVAudioEngine, output: AVAudioMixerNode) {
        let buffer = createNoiseBuffer(engine: engine)

        // Quiet noise bed
        gainNode = createGainNode(engine: engine, volume: 0.008, output: output)
        eq = createEQ(engine: engine, type: .bandPass, frequency: 600, bandwidth: 3.0, output: gainNode!)
        player = createLoopingPlayer(engine: engine, buffer: buffer, output: eq!)

        // One-shot pool for individual drops
        setupOneshotPool(engine: engine, output: output)
    }

    override func startAudioGraph() {
        guard let player else { return }
        let buffer = createNoiseBuffer(engine: engine!)
        startLooping(player: player, buffer: buffer)
        scheduleDrop()
    }

    private func scheduleDrop() {
        guard isPlaying else { return }
        let sr = sampleRate

        // 30% fast burst, 70% slower spacing
        let delay: Double
        if Float.random(in: 0...1) < 0.3 {
            delay = Double(40 + Float.random(in: 0...80)) / 1000
        } else {
            delay = Double(120 + Float.random(in: 0...250)) / 1000
        }

        scheduleDelayed(delay: delay) { [weak self] in
            self?.playDrop(sampleRate: sr)
            self?.scheduleDrop()
        }
    }

    private func playDrop(sampleRate sr: Double) {
        let roll = Float.random(in: 0...1)
        let duration: Double = 0.08

        if roll < 0.4 {
            // Tiny drop — high frequency
            let burst = createNoiseBurst(sampleRate: sr, duration: duration) { t in
                pow(1 - t, 3) // fast decay shape
            }
            playOneShot(buffer: burst, volume: 0.03 + Float.random(in: 0...0.025))
        } else if roll < 0.75 {
            // Medium drop
            let burst = createNoiseBurst(sampleRate: sr, duration: duration) { t in
                pow(1 - t, 3)
            }
            playOneShot(buffer: burst, volume: 0.04 + Float.random(in: 0...0.03))
        } else {
            // Puddle plop — lower frequency
            let burst = createNoiseBurst(sampleRate: sr, duration: duration) { t in
                pow(1 - t, 2)
            }
            playOneShot(buffer: burst, volume: 0.05 + Float.random(in: 0...0.035))
        }
    }

    override func stopAudioGraph() {
        player?.stop()
    }

    override func teardownAudioGraph() {
        teardownOneshotPool()
        if let p = player { engine?.detach(p) }
        if let e = eq { engine?.detach(e) }
        if let g = gainNode { engine?.detach(g) }
        player = nil; eq = nil; gainNode = nil
    }
}
