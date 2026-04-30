import AVFoundation

/// Ancient Kyoto — bamboo wind, monks, temple gong, water drips, crickets.
final class AncientKyotoGenerator: BaseSoundGenerator {
    private var bambooPlayer: AVAudioPlayerNode?
    private var bambooEq: AVAudioUnitEQ?
    private var bambooGain: AVAudioMixerNode?
    private var monkPlayer: AVAudioPlayerNode?
    private var monkEq: AVAudioUnitEQ?
    private var monkGain: AVAudioMixerNode?

    init() { super.init(id: "ancient-kyoto", name: "Ancient Kyoto") }

    override func buildAudioGraph(engine: AVAudioEngine, output: AVAudioMixerNode) {
        let noise = createNoiseBuffer(engine: engine)
        let pink = createPinkNoiseBuffer(engine: engine)

        // Bamboo wind — bandpass 800Hz
        bambooGain = createGainNode(engine: engine, volume: 0.06, output: output)
        bambooEq = createEQ(engine: engine, type: .bandPass, frequency: 800, bandwidth: 0.5, output: bambooGain!)
        bambooPlayer = createLoopingPlayer(engine: engine, buffer: noise, output: bambooEq!)

        // Monks murmur — bandpass 250Hz
        monkGain = createGainNode(engine: engine, volume: 0.025, output: output)
        monkEq = createEQ(engine: engine, type: .bandPass, frequency: 250, bandwidth: 0.5, output: monkGain!)
        monkPlayer = createLoopingPlayer(engine: engine, buffer: pink, output: monkEq!)

        setupOneshotPool(engine: engine, output: output, size: 6)
    }

    override func startAudioGraph() {
        guard let engine else { return }
        let noise = createNoiseBuffer(engine: engine)
        let pink = createPinkNoiseBuffer(engine: engine)
        if let bp = bambooPlayer { startLooping(player: bp, buffer: noise) }
        if let mp = monkPlayer { startLooping(player: mp, buffer: pink) }

        // Bamboo wind LFO
        scheduleTimer(interval: 0.2) { [weak self] in
            guard let self else { return }
            let t = Date().timeIntervalSince1970
            let mod = Float(sin(t * 0.08 * 2 * .pi)) * 0.02 + 0.06
            self.bambooGain?.outputVolume = mod
        }

        scheduleTempleGong()
        scheduleWaterDrip()
        scheduleCrickets()
        scheduleSwordClash()
    }

    private func scheduleTempleGong() {
        let interval = 15.0 + Double.random(in: 0...15)
        scheduleTimer(interval: interval) { [weak self] in
            guard let self else { return }
            let sr = self.sampleRate
            let fundamental = 80 + Float.random(in: 0...30)
            let partials: [(Float, Float)] = [(1, 0.05), (2.3, 0.03), (4.1, 0.015), (6.5, 0.008)]
            let decay = 10.0 + Double.random(in: 0...5)
            for (ratio, amp) in partials {
                let buf = self.createSineBurst(sampleRate: sr, frequency: fundamental * ratio, duration: decay, decay: Float(1.0 / decay) * 2)
                self.playOneShot(buffer: buf, volume: amp)
            }
        }
    }

    private func scheduleWaterDrip() {
        let interval = 3.0 + Double.random(in: 0...5)
        scheduleTimer(interval: interval) { [weak self] in
            guard let self else { return }
            let sr = self.sampleRate
            let freq = 1800 + Float.random(in: 0...600)
            let drip = self.createSineBurst(sampleRate: sr, frequency: freq, duration: 0.3, decay: 10)
            self.playOneShot(buffer: drip, volume: 0.03)
        }
    }

    private func scheduleCrickets() {
        // Continuous cricket — 5500Hz AM chirp
        scheduleTimer(interval: 0.5) { [weak self] in
            guard let self else { return }
            let sr = self.sampleRate
            let chirp = self.createSineBurst(sampleRate: sr, frequency: 5500, duration: 0.04, decay: 30)
            self.playOneShot(buffer: chirp, volume: 0.006)
        }
    }

    private func scheduleSwordClash() {
        let interval = 5.0 + Double.random(in: 0...7)
        scheduleTimer(interval: interval) { [weak self] in
            guard let self, Float.random(in: 0...1) < 0.4 else { return }
            let sr = self.sampleRate
            let freq = 3000 + Float.random(in: 0...2000)
            let clash = self.createNoiseBurst(sampleRate: sr, duration: 0.08) { t in expf(-t * 20) }
            self.playOneShot(buffer: clash, volume: 0.03)

            // 50% double-strike
            if Float.random(in: 0...1) < 0.5 {
                self.scheduleDelayed(delay: 0.12) { [weak self] in
                    guard let self else { return }
                    let clash2 = self.createNoiseBurst(sampleRate: sr, duration: 0.08) { t in expf(-t * 20) }
                    self.playOneShot(buffer: clash2, volume: 0.02)
                }
            }
        }
    }

    override func stopAudioGraph() {
        bambooPlayer?.stop()
        monkPlayer?.stop()
    }

    override func teardownAudioGraph() {
        teardownOneshotPool()
        for n in [bambooPlayer, monkPlayer] as [AVAudioPlayerNode?] { if let n { engine?.detach(n) } }
        for n in [bambooEq, monkEq] as [AVAudioUnitEQ?] { if let n { engine?.detach(n) } }
        for n in [bambooGain, monkGain] as [AVAudioMixerNode?] { if let n { engine?.detach(n) } }
        bambooPlayer = nil; bambooEq = nil; bambooGain = nil
        monkPlayer = nil; monkEq = nil; monkGain = nil
    }
}
