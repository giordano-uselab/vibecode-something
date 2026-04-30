import AVFoundation

/// Roman Piazza — fountain, crowd, church bells, horse hooves, pigeons.
final class RomanPiazzaGenerator: BaseSoundGenerator {
    private var players: [AVAudioPlayerNode] = []
    private var eqs: [AVAudioUnitEQ] = []
    private var gains: [AVAudioMixerNode] = []
    private var hoofBeat = 0

    init() { super.init(id: "roman-piazza", name: "Roman Piazza") }

    override func buildAudioGraph(engine: AVAudioEngine, output: AVAudioMixerNode) {
        let noise = createNoiseBuffer(engine: engine)
        let pink = createPinkNoiseBuffer(engine: engine)

        // Fountain — bandpass 3500Hz
        let ftnGain = createGainNode(engine: engine, volume: 0.08, output: output)
        let ftnEq = createEQ(engine: engine, type: .bandPass, frequency: 3500, bandwidth: 2.5, output: ftnGain)
        let ftnPlayer = createLoopingPlayer(engine: engine, buffer: noise, output: ftnEq)
        players.append(ftnPlayer); eqs.append(ftnEq); gains.append(ftnGain)

        // Crowd chatter — 3 bandpass layers on pink noise
        for (freq, bw, vol) in [(300, 0.67, 0.05), (700, 0.83, 0.04), (1400, 1.0, 0.025)] as [(Float, Float, Float)] {
            let g = createGainNode(engine: engine, volume: vol, output: output)
            let eq = createEQ(engine: engine, type: .bandPass, frequency: freq, bandwidth: bw, output: g)
            let p = createLoopingPlayer(engine: engine, buffer: pink, output: eq)
            players.append(p); eqs.append(eq); gains.append(g)
        }

        // Cart rumble — lowpass 100Hz
        let cartGain = createGainNode(engine: engine, volume: 0.04, output: output)
        let cartEq = createEQ(engine: engine, type: .lowPass, frequency: 100, output: cartGain)
        let cartPlayer = createLoopingPlayer(engine: engine, buffer: noise, output: cartEq)
        players.append(cartPlayer); eqs.append(cartEq); gains.append(cartGain)

        setupOneshotPool(engine: engine, output: output, size: 6)
    }

    override func startAudioGraph() {
        guard let engine else { return }
        let noise = createNoiseBuffer(engine: engine)
        let pink = createPinkNoiseBuffer(engine: engine)
        for (i, p) in players.enumerated() {
            startLooping(player: p, buffer: i == 0 || i == 4 ? noise : pink)
        }
        scheduleChurchBells()
        scheduleHooves()
        schedulePigeonCoo()
    }

    private func scheduleChurchBells() {
        let interval = 10.0 + Double.random(in: 0...10) // 10-20s
        scheduleTimer(interval: interval) { [weak self] in
            guard let self else { return }
            let sr = self.sampleRate
            let fundamental = 440 + Float.random(in: 0...200)
            let partials: [Float] = [1, 2, 3, 4.2, 5.8]
            for partial in partials {
                let freq = fundamental * partial
                let vol = 0.025 / partial
                let bell = self.createSineBurst(sampleRate: sr, frequency: freq, duration: 5, decay: 1)
                self.playOneShot(buffer: bell, volume: vol)
            }
        }
    }

    private func scheduleHooves() {
        let emphasis: [Float] = [1.0, 0.5, 0.8, 0.4]
        scheduleTimer(interval: 0.525) { [weak self] in
            guard let self else { return }
            let sr = self.sampleRate
            let em = emphasis[self.hoofBeat % 4]
            self.hoofBeat += 1
            let hoof = self.createNoiseBurst(sampleRate: sr, duration: 0.08) { t in expf(-t * 15) }
            self.playOneShot(buffer: hoof, volume: 0.012 * em)
        }
    }

    private func schedulePigeonCoo() {
        let interval = 3.0 + Double.random(in: 0...5) // 3-8s
        scheduleTimer(interval: interval) { [weak self] in
            guard let self, Float.random(in: 0...1) < 0.7 else { return }
            let sr = self.sampleRate
            let coo = self.createSineBurst(sampleRate: sr, frequency: 340, duration: 0.5, decay: 3)
            self.playOneShot(buffer: coo, volume: 0.015)
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
        players.removeAll(); eqs.removeAll(); gains.removeAll()
    }
}
