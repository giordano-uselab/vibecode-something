import AVFoundation

/// Forest Wind — wind through trees with rustling leaves.
final class ForestWindGenerator: BaseSoundGenerator {
    private var windPlayer: AVAudioPlayerNode?
    private var windEq: AVAudioUnitEQ?
    private var windGain: AVAudioMixerNode?
    private var leafPlayer: AVAudioPlayerNode?
    private var leafEq: AVAudioUnitEQ?
    private var leafGain: AVAudioMixerNode?

    init() { super.init(id: "forest-wind", name: "Forest Wind") }

    override func buildAudioGraph(engine: AVAudioEngine, output: AVAudioMixerNode) {
        let noise = createNoiseBuffer(engine: engine)

        // Wind body — lowpass 350Hz
        windGain = createGainNode(engine: engine, volume: 0.10, output: output)
        windEq = createEQ(engine: engine, type: .lowPass, frequency: 350, bandwidth: 3.0, output: windGain!)
        windPlayer = createLoopingPlayer(engine: engine, buffer: noise, output: windEq!)

        // Leaf rustle — bandpass 6000Hz
        leafGain = createGainNode(engine: engine, volume: 0.015, output: output)
        leafEq = createEQ(engine: engine, type: .bandPass, frequency: 6000, bandwidth: 3.0, output: leafGain!)
        leafPlayer = createLoopingPlayer(engine: engine, buffer: noise, output: leafEq!)
    }

    override func startAudioGraph() {
        guard let engine else { return }
        let noise = createNoiseBuffer(engine: engine)
        if let wp = windPlayer { startLooping(player: wp, buffer: noise) }
        if let lp = leafPlayer { startLooping(player: lp, buffer: noise) }

        // Slow wind modulation
        scheduleTimer(interval: 0.2) { [weak self] in
            guard let self else { return }
            let t = Date().timeIntervalSince1970
            let windMod = Float(sin(t * 0.06 * 2 * .pi)) * 0.04 + 0.10
            self.windGain?.outputVolume = windMod
            let leafMod = Float(sin(t * 0.25 * 2 * .pi)) * 0.012 + 0.015
            self.leafGain?.outputVolume = leafMod
        }
    }

    override func stopAudioGraph() {
        windPlayer?.stop()
        leafPlayer?.stop()
    }

    override func teardownAudioGraph() {
        for node in [windPlayer, leafPlayer] as [AVAudioPlayerNode?] {
            if let n = node { engine?.detach(n) }
        }
        for node in [windEq, leafEq] as [AVAudioUnitEQ?] {
            if let n = node { engine?.detach(n) }
        }
        for node in [windGain, leafGain] as [AVAudioMixerNode?] {
            if let n = node { engine?.detach(n) }
        }
        windPlayer = nil; windEq = nil; windGain = nil
        leafPlayer = nil; leafEq = nil; leafGain = nil
    }
}
