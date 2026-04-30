import AVFoundation

/// Steady Rain — bandpass-filtered noise with random intensity variations.
final class SteadyRainGenerator: BaseSoundGenerator {
    private var player: AVAudioPlayerNode?
    private var eq: AVAudioUnitEQ?
    private var gainNode: AVAudioMixerNode?

    init() { super.init(id: "steady-rain", name: "Steady Rain") }

    override func buildAudioGraph(engine: AVAudioEngine, output: AVAudioMixerNode) {
        let buffer = createNoiseBuffer(engine: engine)

        gainNode = createGainNode(engine: engine, volume: 0.15, output: output)
        eq = createEQ(engine: engine, type: .bandPass, frequency: 600, bandwidth: 3.0, output: gainNode!)
        player = createLoopingPlayer(engine: engine, buffer: buffer, output: eq!)
    }

    override func startAudioGraph() {
        guard let player, let buffer = createNoiseBufferCached() else { return }
        startLooping(player: player, buffer: buffer)
        scheduleTimer(interval: 0.15) { [weak self] in
            let intensity: Float = 0.1 + Float.random(in: 0...0.15)
            self?.gainNode?.outputVolume = intensity
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

    private var _cachedBuffer: AVAudioPCMBuffer?
    private func createNoiseBufferCached() -> AVAudioPCMBuffer? {
        if _cachedBuffer == nil, let engine { _cachedBuffer = createNoiseBuffer(engine: engine) }
        return _cachedBuffer
    }
}
