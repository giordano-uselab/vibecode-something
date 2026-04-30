import AVFoundation

/// Flowing River — continuous water flowing over rocks with gurgles.
final class FlowingRiverGenerator: BaseSoundGenerator {
    private var basePlayer: AVAudioPlayerNode?
    private var baseEq: AVAudioUnitEQ?
    private var baseGain: AVAudioMixerNode?
    private var babblePlayer: AVAudioPlayerNode?
    private var babbleEq: AVAudioUnitEQ?
    private var babbleGain: AVAudioMixerNode?

    init() { super.init(id: "flowing-river", name: "Flowing River") }

    override func buildAudioGraph(engine: AVAudioEngine, output: AVAudioMixerNode) {
        let noise = createNoiseBuffer(engine: engine)

        // Base flow — bandpass 800Hz
        baseGain = createGainNode(engine: engine, volume: 0.008, output: output)
        baseEq = createEQ(engine: engine, type: .bandPass, frequency: 800, bandwidth: 2.0, output: baseGain!)
        basePlayer = createLoopingPlayer(engine: engine, buffer: noise, output: baseEq!)

        // Babble — bandpass 2200Hz
        babbleGain = createGainNode(engine: engine, volume: 0.006, output: output)
        babbleEq = createEQ(engine: engine, type: .bandPass, frequency: 2200, bandwidth: 1.0, output: babbleGain!)
        babblePlayer = createLoopingPlayer(engine: engine, buffer: noise, output: babbleEq!)

        // Gurgle pool
        setupOneshotPool(engine: engine, output: output, size: 4)
    }

    override func startAudioGraph() {
        guard let engine else { return }
        let noise = createNoiseBuffer(engine: engine)
        if let bp = basePlayer { startLooping(player: bp, buffer: noise) }
        if let bb = babblePlayer { startLooping(player: bb, buffer: noise) }

        // LFO modulation
        scheduleTimer(interval: 0.15) { [weak self] in
            guard let self else { return }
            let t = Date().timeIntervalSince1970
            let baseMod = Float(sin(t * 0.08 * 2 * .pi)) * 0.003 + 0.008
            self.baseGain?.outputVolume = baseMod
            let babbleMod = Float(sin(t * 0.2 * 2 * .pi)) * 0.003 + 0.006
            self.babbleGain?.outputVolume = babbleMod
        }

        scheduleGurgles()
    }

    private func scheduleGurgles() {
        guard isPlaying else { return }
        let delay = Double(200 + Float.random(in: 0...400)) / 1000
        scheduleDelayed(delay: delay) { [weak self] in
            guard let self, self.isPlaying else { return }
            let sr = self.sampleRate
            let freq = 400 + Float.random(in: 0...1200)
            let dur = Double(0.03 + Float.random(in: 0...0.06))
            let vol: Float = 0.01 + Float.random(in: 0...0.015)
            let burst = self.createSineBurst(sampleRate: sr, frequency: freq, duration: dur, decay: 20)
            self.playOneShot(buffer: burst, volume: vol)
            self.scheduleGurgles()
        }
    }

    override func stopAudioGraph() {
        basePlayer?.stop()
        babblePlayer?.stop()
    }

    override func teardownAudioGraph() {
        teardownOneshotPool()
        for n in [basePlayer, babblePlayer] as [AVAudioPlayerNode?] {
            if let n { engine?.detach(n) }
        }
        for n in [baseEq, babbleEq] as [AVAudioUnitEQ?] {
            if let n { engine?.detach(n) }
        }
        for n in [baseGain, babbleGain] as [AVAudioMixerNode?] {
            if let n { engine?.detach(n) }
        }
        basePlayer = nil; baseEq = nil; baseGain = nil
        babblePlayer = nil; babbleEq = nil; babbleGain = nil
    }
}
