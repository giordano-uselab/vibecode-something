import AVFoundation

/// Heavy Downpour — dense multi-layer rain with thunder and lightning.
final class HeavyDownpourGenerator: BaseSoundGenerator {
    private var players: [AVAudioPlayerNode] = []
    private var eqs: [AVAudioUnitEQ] = []
    private var gains: [AVAudioMixerNode] = []
    private var thunderGain: AVAudioMixerNode?
    private var mainGain: AVAudioMixerNode?

    init() { super.init(id: "heavy-downpour", name: "Heavy Downpour") }

    override func buildAudioGraph(engine: AVAudioEngine, output: AVAudioMixerNode) {
        let noise = createNoiseBuffer(engine: engine)
        mainGain = createGainNode(engine: engine, volume: 1.0, output: output)

        // Layer 1: Deep drops — bandpass 250Hz
        let g1 = createGainNode(engine: engine, volume: 0.025, output: mainGain!)
        let eq1 = createEQ(engine: engine, type: .bandPass, frequency: 250, bandwidth: 3.0, output: g1)
        let p1 = createLoopingPlayer(engine: engine, buffer: noise, output: eq1)
        players.append(p1); eqs.append(eq1); gains.append(g1)

        // Layer 2: Mid rain body — bandpass 500Hz
        let g2 = createGainNode(engine: engine, volume: 0.02, output: mainGain!)
        let eq2 = createEQ(engine: engine, type: .bandPass, frequency: 500, bandwidth: 4.0, output: g2)
        let p2 = createLoopingPlayer(engine: engine, buffer: noise, output: eq2)
        players.append(p2); eqs.append(eq2); gains.append(g2)

        // Layer 3: High shimmer — highpass 3000Hz
        let g3 = createGainNode(engine: engine, volume: 0.005, output: mainGain!)
        let eq3 = createEQ(engine: engine, type: .highPass, frequency: 3000, output: g3)
        let p3 = createLoopingPlayer(engine: engine, buffer: noise, output: eq3)
        players.append(p3); eqs.append(eq3); gains.append(g3)

        // Layer 4: Low rumble — lowpass 150Hz
        let g4 = createGainNode(engine: engine, volume: 0.04, output: mainGain!)
        let eq4 = createEQ(engine: engine, type: .lowPass, frequency: 150, output: g4)
        let p4 = createLoopingPlayer(engine: engine, buffer: noise, output: eq4)
        players.append(p4); eqs.append(eq4); gains.append(g4)

        // Thunder bed — lowpass 120Hz, starts silent
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
        let isSilent = Float.random(in: 0...1) < 0.4
        if isSilent {
            thunderGain?.outputVolume = 0
            let pause = 5.0 + Double.random(in: 0...10)
            scheduleDelayed(delay: pause) { [weak self] in
                self?.scheduleThunderCycle()
            }
        } else {
            let vol: Float = 0.15 + Float.random(in: 0...0.1)
            let fadeIn = 1.5 + Double.random(in: 0...2)
            let hold = 3.0 + Double.random(in: 0...6)
            let fadeOut = 2.0 + Double.random(in: 0...3)

            // Fade in
            thunderGain?.outputVolume = 0
            scheduleDelayed(delay: 0.1) { [weak self] in
                self?.thunderGain?.outputVolume = vol
            }
            // Fade out after hold
            scheduleDelayed(delay: fadeIn + hold) { [weak self] in
                self?.thunderGain?.outputVolume = 0
            }
            scheduleDelayed(delay: fadeIn + hold + fadeOut) { [weak self] in
                self?.scheduleThunderCycle()
            }
        }
    }

    private func scheduleDrips() {
        guard isPlaying else { return }
        let delay = Double(40 + Float.random(in: 0...160)) / 1000
        scheduleDelayed(delay: delay) { [weak self] in
            guard let self, self.isPlaying else { return }
            let sr = self.sampleRate
            let burst = self.createNoiseBurst(sampleRate: sr, duration: 0.06)
            let vol: Float = 0.015 + Float.random(in: 0...0.02)
            self.playOneShot(buffer: burst, volume: vol)
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
        if let mg = mainGain { engine?.detach(mg) }
        players.removeAll(); eqs.removeAll(); gains.removeAll()
        thunderGain = nil; mainGain = nil
    }
}
