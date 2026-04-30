import AVFoundation

/// Gentle Breeze — soft, delicate wind with breathing patterns.
final class GentleBreezeGenerator: BaseSoundGenerator {
    private var player: AVAudioPlayerNode?
    private var eq: AVAudioUnitEQ?
    private var gainNode: AVAudioMixerNode?

    init() { super.init(id: "gentle-breeze", name: "Gentle Breeze") }

    override func buildAudioGraph(engine: AVAudioEngine, output: AVAudioMixerNode) {
        let buffer = createNoiseBuffer(engine: engine)

        // Very soft lowpass — barely audible warmth
        gainNode = createGainNode(engine: engine, volume: 0.15, output: output)
        eq = createEQ(engine: engine, type: .lowPass, frequency: 350, bandwidth: 5.0, output: gainNode!)
        player = createLoopingPlayer(engine: engine, buffer: buffer, output: eq!)
    }

    override func startAudioGraph() {
        guard let player, let engine else { return }
        let buffer = createNoiseBuffer(engine: engine)
        startLooping(player: player, buffer: buffer)
        scheduleBreathe()
    }

    private func scheduleBreathe() {
        guard isPlaying, let gainNode else { return }

        // 30% chance of full silence, 70% just gets quieter
        let goSilent = Float.random(in: 0...1) < 0.3
        let targetVol: Float = goSilent ? 0 : 0.03 + Float.random(in: 0...0.06)
        let fadeOutDur = 3.0 + Double.random(in: 0...4) // 3-7s
        let silenceDur = goSilent ? 2.0 + Double.random(in: 0...5) : 0.5 + Double.random(in: 0...2)
        let fadeInDur = 2.0 + Double.random(in: 0...4) // 2-6s
        let peakVol: Float = 0.10 + Float.random(in: 0...0.10)

        // Fade out
        gainNode.outputVolume = targetVol
        scheduleDelayed(delay: fadeOutDur + silenceDur) { [weak self] in
            self?.gainNode?.outputVolume = peakVol
        }

        let totalDur = fadeOutDur + silenceDur + fadeInDur + Double.random(in: 0...3)
        scheduleDelayed(delay: totalDur) { [weak self] in
            self?.scheduleBreathe()
        }
    }

    override func stopAudioGraph() {
        player?.stop()
    }

    override func teardownAudioGraph() {
        if let p = player { engine?.detach(p) }
        if let e = eq { engine?.detach(e) }
        if let g = gainNode { engine?.detach(g) }
        player = nil; eq = nil; gainNode = nil
    }
}
