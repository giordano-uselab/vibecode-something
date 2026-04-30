import AVFoundation

/// Crackling Fire — warm fireplace with crackles and pops.
final class CracklingFireGenerator: BaseSoundGenerator {
    private var flamePlayer: AVAudioPlayerNode?
    private var lowEq: AVAudioUnitEQ?
    private var lowGain: AVAudioMixerNode?
    private var midEq: AVAudioUnitEQ?
    private var midGain: AVAudioMixerNode?

    init() { super.init(id: "crackling-fire", name: "Crackling Fire") }

    override func buildAudioGraph(engine: AVAudioEngine, output: AVAudioMixerNode) {
        let brown = createBrownNoiseBuffer(engine: engine)

        // Low rumble layer — deep warmth
        lowGain = createGainNode(engine: engine, volume: 0.02, output: output)
        lowEq = createEQ(engine: engine, type: .bandPass, frequency: 150, bandwidth: 1.67, output: lowGain!)

        // Mid crackle texture — burning character
        midGain = createGainNode(engine: engine, volume: 0.007, output: output)
        midEq = createEQ(engine: engine, type: .bandPass, frequency: 600 + Float.random(in: 0...200), bandwidth: 1.25, output: midGain!)

        // Both filters fed from same source
        let merger = AVAudioMixerNode()
        engine.attach(merger)
        engine.connect(merger, to: lowEq!, format: nil)
        engine.connect(merger, to: midEq!, format: nil)

        flamePlayer = createLoopingPlayer(engine: engine, buffer: brown, output: merger)

        // One-shot pool for crackles and pops
        setupOneshotPool(engine: engine, output: output, size: 6)
    }

    override func startAudioGraph() {
        guard let engine, let flamePlayer else { return }
        let brown = createBrownNoiseBuffer(engine: engine)
        startLooping(player: flamePlayer, buffer: brown)

        // Breathing modulation
        scheduleTimer(interval: 0.2) { [weak self] in
            guard let self else { return }
            let t = Date().timeIntervalSince1970
            let breathe = Float(sin(t * 0.12 * 2 * .pi)) * 0.008 + 0.02
            self.lowGain?.outputVolume = breathe
            let breathe2 = Float(sin(t * 0.03 * 2 * .pi)) * 0.006 + 0.007
            self.midGain?.outputVolume = breathe2
        }

        scheduleCrackles()
        schedulePops()
    }

    private func scheduleCrackles() {
        guard isPlaying else { return }
        let delay = 0.3 + Double.random(in: 0...1.2)
        scheduleDelayed(delay: delay) { [weak self] in
            guard let self, self.isPlaying else { return }
            let sr = self.sampleRate
            let dur = 0.01 + Double.random(in: 0...0.03) // 10-40ms
            let vol: Float = 0.02 + Float.random(in: 0...0.04)
            let burst = self.createNoiseBurst(sampleRate: sr, duration: dur) { t in
                expf(-t * 30) // very fast decay
            }
            self.playOneShot(buffer: burst, volume: vol)
            self.scheduleCrackles()
        }
    }

    private func schedulePops() {
        guard isPlaying else { return }
        let delay = 5.0 + Double.random(in: 0...10) // Rare
        scheduleDelayed(delay: delay) { [weak self] in
            guard let self, self.isPlaying else { return }
            let sr = self.sampleRate
            let vol: Float = 0.05 + Float.random(in: 0...0.04)
            // Low thump + noise snap
            let dur = 0.05
            let pop = self.createNoiseBurst(sampleRate: sr, duration: dur) { t in
                expf(-t * 20) * (1 + sin(t * 150 * 2 * Float.pi) * 0.3)
            }
            self.playOneShot(buffer: pop, volume: vol)
            self.schedulePops()
        }
    }

    override func stopAudioGraph() {
        flamePlayer?.stop()
    }

    override func teardownAudioGraph() {
        teardownOneshotPool()
        if let p = flamePlayer { engine?.detach(p) }
        if let e = lowEq { engine?.detach(e) }
        if let e = midEq { engine?.detach(e) }
        if let g = lowGain { engine?.detach(g) }
        if let g = midGain { engine?.detach(g) }
        flamePlayer = nil; lowEq = nil; midEq = nil; lowGain = nil; midGain = nil
    }
}
