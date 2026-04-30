import AVFoundation

/// Dark Drones — dissonant drones with eerie stingers.
final class HorrorMusicGenerator: BaseSoundGenerator {
    private var dronePlayers: [AVAudioPlayerNode] = []
    private var droneGains: [AVAudioMixerNode] = []
    private var rumblePlayer: AVAudioPlayerNode?
    private var rumbleEq: AVAudioUnitEQ?
    private var rumbleGain: AVAudioMixerNode?

    init() { super.init(id: "horror-music", name: "Dark Drones") }

    override func buildAudioGraph(engine: AVAudioEngine, output: AVAudioMixerNode) {
        let sr = engine.outputNode.outputFormat(forBus: 0).sampleRate

        // 6 drone oscillators with dissonant intervals
        let drones: [(freq: Float, vol: Float)] = [
            (40, 0.12),     // Deep bass
            (82, 0.06),     // Root E2
            (116, 0.05),    // Tritone Bb2
            (87, 0.04),     // Minor 2nd
            (164, 0.03),    // Beating pair A
            (165.5, 0.03),  // Beating pair B (1.5Hz beat)
        ]

        for drone in drones {
            let buf = createSineBuffer(sampleRate: sr, frequency: drone.freq)
            let gain = createGainNode(engine: engine, volume: drone.vol, output: output)
            let player = createLoopingPlayer(engine: engine, buffer: buf, output: gain)
            dronePlayers.append(player)
            droneGains.append(gain)
        }

        // Rumble layer
        let noise = createNoiseBuffer(engine: engine, duration: 3)
        rumbleGain = createGainNode(engine: engine, volume: 0.04, output: output)
        rumbleEq = createEQ(engine: engine, type: .lowPass, frequency: 80, bandwidth: 1.0, output: rumbleGain!)
        rumblePlayer = createLoopingPlayer(engine: engine, buffer: noise, output: rumbleEq!)

        // Stinger pool
        setupOneshotPool(engine: engine, output: output, size: 4)
    }

    override func startAudioGraph() {
        guard let engine else { return }
        let sr = engine.outputNode.outputFormat(forBus: 0).sampleRate
        let noise = createNoiseBuffer(engine: engine, duration: 3)

        let droneFreqs: [Float] = [40, 82, 116, 87, 164, 165.5]
        for (i, player) in dronePlayers.enumerated() {
            let buf = createSineBuffer(sampleRate: sr, frequency: droneFreqs[i])
            startLooping(player: player, buffer: buf)
        }

        if let rp = rumblePlayer { startLooping(player: rp, buffer: noise) }

        // Drone volume drift
        scheduleTimer(interval: 3.0 + Double.random(in: 0...5)) { [weak self] in
            guard let self else { return }
            let baseVols: [Float] = [0.12, 0.06, 0.05, 0.04, 0.03, 0.03]
            for (i, gain) in self.droneGains.enumerated() {
                gain.outputVolume = baseVols[i] * (0.5 + Float.random(in: 0...1))
            }
        }

        scheduleStinger()
    }

    private func scheduleStinger() {
        guard isPlaying else { return }
        let delay = 4.0 + Double.random(in: 0...8) // 4-12s
        scheduleDelayed(delay: delay) { [weak self] in
            guard let self, self.isPlaying else { return }
            let sr = self.sampleRate
            let stingerFreqs: [Float] = [659, 740, 988, 1047, 1175, 1397]
            let freq = stingerFreqs.randomElement()! + Float.random(in: -5...5)
            let dur = 2.0 + Double.random(in: 0...5)
            let vol: Float = 0.015 + Float.random(in: 0...0.015)

            // Sine tone with vibrato and envelope
            let format = AVAudioFormat(standardFormatWithSampleRate: sr, channels: 1)!
            let frameCount = AVAudioFrameCount(sr * dur)
            let buffer = AVAudioPCMBuffer(pcmFormat: format, frameCapacity: frameCount)!
            buffer.frameLength = frameCount
            let data = buffer.floatChannelData![0]

            let vibratoRate = 4 + Float.random(in: 0...3)
            let vibratoDepth = freq * 0.008

            for i in 0..<Int(frameCount) {
                let t = Float(i) / Float(sr)
                let tNorm = t / Float(dur)
                // Fade in first 30%, fade out last 30%
                let fadeIn: Float = min(tNorm / 0.3, 1)
                let fadeOut: Float = min((1 - tNorm) / 0.3, 1)
                let envelope = fadeIn * fadeOut
                let vibrato = sin(2 * Float.pi * vibratoRate * t) * vibratoDepth
                data[i] = sin(2 * Float.pi * (freq + vibrato) * t) * envelope
            }

            self.playOneShot(buffer: buffer, volume: vol)
            self.scheduleStinger()
        }
    }

    override func stopAudioGraph() {
        for p in dronePlayers { p.stop() }
        rumblePlayer?.stop()
    }

    override func teardownAudioGraph() {
        teardownOneshotPool()
        for p in dronePlayers { engine?.detach(p) }
        for g in droneGains { engine?.detach(g) }
        if let rp = rumblePlayer { engine?.detach(rp) }
        if let re = rumbleEq { engine?.detach(re) }
        if let rg = rumbleGain { engine?.detach(rg) }
        dronePlayers.removeAll(); droneGains.removeAll()
        rumblePlayer = nil; rumbleEq = nil; rumbleGain = nil
    }
}
