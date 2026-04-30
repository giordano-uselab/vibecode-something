import AVFoundation

/// Rustling Leaves — dry leaves shifting with occasional gusts.
final class RustlingLeavesGenerator: BaseSoundGenerator {
    private var swooshPlayer: AVAudioPlayerNode?
    private var swooshEq: AVAudioUnitEQ?
    private var swooshGain: AVAudioMixerNode?
    private var crispPlayer: AVAudioPlayerNode?
    private var crispEq: AVAudioUnitEQ?
    private var crispGain: AVAudioMixerNode?

    init() { super.init(id: "rustling-leaves", name: "Rustling Leaves") }

    override func buildAudioGraph(engine: AVAudioEngine, output: AVAudioMixerNode) {
        let noise = createNoiseBuffer(engine: engine)

        // Swoosh layer — bandpass 2500Hz
        swooshGain = createGainNode(engine: engine, volume: 0.02, output: output)
        swooshEq = createEQ(engine: engine, type: .bandPass, frequency: 2500, bandwidth: 1.25, output: swooshGain!)
        swooshPlayer = createLoopingPlayer(engine: engine, buffer: noise, output: swooshEq!)

        // Crisp layer — bandpass 7000Hz
        crispGain = createGainNode(engine: engine, volume: 0.008, output: output)
        crispEq = createEQ(engine: engine, type: .bandPass, frequency: 7000, bandwidth: 1.0, output: crispGain!)
        crispPlayer = createLoopingPlayer(engine: engine, buffer: noise, output: crispEq!)
    }

    override func startAudioGraph() {
        guard let engine else { return }
        let noise = createNoiseBuffer(engine: engine)
        if let sp = swooshPlayer { startLooping(player: sp, buffer: noise) }
        if let cp = crispPlayer { startLooping(player: cp, buffer: noise) }
        scheduleGusts()
        scheduleSkitter()
    }

    private func scheduleGusts() {
        guard isPlaying else { return }
        let delay = 0.6 + Double.random(in: 0...1.5)
        scheduleDelayed(delay: delay) { [weak self] in
            guard let self, self.isPlaying else { return }
            let peak: Float = 0.04 + Float.random(in: 0...0.06)
            let crispPeak: Float = 0.015 + Float.random(in: 0...0.02)
            let riseDur = 0.08 + Double.random(in: 0...0.15)
            let holdDur = 0.1 + Double.random(in: 0...0.3)
            let fallDur = 0.15 + Double.random(in: 0...0.4)

            self.swooshGain?.outputVolume = peak
            self.crispGain?.outputVolume = crispPeak

            self.scheduleDelayed(delay: riseDur + holdDur + fallDur) { [weak self] in
                self?.swooshGain?.outputVolume = 0.02
                self?.crispGain?.outputVolume = 0.008
            }
            self.scheduleGusts()
        }
    }

    private func scheduleSkitter() {
        guard isPlaying else { return }
        let delay = 2.0 + Double.random(in: 0...5)
        scheduleDelayed(delay: delay) { [weak self] in
            guard let self, self.isPlaying else { return }
            self.crispGain?.outputVolume = 0.04
            self.scheduleDelayed(delay: 0.12) { [weak self] in
                self?.crispGain?.outputVolume = 0.008
            }
            self.scheduleSkitter()
        }
    }

    override func stopAudioGraph() {
        swooshPlayer?.stop()
        crispPlayer?.stop()
    }

    override func teardownAudioGraph() {
        for n in [swooshPlayer, crispPlayer] as [AVAudioPlayerNode?] {
            if let n { engine?.detach(n) }
        }
        for n in [swooshEq, crispEq] as [AVAudioUnitEQ?] {
            if let n { engine?.detach(n) }
        }
        for n in [swooshGain, crispGain] as [AVAudioMixerNode?] {
            if let n { engine?.detach(n) }
        }
        swooshPlayer = nil; swooshEq = nil; swooshGain = nil
        crispPlayer = nil; crispEq = nil; crispGain = nil
    }
}
