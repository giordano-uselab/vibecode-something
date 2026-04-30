import AVFoundation

/// Base class for procedural sound generators.
/// Provides common lifecycle, volume control, noise buffer creation,
/// and a mixer node for subclasses to connect their graphs to.
class BaseSoundGenerator: SoundGenerator {
    let id: String
    let name: String

    private(set) var isPlaying = false
    private(set) var volume: Float = 0

    /// The mixer node this generator's output connects to.
    /// Attached to the engine by `attach(to:mixer:)`.
    private(set) var outputMixer: AVAudioMixerNode?
    private(set) weak var engine: AVAudioEngine?
    private(set) var parentMixer: AVAudioMixerNode?

    /// Audio format — set after attach.
    private(set) var format: AVAudioFormat?

    /// Timers managed by subclasses — all cancelled on stop/dispose.
    var timers: [Timer] = []
    var dispatchItems: [DispatchWorkItem] = []

    init(id: String, name: String) {
        self.id = id
        self.name = name
    }

    func attach(to engine: AVAudioEngine, mixer: AVAudioMixerNode) {
        self.engine = engine
        self.parentMixer = mixer

        let out = AVAudioMixerNode()
        engine.attach(out)
        engine.connect(out, to: mixer, format: nil)
        out.outputVolume = volume * 3 // match web's x3 amplification
        self.outputMixer = out
        self.format = monoFormat()

        buildAudioGraph(engine: engine, output: out)
    }

    func start() {
        guard !isPlaying else { return }
        isPlaying = true
        startAudioGraph()
    }

    func stop() {
        guard isPlaying else { return }
        isPlaying = false
        cancelTimers()
        stopAudioGraph()
    }

    func setVolume(_ vol: Float) {
        volume = max(0, min(1, vol))
        outputMixer?.outputVolume = volume * 3
    }

    func dispose() {
        stop()
        teardownAudioGraph()
        if let out = outputMixer, let engine = engine {
            engine.disconnectNodeOutput(out)
            engine.detach(out)
        }
        outputMixer = nil
        engine = nil
        parentMixer = nil
    }

    // MARK: - Subclass overrides

    /// Build the audio node graph. Called once during attach.
    func buildAudioGraph(engine: AVAudioEngine, output: AVAudioMixerNode) {
        // Override in subclasses
    }

    /// Start all sources. Called when start() is invoked.
    func startAudioGraph() {
        // Override in subclasses
    }

    /// Stop all sources. Called when stop() is invoked.
    func stopAudioGraph() {
        // Override in subclasses
    }

    /// Tear down and detach nodes. Called during dispose.
    func teardownAudioGraph() {
        // Override in subclasses
    }

    // MARK: - Helpers

    /// Get the engine sample rate.
    var sampleRate: Double {
        engine?.outputNode.outputFormat(forBus: 0).sampleRate ?? 44100
    }

    /// Standard mono format at engine sample rate.
    func monoFormat(sampleRate: Double? = nil) -> AVAudioFormat {
        AVAudioFormat(standardFormatWithSampleRate: sampleRate ?? self.sampleRate, channels: 1)!
    }

    /// Create a white noise buffer of the given duration.
    func createNoiseBuffer(engine: AVAudioEngine, duration: Double = 2.0) -> AVAudioPCMBuffer {
        let sr = engine.outputNode.outputFormat(forBus: 0).sampleRate
        let format = AVAudioFormat(standardFormatWithSampleRate: sr, channels: 1)!
        let frameCount = AVAudioFrameCount(sr * duration)
        let buffer = AVAudioPCMBuffer(pcmFormat: format, frameCapacity: frameCount)!
        buffer.frameLength = frameCount
        let data = buffer.floatChannelData![0]
        for i in 0..<Int(frameCount) {
            data[i] = Float.random(in: -1...1)
        }
        return buffer
    }

    /// Create a brown noise buffer of the given duration.
    func createBrownNoiseBuffer(engine: AVAudioEngine, duration: Double = 4.0) -> AVAudioPCMBuffer {
        let sr = engine.outputNode.outputFormat(forBus: 0).sampleRate
        let format = AVAudioFormat(standardFormatWithSampleRate: sr, channels: 1)!
        let frameCount = AVAudioFrameCount(sr * duration)
        let buffer = AVAudioPCMBuffer(pcmFormat: format, frameCapacity: frameCount)!
        buffer.frameLength = frameCount
        let data = buffer.floatChannelData![0]
        var last: Float = 0
        for i in 0..<Int(frameCount) {
            let white = Float.random(in: -1...1)
            last = (last + 0.02 * white) / 1.02
            data[i] = last * 3.5
        }
        return buffer
    }

    /// Create a pink noise buffer using Paul Kellet's method.
    func createPinkNoiseBuffer(engine: AVAudioEngine, duration: Double = 2.0) -> AVAudioPCMBuffer {
        let sr = engine.outputNode.outputFormat(forBus: 0).sampleRate
        let format = AVAudioFormat(standardFormatWithSampleRate: sr, channels: 1)!
        let frameCount = AVAudioFrameCount(sr * duration)
        let buffer = AVAudioPCMBuffer(pcmFormat: format, frameCapacity: frameCount)!
        buffer.frameLength = frameCount
        let data = buffer.floatChannelData![0]
        var b0: Float = 0, b1: Float = 0, b2: Float = 0
        var b3: Float = 0, b4: Float = 0, b5: Float = 0, b6: Float = 0
        for i in 0..<Int(frameCount) {
            let white = Float.random(in: -1...1)
            b0 = 0.99886 * b0 + white * 0.0555179
            b1 = 0.99332 * b1 + white * 0.0750759
            b2 = 0.96900 * b2 + white * 0.1538520
            b3 = 0.86650 * b3 + white * 0.3104856
            b4 = 0.55000 * b4 + white * 0.5329522
            b5 = -0.7616 * b5 - white * 0.0168980
            let pink = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362
            b6 = white * 0.115926
            data[i] = pink * 0.11
        }
        return buffer
    }

    /// Create a sine wave buffer that loops seamlessly.
    func createSineBuffer(sampleRate sr: Double, frequency: Float, duration: Double = 1.0) -> AVAudioPCMBuffer {
        let cycles = max(1, Int(Double(frequency) * duration))
        let actualDuration = Double(cycles) / Double(frequency)
        let frameCount = AVAudioFrameCount(sr * actualDuration)
        let format = AVAudioFormat(standardFormatWithSampleRate: sr, channels: 1)!
        let buffer = AVAudioPCMBuffer(pcmFormat: format, frameCapacity: frameCount)!
        buffer.frameLength = frameCount
        let data = buffer.floatChannelData![0]
        for i in 0..<Int(frameCount) {
            data[i] = sin(2 * Float.pi * frequency * Float(i) / Float(sr))
        }
        return buffer
    }

    /// Create a sawtooth wave buffer that loops seamlessly.
    func createSawtoothBuffer(sampleRate sr: Double, frequency: Float, duration: Double = 1.0) -> AVAudioPCMBuffer {
        let cycles = max(1, Int(Double(frequency) * duration))
        let actualDuration = Double(cycles) / Double(frequency)
        let frameCount = AVAudioFrameCount(sr * actualDuration)
        let format = AVAudioFormat(standardFormatWithSampleRate: sr, channels: 1)!
        let buffer = AVAudioPCMBuffer(pcmFormat: format, frameCapacity: frameCount)!
        buffer.frameLength = frameCount
        let data = buffer.floatChannelData![0]
        let period = Float(sr) / frequency
        for i in 0..<Int(frameCount) {
            let phase = Float(i).truncatingRemainder(dividingBy: period) / period
            data[i] = 2 * phase - 1
        }
        return buffer
    }

    /// Create a short noise burst for one-shot events (crackle, drip, etc.).
    func createNoiseBurst(sampleRate sr: Double, duration: Double, shape: ((Float) -> Float)? = nil) -> AVAudioPCMBuffer {
        let format = AVAudioFormat(standardFormatWithSampleRate: sr, channels: 1)!
        let frameCount = AVAudioFrameCount(sr * duration)
        let buffer = AVAudioPCMBuffer(pcmFormat: format, frameCapacity: frameCount)!
        buffer.frameLength = frameCount
        let data = buffer.floatChannelData![0]
        for i in 0..<Int(frameCount) {
            let t = Float(i) / Float(frameCount) // 0..1
            let envelope = shape?(t) ?? expf(-t * 8) // default: fast exponential decay
            data[i] = Float.random(in: -1...1) * envelope
        }
        return buffer
    }

    /// Create a short sine tone for one-shot events (chirp, bell, etc.).
    func createSineBurst(sampleRate sr: Double, frequency: Float, duration: Double, decay: Float = 6.0) -> AVAudioPCMBuffer {
        let format = AVAudioFormat(standardFormatWithSampleRate: sr, channels: 1)!
        let frameCount = AVAudioFrameCount(sr * duration)
        let buffer = AVAudioPCMBuffer(pcmFormat: format, frameCapacity: frameCount)!
        buffer.frameLength = frameCount
        let data = buffer.floatChannelData![0]
        for i in 0..<Int(frameCount) {
            let t = Float(i) / Float(sr)
            let envelope = expf(-t * decay)
            data[i] = sin(2 * Float.pi * frequency * t) * envelope
        }
        return buffer
    }

    /// Pool of reusable player nodes for one-shot events.
    private var oneshotPlayers: [AVAudioPlayerNode] = []
    private var oneshotGains: [AVAudioMixerNode] = []
    private var oneshotIndex = 0

    /// Initialize a pool of one-shot players connected to the given output.
    func setupOneshotPool(engine: AVAudioEngine, output: AVAudioNode, size: Int = 6) {
        let mono = monoFormat()
        for _ in 0..<size {
            let player = AVAudioPlayerNode()
            let gain = AVAudioMixerNode()
            engine.attach(player)
            engine.attach(gain)
            engine.connect(player, to: gain, format: mono)
            engine.connect(gain, to: output, format: nil)
            gain.outputVolume = 0
            oneshotPlayers.append(player)
            oneshotGains.append(gain)
        }
    }

    /// Start all one-shot players (call from startAudioGraph).
    func startOneshotPool() {
        for player in oneshotPlayers {
            if !player.isPlaying { player.play() }
        }
    }

    /// Play a one-shot buffer through the pool.
    func playOneShot(buffer: AVAudioPCMBuffer, volume: Float) {
        guard !oneshotPlayers.isEmpty else { return }
        let idx = oneshotIndex % oneshotPlayers.count
        oneshotIndex += 1
        let player = oneshotPlayers[idx]
        let gain = oneshotGains[idx]
        if !player.isPlaying { player.play() }
        gain.outputVolume = volume
        player.scheduleBuffer(buffer, at: nil, options: [], completionHandler: nil)
    }

    /// Clean up one-shot pool.
    func teardownOneshotPool() {
        for player in oneshotPlayers {
            player.stop()
            engine?.detach(player)
        }
        for gain in oneshotGains {
            engine?.detach(gain)
        }
        oneshotPlayers.removeAll()
        oneshotGains.removeAll()
        oneshotIndex = 0
    }

    /// Schedule a repeating action. Automatically cancelled on stop/dispose.
    func scheduleTimer(interval: TimeInterval, action: @escaping () -> Void) {
        let timer = Timer.scheduledTimer(withTimeInterval: interval, repeats: true) { [weak self] t in
            guard let self = self, self.isPlaying else { t.invalidate(); return }
            action()
        }
        timers.append(timer)
    }

    /// Schedule a delayed action. Automatically cancelled on stop/dispose.
    func scheduleDelayed(delay: TimeInterval, action: @escaping () -> Void) {
        let item = DispatchWorkItem { [weak self] in
            guard let self = self, self.isPlaying else { return }
            action()
        }
        dispatchItems.append(item)
        DispatchQueue.main.asyncAfter(deadline: .now() + delay, execute: item)
    }

    func cancelTimers() {
        timers.forEach { $0.invalidate() }
        timers.removeAll()
        dispatchItems.forEach { $0.cancel() }
        dispatchItems.removeAll()
    }

    /// Attach a player node with a looping buffer to the engine.
    func createLoopingPlayer(engine: AVAudioEngine, buffer: AVAudioPCMBuffer, output: AVAudioNode) -> AVAudioPlayerNode {
        let player = AVAudioPlayerNode()
        engine.attach(player)
        engine.connect(player, to: output, format: buffer.format)
        return player
    }

    /// Start a player node looping a buffer.
    func startLooping(player: AVAudioPlayerNode, buffer: AVAudioPCMBuffer) {
        player.scheduleBuffer(buffer, at: nil, options: .loops)
        if !player.isPlaying { player.play() }
    }

    /// Create and attach an EQ filter node.
    func createEQ(engine: AVAudioEngine, type: AVAudioUnitEQFilterType, frequency: Float, bandwidth: Float = 1.0, gain: Float = 0, output: AVAudioNode) -> AVAudioUnitEQ {
        let eq = AVAudioUnitEQ(numberOfBands: 1)
        let band = eq.bands[0]
        band.filterType = type
        band.frequency = frequency
        band.bandwidth = bandwidth
        band.gain = gain
        band.bypass = false
        engine.attach(eq)
        engine.connect(eq, to: output, format: nil)
        return eq
    }

    /// Create and attach a mixer node with a specific volume.
    func createGainNode(engine: AVAudioEngine, volume: Float, output: AVAudioNode) -> AVAudioMixerNode {
        let mixer = AVAudioMixerNode()
        engine.attach(mixer)
        engine.connect(mixer, to: output, format: nil)
        mixer.outputVolume = volume
        return mixer
    }
}
