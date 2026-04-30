import AVFoundation

/// Horse Hooves — rhythmic clip-clop with trot/walk gait switching.
final class HorseHoovesGenerator: BaseSoundGenerator {
    private var beatIndex = 0
    private var isTrotting = true
    private var beatsInGait = 0
    private var gaitLength = 0

    init() { super.init(id: "horse-hooves", name: "Horse Hooves") }

    override func buildAudioGraph(engine: AVAudioEngine, output: AVAudioMixerNode) {
        setupOneshotPool(engine: engine, output: output, size: 6)
    }

    override func startAudioGraph() {
        beatIndex = 0
        isTrotting = true
        gaitLength = Int.random(in: 16...32)
        beatsInGait = 0
        scheduleNextBeat()
    }

    private func scheduleNextBeat() {
        guard isPlaying else { return }

        let emphasis: Float
        let delay: Double

        if isTrotting {
            // Trot: pairs of beats
            let trotEmphasis: [Float] = [1.0, 0.85, 0.6, 0.5]
            emphasis = trotEmphasis[beatIndex % 4]
            if beatIndex % 2 == 0 {
                delay = Double(350 + Float.random(in: 0...120)) / 1000
            } else {
                delay = Double(160 + Float.random(in: 0...60)) / 1000
            }
        } else {
            // Walk: slower, even spacing
            let walkEmphasis: [Float] = [0.9, 0.55, 0.75, 0.5]
            emphasis = walkEmphasis[beatIndex % 4]
            delay = Double(500 + Float.random(in: 0...300)) / 1000
        }

        playHoof(emphasis: emphasis)

        // Double-tap chance
        let doubleTapChance: Float = isTrotting ? 0.25 : 0.30
        if Float.random(in: 0...1) < doubleTapChance {
            let tapDelay = isTrotting
                ? Double(30 + Float.random(in: 0...40)) / 1000
                : Double(40 + Float.random(in: 0...50)) / 1000
            let tapEmphasis = emphasis * (isTrotting ? 0.35 : 0.3)
            scheduleDelayed(delay: tapDelay) { [weak self] in
                self?.playHoof(emphasis: tapEmphasis)
            }
        }

        beatIndex += 1
        beatsInGait += 1

        // Switch gaits
        if beatsInGait >= gaitLength {
            isTrotting.toggle()
            gaitLength = isTrotting ? Int.random(in: 16...32) : Int.random(in: 8...16)
            beatsInGait = 0
        }

        scheduleDelayed(delay: delay) { [weak self] in
            self?.scheduleNextBeat()
        }
    }

    private func playHoof(emphasis: Float) {
        let sr = sampleRate

        // Low body — noise burst with fast decay
        let body = createNoiseBurst(sampleRate: sr, duration: 0.18) { t in
            if t < 0.33 { return 1 - t * 2 } // fast initial drop
            return expf(-(t - 0.33) * 8) * 0.3 // slower tail
        }
        playOneShot(buffer: body, volume: 0.25 * emphasis)

        // Mid knock — shorter, higher
        let knock = createNoiseBurst(sampleRate: sr, duration: 0.08) { t in
            expf(-t * 20)
        }
        playOneShot(buffer: knock, volume: 0.15 * emphasis)
    }

    override func stopAudioGraph() {}

    override func teardownAudioGraph() {
        teardownOneshotPool()
    }
}
