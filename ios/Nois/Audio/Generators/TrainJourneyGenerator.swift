import AVFoundation

/// Train Journey — rhythmic rail rumble with sway and bridge crossings.
final class TrainJourneyGenerator: BaseSoundGenerator {
    private var players: [AVAudioPlayerNode] = []
    private var eqs: [AVAudioUnitEQ] = []
    private var gains: [AVAudioMixerNode] = []
    private var mainGain: AVAudioMixerNode?
    private var mainEq: AVAudioUnitEQ?
    private var swayGain: AVAudioMixerNode?

    init() { super.init(id: "train-journey", name: "Train Journey") }

    override func buildAudioGraph(engine: AVAudioEngine, output: AVAudioMixerNode) {
        let noise = createNoiseBuffer(engine: engine)
        let noise2 = createNoiseBuffer(engine: engine, duration: 4)

        // Main source — lowpass 220Hz
        mainGain = createGainNode(engine: engine, volume: 1.0, output: output)
        mainEq = createEQ(engine: engine, type: .lowPass, frequency: 220, bandwidth: 3.0, output: mainGain!)
        let mainPlayer = createLoopingPlayer(engine: engine, buffer: noise, output: mainEq!)
        players.append(mainPlayer)

        // Sub-bass — lowpass 60Hz
        let subGain = createGainNode(engine: engine, volume: 0.08, output: output)
        let subEq = createEQ(engine: engine, type: .lowPass, frequency: 60, output: subGain)
        let subPlayer = createLoopingPlayer(engine: engine, buffer: noise, output: subEq)
        players.append(subPlayer); eqs.append(subEq); gains.append(subGain)

        // Low rumble — bandpass 110Hz
        let lowGain = createGainNode(engine: engine, volume: 0.10, output: output)
        let lowEq = createEQ(engine: engine, type: .bandPass, frequency: 110, bandwidth: 0.4, output: lowGain)
        let lowPlayer = createLoopingPlayer(engine: engine, buffer: noise, output: lowEq)
        players.append(lowPlayer); eqs.append(lowEq); gains.append(lowGain)

        // Mid rumble — bandpass 175Hz
        let midGain = createGainNode(engine: engine, volume: 0.04, output: output)
        let midEq = createEQ(engine: engine, type: .bandPass, frequency: 175, bandwidth: 1.11, output: midGain)
        let midPlayer = createLoopingPlayer(engine: engine, buffer: noise, output: midEq)
        players.append(midPlayer); eqs.append(midEq); gains.append(midGain)

        // Sway component — bandpass 130Hz
        swayGain = createGainNode(engine: engine, volume: 0.03, output: output)
        let swayEq = createEQ(engine: engine, type: .bandPass, frequency: 130, bandwidth: 1.0, output: swayGain!)
        let swayPlayer = createLoopingPlayer(engine: engine, buffer: noise, output: swayEq)
        players.append(swayPlayer); eqs.append(swayEq)

        // Ambient resonances — thin bandpass layers
        let res1Gain = createGainNode(engine: engine, volume: 0.008, output: output)
        let res1Eq = createEQ(engine: engine, type: .bandPass, frequency: 220 + Float.random(in: 0...40), bandwidth: 0.25, output: res1Gain)
        let res1Player = createLoopingPlayer(engine: engine, buffer: noise2, output: res1Eq)
        players.append(res1Player); eqs.append(res1Eq); gains.append(res1Gain)

        let res2Gain = createGainNode(engine: engine, volume: 0.004, output: output)
        let res2Eq = createEQ(engine: engine, type: .bandPass, frequency: 350 + Float.random(in: 0...50), bandwidth: 0.286, output: res2Gain)
        let res2Player = createLoopingPlayer(engine: engine, buffer: noise2, output: res2Eq)
        players.append(res2Player); eqs.append(res2Eq); gains.append(res2Gain)
    }

    override func startAudioGraph() {
        guard let engine else { return }
        let noise = createNoiseBuffer(engine: engine)
        let noise2 = createNoiseBuffer(engine: engine, duration: 4)
        for (i, p) in players.enumerated() {
            startLooping(player: p, buffer: i >= 5 ? noise2 : noise)
        }

        // Sway modulation
        scheduleTimer(interval: 0.15) { [weak self] in
            guard let self else { return }
            let t = Date().timeIntervalSince1970
            let sway = Float(sin(t * 0.06 * 2 * .pi)) * 0.008 + 0.03
            self.swayGain?.outputVolume = sway
        }

        scheduleBridgeCrossing()
    }

    private func scheduleBridgeCrossing() {
        guard isPlaying else { return }
        let delay = 20.0 + Double.random(in: 0...10) // 20-30s
        scheduleDelayed(delay: delay) { [weak self] in
            guard let self, self.isPlaying else { return }
            let dur = 6.0 + Double.random(in: 0...5) // 6-11s

            // Open up the filter and boost gain
            self.mainGain?.outputVolume = 1.15
            self.mainEq?.bands[0].frequency = 380

            // Return to normal after bridge
            self.scheduleDelayed(delay: dur) { [weak self] in
                self?.mainGain?.outputVolume = 1.0
                self?.mainEq?.bands[0].frequency = 220
            }

            self.scheduleDelayed(delay: dur + 5) { [weak self] in
                self?.scheduleBridgeCrossing()
            }
        }
    }

    override func stopAudioGraph() {
        for p in players { p.stop() }
    }

    override func teardownAudioGraph() {
        for p in players { engine?.detach(p) }
        for e in eqs { engine?.detach(e) }
        for g in gains { engine?.detach(g) }
        if let mg = mainGain { engine?.detach(mg) }
        if let me = mainEq { engine?.detach(me) }
        if let sg = swayGain { engine?.detach(sg) }
        players.removeAll(); eqs.removeAll(); gains.removeAll()
        mainGain = nil; mainEq = nil; swayGain = nil
    }
}
