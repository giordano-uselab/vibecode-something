import AVFoundation

/// Amsterdam Canal — water lapping, light rain, bicycle bells, boats, seagulls.
final class AmsterdamCanalGenerator: BaseSoundGenerator {
    private var waterPlayer: AVAudioPlayerNode?
    private var waterEq: AVAudioUnitEQ?
    private var waterGain: AVAudioMixerNode?
    private var rainPlayer: AVAudioPlayerNode?
    private var rainEq: AVAudioUnitEQ?
    private var rainGain: AVAudioMixerNode?
    private var chatterPlayer: AVAudioPlayerNode?
    private var chatterEq: AVAudioUnitEQ?
    private var chatterGain: AVAudioMixerNode?

    init() { super.init(id: "amsterdam-canal", name: "Amsterdam Canal") }

    override func buildAudioGraph(engine: AVAudioEngine, output: AVAudioMixerNode) {
        let noise = createNoiseBuffer(engine: engine)
        let pink = createPinkNoiseBuffer(engine: engine)

        // Canal water — bandpass 800Hz
        waterGain = createGainNode(engine: engine, volume: 0.06, output: output)
        waterEq = createEQ(engine: engine, type: .bandPass, frequency: 800, bandwidth: 2.0, output: waterGain!)
        waterPlayer = createLoopingPlayer(engine: engine, buffer: noise, output: waterEq!)

        // Light rain — highpass 5000Hz
        rainGain = createGainNode(engine: engine, volume: 0.025, output: output)
        rainEq = createEQ(engine: engine, type: .highPass, frequency: 5000, output: rainGain!)
        rainPlayer = createLoopingPlayer(engine: engine, buffer: noise, output: rainEq!)

        // Tourist chatter — bandpass 500Hz
        chatterGain = createGainNode(engine: engine, volume: 0.03, output: output)
        chatterEq = createEQ(engine: engine, type: .bandPass, frequency: 500, bandwidth: 0.67, output: chatterGain!)
        chatterPlayer = createLoopingPlayer(engine: engine, buffer: pink, output: chatterEq!)

        setupOneshotPool(engine: engine, output: output, size: 6)
    }

    override func startAudioGraph() {
        guard let engine else { return }
        let noise = createNoiseBuffer(engine: engine)
        let pink = createPinkNoiseBuffer(engine: engine)
        if let wp = waterPlayer { startLooping(player: wp, buffer: noise) }
        if let rp = rainPlayer { startLooping(player: rp, buffer: noise) }
        if let cp = chatterPlayer { startLooping(player: cp, buffer: pink) }

        // Water lapping LFO
        scheduleTimer(interval: 0.15) { [weak self] in
            guard let self else { return }
            let t = Date().timeIntervalSince1970
            let mod = Float(sin(t * 0.3 * 2 * .pi)) * 0.03 + 0.06
            self.waterGain?.outputVolume = mod
        }

        scheduleBicycleBells()
        scheduleBoatEngine()
        scheduleSeagulls()
        scheduleCarillon()
    }

    private func scheduleBicycleBells() {
        let interval = 4.0 + Double.random(in: 0...6)
        scheduleTimer(interval: interval) { [weak self] in
            guard let self, Float.random(in: 0...1) < 0.5 else { return }
            let sr = self.sampleRate
            let freq = 2800 + Float.random(in: 0...400)
            let rings = Int.random(in: 1...2)
            for i in 0..<rings {
                let bell = self.createSineBurst(sampleRate: sr, frequency: freq, duration: 0.3, decay: 8)
                self.scheduleDelayed(delay: Double(i) * 0.15) { [weak self] in
                    self?.playOneShot(buffer: bell, volume: 0.025)
                }
            }
        }
    }

    private func scheduleBoatEngine() {
        let interval = 15.0 + Double.random(in: 0...15)
        scheduleTimer(interval: interval) { [weak self] in
            guard let self else { return }
            let sr = self.sampleRate
            let dur = 5.0 + Double.random(in: 0...5)
            let engine = self.createNoiseBurst(sampleRate: sr, duration: dur) { t in
                let fadeIn = min(t * 0.67, 1.0) // 1.5s fade in
                let fadeOut: Float = t > 0.7 ? max(0, (1 - t) / 0.3) : 1.0
                return fadeIn * fadeOut
            }
            self.playOneShot(buffer: engine, volume: 0.06)
        }
    }

    private func scheduleSeagulls() {
        let interval = 6.0 + Double.random(in: 0...9)
        scheduleTimer(interval: interval) { [weak self] in
            guard let self, Float.random(in: 0...1) < 0.6 else { return }
            let sr = self.sampleRate
            let freq = 1500 + Float.random(in: 0...500)
            // Swept cry
            let format = AVAudioFormat(standardFormatWithSampleRate: sr, channels: 1)!
            let dur = 0.8
            let frameCount = AVAudioFrameCount(sr * dur)
            let buffer = AVAudioPCMBuffer(pcmFormat: format, frameCapacity: frameCount)!
            buffer.frameLength = frameCount
            let data = buffer.floatChannelData![0]
            for i in 0..<Int(frameCount) {
                let t = Float(i) / Float(sr)
                let tNorm = t / Float(dur)
                let sweep = freq * (1.6 - 0.8 * tNorm + 0.5 * sin(tNorm * Float.pi * 2))
                let envelope = sin(tNorm * Float.pi) // bell shape
                data[i] = sin(2 * Float.pi * sweep * t) * envelope
            }
            self.playOneShot(buffer: buffer, volume: 0.02)
        }
    }

    private func scheduleCarillon() {
        let interval = 30.0 + Double.random(in: 0...30)
        scheduleTimer(interval: interval) { [weak self] in
            guard let self else { return }
            let sr = self.sampleRate
            let scale: [Float] = [523, 587, 659, 698, 784, 880] // C5-A5
            let noteCount = Int.random(in: 3...5)
            for i in 0..<noteCount {
                let freq = scale.randomElement()!
                let note = self.createSineBurst(sampleRate: sr, frequency: freq, duration: 2, decay: 2)
                self.scheduleDelayed(delay: Double(i) * 0.4) { [weak self] in
                    self?.playOneShot(buffer: note, volume: 0.02)
                }
            }
        }
    }

    override func stopAudioGraph() {
        waterPlayer?.stop()
        rainPlayer?.stop()
        chatterPlayer?.stop()
    }

    override func teardownAudioGraph() {
        teardownOneshotPool()
        for n in [waterPlayer, rainPlayer, chatterPlayer] as [AVAudioPlayerNode?] { if let n { engine?.detach(n) } }
        for n in [waterEq, rainEq, chatterEq] as [AVAudioUnitEQ?] { if let n { engine?.detach(n) } }
        for n in [waterGain, rainGain, chatterGain] as [AVAudioMixerNode?] { if let n { engine?.detach(n) } }
        waterPlayer = nil; waterEq = nil; waterGain = nil
        rainPlayer = nil; rainEq = nil; rainGain = nil
        chatterPlayer = nil; chatterEq = nil; chatterGain = nil
    }
}
