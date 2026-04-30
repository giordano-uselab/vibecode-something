import AVFoundation

/// Thunderstorm — intense rain with frequent lightning and heavy thunder.
/// Same architecture as HeavyDownpour with cranked-up values.
final class ThunderstormGenerator: BaseSoundGenerator {
    private var players: [AVAudioPlayerNode] = []
    private var eqs: [AVAudioUnitEQ] = []
    private var gains: [AVAudioMixerNode] = []
    private var thunderGain: AVAudioMixerNode?

    init() { super.init(id: "thunderstorm", name: "Thunderstorm") }

    override func buildAudioGraph(engine: AVAudioEngine, output: AVAudioMixerNode) {
        let noise = createNoiseBuffer(engine: engine)

        // Layer 1: Deep drops — bandpass 250Hz (louder than downpour)
        let g1 = createGainNode(engine: engine, volume: 0.035, output: output)
        let eq1 = createEQ(engine: engine, type: .bandPass, frequency: 250, bandwidth: 3.0, output: g1)
        let p1 = createLoopingPlayer(engine: engine, buffer: noise, output: eq1)
        players.append(p1); eqs.append(eq1); gains.append(g1)

        // Layer 2: Mid body — bandpass 500Hz
        let g2 = createGainNode(engine: engine, volume: 0.03, output: output)
        let eq2 = createEQ(engine: engine, type: .bandPass, frequency: 500, bandwidth: 4.0, output: g2)
        let p2 = createLoopingPlayer(engine: engine, buffer: noise, output: eq2)
        players.append(p2); eqs.append(eq2); gains.append(g2)

        // Layer 3: High shimmer — highpass 3000Hz
        let g3 = createGainNode(engine: engine, volume: 0.006, output: output)
        let eq3 = createEQ(engine: engine, type: .highPass, frequency: 3000, output: g3)
        let p3 = createLoopingPlayer(engine: engine, buffer: noise, output: eq3)
        players.append(p3); eqs.append(eq3); gains.append(g3)

        // Layer 4: Low rumble — lowpass 150Hz
        let g4 = createGainNode(engine: engine, volume: 0.06, output: output)
        let eq4 = createEQ(engine: engine, type: .lowPass, frequency: 150, output: g4)
        let p4 = createLoopingPlayer(engine: engine, buffer: noise, output: eq4)
        players.append(p4); eqs.append(eq4); gains.append(g4)

        // Thunder bed — louder, less silence
        thunderGain = createGainNode(engine: engine, volume: 0.0, output: output)
        let thunderEq = createEQ(engine: engine, type: .lowPass, frequency: 120, output: thunderGain!)
        let thunderNoise = createBrownNoiseBuffer(engine: engine)
        let thunderPlayer = createLoopingPlayer(engine: engine, buffer: thunderNoise, output: thunderEq)
        players.append(thunderPlayer); eqs.append(thunderEq)

        setupOneshotPool(engine: engine, output: output)
    }

    override func startAudioGraph() {
        guard let engine else { return }
        let noise = createNoiseBuffer(engine: engine)
        let brown = createBrownNoiseBuffer(engine: engine)
        for (i, p) in players.enumerated() {
            startLooping(player: p, buffer: i < 4 ? noise : brown)
        }
        scheduleThunderCycle()
        scheduleDrips()
    }

    private func scheduleThunderCycle() {
        guard isPlaying else { return }
        // Only 20% silence (vs 40% in downpour)
        let isSilent = Float.random(in: 0...1) < 0.2
        if isSilent {
            thunderGain?.outputVolume = 0
            let pause = 3.0 + Double.random(in: 0...2)
            scheduleDelayed(delay: pause) { [weak self] in
                self?.scheduleThunderCycle()
            }
        } else {
            let vol: Float = 0.2 + Float.random(in: 0...0.15) // Louder
            thunderGain?.outputVolume = 0
            scheduleDelayed(delay: 0.1) { [weak self] in
                self?.thunderGain?.outputVolume = vol
            }
            let hold = 3.0 + Double.random(in: 0...6)
            scheduleDelayed(delay: hold) { [weak self] in
                self?.thunderGain?.outputVolume = 0
            }
            scheduleDelayed(delay: hold + 3.0) { [weak self] in
                self?.scheduleThunderCycle()
            }
        }
    }

    private func scheduleDrips() {
        guard isPlaying else { return }
        let delay = Double(25 + Float.random(in: 0...100)) / 1000 // Denser
        scheduleDelayed(delay: delay) { [weak self] in
            guard let self, self.isPlaying else { return }
            let sr = self.sampleRate
            let burst = self.createNoiseBurst(sampleRate: sr, duration: 0.05)
            self.playOneShot(buffer: burst, volume: 0.018 + Float.random(in: 0...0.025))
            self.scheduleDrips()
        }
    }

    override func stopAudioGraph() {
        for p in players { p.stop() }
    }

    override func teardownAudioGraph() {
        teardownOneshotPool()
        for p in players { engine?.detach(p) }
        for e in eqs { engine?.detach(e) }
        for g in gains { engine?.detach(g) }
        if let tg = thunderGain { engine?.detach(tg) }
        players.removeAll(); eqs.removeAll(); gains.removeAll()
        thunderGain = nil
    }
}
