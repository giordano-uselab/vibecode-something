import AVFoundation

/// Deep Space — low cosmic hum with drone oscillators.
final class DeepSpaceGenerator: BaseSoundGenerator {
    private var noisePlayer: AVAudioPlayerNode?
    private var noiseEq: AVAudioUnitEQ?
    private var noiseGain: AVAudioMixerNode?
    private var dronePlayers: [AVAudioPlayerNode] = []
    private var droneGains: [AVAudioMixerNode] = []

    init() { super.init(id: "deep-space", name: "Deep Space") }

    override func buildAudioGraph(engine: AVAudioEngine, output: AVAudioMixerNode) {
        let noise = createNoiseBuffer(engine: engine)
        let sr = engine.outputNode.outputFormat(forBus: 0).sampleRate

        // Filtered noise — lowpass 120Hz
        noiseGain = createGainNode(engine: engine, volume: 0.15, output: output)
        noiseEq = createEQ(engine: engine, type: .lowPass, frequency: 120, output: noiseGain!)
        noisePlayer = createLoopingPlayer(engine: engine, buffer: noise, output: noiseEq!)

        // Three drone oscillators: 40Hz, 60Hz, 80.5Hz
        let droneFreqs: [Float] = [40, 60, 80.5]
        for freq in droneFreqs {
            let sineBuffer = createSineBuffer(sampleRate: sr, frequency: freq)
            let gain = createGainNode(engine: engine, volume: 0.04, output: output)
            let player = createLoopingPlayer(engine: engine, buffer: sineBuffer, output: gain)
            dronePlayers.append(player)
            droneGains.append(gain)
        }
    }

    override func startAudioGraph() {
        guard let engine, let noisePlayer else { return }
        let noise = createNoiseBuffer(engine: engine)
        let sr = engine.outputNode.outputFormat(forBus: 0).sampleRate
        startLooping(player: noisePlayer, buffer: noise)

        let droneFreqs: [Float] = [40, 60, 80.5]
        for (i, player) in dronePlayers.enumerated() {
            let buf = createSineBuffer(sampleRate: sr, frequency: droneFreqs[i])
            startLooping(player: player, buffer: buf)
        }

        // Slow LFO modulation on noise filter
        scheduleTimer(interval: 0.2) { [weak self] in
            guard let self else { return }
            let t = Date().timeIntervalSince1970
            let mod = Float(sin(t * 0.03 * 2 * .pi)) * 50 + 120
            self.noiseEq?.bands[0].frequency = mod
        }
    }

    override func stopAudioGraph() {
        noisePlayer?.stop()
        for p in dronePlayers { p.stop() }
    }

    override func teardownAudioGraph() {
        if let p = noisePlayer { engine?.detach(p) }
        if let e = noiseEq { engine?.detach(e) }
        if let g = noiseGain { engine?.detach(g) }
        for p in dronePlayers { engine?.detach(p) }
        for g in droneGains { engine?.detach(g) }
        noisePlayer = nil; noiseEq = nil; noiseGain = nil
        dronePlayers.removeAll(); droneGains.removeAll()
    }
}
