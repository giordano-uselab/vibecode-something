import AVFoundation

/// Coffee Shop — warm noise bed with ceramic clinks and espresso hiss.
final class CoffeeShopGenerator: BaseSoundGenerator {
    private var lowPlayer: AVAudioPlayerNode?
    private var lowEq: AVAudioUnitEQ?
    private var lowGain: AVAudioMixerNode?
    private var midPlayer: AVAudioPlayerNode?
    private var midEq: AVAudioUnitEQ?
    private var midGain: AVAudioMixerNode?

    init() { super.init(id: "coffee-shop", name: "Coffee Shop") }

    override func buildAudioGraph(engine: AVAudioEngine, output: AVAudioMixerNode) {
        let noise = createNoiseBuffer(engine: engine, duration: 4)

        // Low warmth layer — lowpass 180Hz
        lowGain = createGainNode(engine: engine, volume: 0.010, output: output)
        lowEq = createEQ(engine: engine, type: .lowPass, frequency: 180, output: lowGain!)
        lowPlayer = createLoopingPlayer(engine: engine, buffer: noise, output: lowEq!)

        // Mid hum — bandpass 350Hz
        midGain = createGainNode(engine: engine, volume: 0.003, output: output)
        midEq = createEQ(engine: engine, type: .bandPass, frequency: 350 + Float.random(in: 0...50), bandwidth: 0.83, output: midGain!)
        midPlayer = createLoopingPlayer(engine: engine, buffer: noise, output: midEq!)

        setupOneshotPool(engine: engine, output: output, size: 6)
    }

    override func startAudioGraph() {
        guard let engine else { return }
        let noise = createNoiseBuffer(engine: engine, duration: 4)
        if let lp = lowPlayer { startLooping(player: lp, buffer: noise) }
        if let mp = midPlayer { startLooping(player: mp, buffer: noise) }

        // Breathing modulation
        scheduleTimer(interval: 0.3) { [weak self] in
            guard let self else { return }
            let t = Date().timeIntervalSince1970
            let mod = Float(sin(t * 0.015 * 2 * .pi)) * 0.006 + 0.010
            self.lowGain?.outputVolume = mod
        }

        // Customer event cycles (2-3 streams)
        let streamCount = Int.random(in: 2...3)
        for i in 0..<streamCount {
            scheduleDelayed(delay: Double(i) * 5) { [weak self] in
                self?.scheduleCustomerCycle()
            }
        }
    }

    private func scheduleCustomerCycle() {
        guard isPlaying else { return }
        let cycleDuration = 55.0 + Double.random(in: 0...10) // 55-65s full cycle
        let sr = sampleRate

        // Door sounds
        let doorBurst = createNoiseBurst(sampleRate: sr, duration: 0.6) { t in
            let attack = min(t * 10, 1.0)
            let decay = max(0, 1 - (t - 0.1) * 2)
            return attack * decay
        }
        playOneShot(buffer: doorBurst, volume: 0.03)

        // Footsteps after door
        scheduleDelayed(delay: 1.5) { [weak self] in
            guard let self else { return }
            for i in 0..<3 {
                let step = self.createNoiseBurst(sampleRate: sr, duration: 0.08) { t in expf(-t * 15) }
                self.scheduleDelayed(delay: Double(i) * 0.5) { [weak self] in
                    self?.playOneShot(buffer: step, volume: 0.015 + Float.random(in: 0...0.01))
                }
            }
        }

        // Ceramic clink after settling
        scheduleDelayed(delay: 8 + Double.random(in: 0...5)) { [weak self] in
            guard let self else { return }
            let clink = self.createSineBurst(sampleRate: sr, frequency: 3200 + Float.random(in: 0...600), duration: 0.08, decay: 25)
            self.playOneShot(buffer: clink, volume: 0.006 + Float.random(in: 0...0.003))
        }

        // Espresso machine
        if Float.random(in: 0...1) < 0.5 {
            scheduleDelayed(delay: 15 + Double.random(in: 0...10)) { [weak self] in
                guard let self else { return }
                let hissDur = 3.0 + Double.random(in: 0...2)
                let hiss = self.createNoiseBurst(sampleRate: sr, duration: hissDur) { t in
                    let attack = min(t * 3, 1.0)
                    let sustain: Float = t < 0.8 ? 1 : max(0, 1 - (t - 0.8) * 5)
                    return attack * sustain
                }
                self.playOneShot(buffer: hiss, volume: 0.014)
            }
        }

        // Stirring spoon
        if Float.random(in: 0...1) < 0.4 {
            scheduleDelayed(delay: 25 + Double.random(in: 0...10)) { [weak self] in
                guard let self else { return }
                let taps = Int.random(in: 4...6)
                for i in 0..<taps {
                    let tap = self.createSineBurst(sampleRate: sr, frequency: 4000 + Float.random(in: 0...1000), duration: 0.02, decay: 40)
                    let tapDelay = Double(i) * (0.22 + Double.random(in: 0...0.1))
                    self.scheduleDelayed(delay: tapDelay) { [weak self] in
                        self?.playOneShot(buffer: tap, volume: 0.002 + Float.random(in: 0...0.0015))
                    }
                }
            }
        }

        // Door close at end, then restart cycle
        scheduleDelayed(delay: cycleDuration - 2) { [weak self] in
            guard let self else { return }
            let close = self.createNoiseBurst(sampleRate: sr, duration: 0.25) { t in expf(-t * 8) }
            self.playOneShot(buffer: close, volume: 0.03)
        }

        scheduleDelayed(delay: cycleDuration) { [weak self] in
            self?.scheduleCustomerCycle()
        }
    }

    override func stopAudioGraph() {
        lowPlayer?.stop()
        midPlayer?.stop()
    }

    override func teardownAudioGraph() {
        teardownOneshotPool()
        for n in [lowPlayer, midPlayer] as [AVAudioPlayerNode?] { if let n { engine?.detach(n) } }
        for n in [lowEq, midEq] as [AVAudioUnitEQ?] { if let n { engine?.detach(n) } }
        for n in [lowGain, midGain] as [AVAudioMixerNode?] { if let n { engine?.detach(n) } }
        lowPlayer = nil; lowEq = nil; lowGain = nil
        midPlayer = nil; midEq = nil; midGain = nil
    }
}
