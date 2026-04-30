import AVFoundation

/// Protocol for all procedural sound generators.
/// Each generator owns its AVAudioNodes and connects them to a mixer node.
protocol SoundGenerator: AnyObject {
    var id: String { get }
    var name: String { get }

    /// Build and connect audio nodes to the given mixer node.
    func attach(to engine: AVAudioEngine, mixer: AVAudioMixerNode)

    /// Start producing sound. Idempotent.
    func start()

    /// Stop producing sound. Idempotent.
    func stop()

    /// Set output volume 0–1.
    func setVolume(_ volume: Float)

    /// Current volume.
    var volume: Float { get }

    /// Whether currently producing sound.
    var isPlaying: Bool { get }

    /// Release all audio resources.
    func dispose()
}
