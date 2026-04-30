import AVFoundation
import MediaPlayer

/// Central audio engine managing AVAudioEngine, AVAudioSession,
/// sound generator lifecycle, and system integration (background audio,
/// lock screen controls, interruption handling).
@Observable
final class AudioEngine {
    private let engine = AVAudioEngine()
    private let masterMixer = AVAudioMixerNode()
    private var generators: [String: SoundGenerator] = [:]
    private var generatorFactories: [String: () -> SoundGenerator] = [:]

    private(set) var soundStates: [String: SoundState] = [:]
    var masterVolume: Float = 0.8 {
        didSet { masterMixer.outputVolume = masterVolume }
    }

    var activeSoundCount: Int {
        soundStates.values.filter(\.active).count
    }

    init() {
        engine.attach(masterMixer)
        engine.connect(masterMixer, to: engine.mainMixerNode, format: nil)
        masterMixer.outputVolume = masterVolume
    }

    // MARK: - Registration

    func register(id: String, factory: @escaping () -> SoundGenerator) {
        generatorFactories[id] = factory
        soundStates[id] = SoundState(id: id, active: false, volume: 0.3)
    }

    // MARK: - Audio Session

    func configureAudioSession() {
        let session = AVAudioSession.sharedInstance()
        do {
            try session.setCategory(.playback, mode: .default, options: [.mixWithOthers])
            try session.setActive(true)
        } catch {
            print("Audio session error: \(error)")
        }

        NotificationCenter.default.addObserver(
            forName: AVAudioSession.interruptionNotification,
            object: nil,
            queue: .main
        ) { [weak self] notification in
            self?.handleInterruption(notification)
        }
    }

    private func handleInterruption(_ notification: Notification) {
        guard let info = notification.userInfo,
              let typeValue = info[AVAudioSessionInterruptionTypeKey] as? UInt,
              let type = AVAudioSession.InterruptionType(rawValue: typeValue) else { return }

        switch type {
        case .began:
            // System interrupted (phone call, Siri, etc.) — engine paused automatically
            break
        case .ended:
            guard let optionsValue = info[AVAudioSessionInterruptionOptionKey] as? UInt else { return }
            let options = AVAudioSession.InterruptionOptions(rawValue: optionsValue)
            if options.contains(.shouldResume) {
                try? engine.start()
            }
        @unknown default:
            break
        }
    }

    // MARK: - Engine lifecycle

    private func ensureEngineRunning() {
        guard !engine.isRunning else { return }
        do {
            try engine.start()
        } catch {
            print("Engine start error: \(error)")
        }
    }

    // MARK: - Sound control

    func toggleSound(_ id: String) {
        guard var state = soundStates[id] else { return }
        if state.active {
            stopSound(id)
        } else {
            startSound(id)
        }
    }

    func startSound(_ id: String) {
        ensureEngineRunning()

        if generators[id] == nil, let factory = generatorFactories[id] {
            let gen = factory()
            gen.attach(to: engine, mixer: masterMixer)
            generators[id] = gen
        }

        guard let gen = generators[id] else { return }
        let vol = soundStates[id]?.volume ?? 0.3
        gen.setVolume(vol)
        gen.start()
        soundStates[id]?.active = true
        updateNowPlaying()
    }

    func stopSound(_ id: String) {
        generators[id]?.stop()
        soundStates[id]?.active = false
        updateNowPlaying()
    }

    func setVolume(_ id: String, volume: Float) {
        let clamped = max(0, min(1, volume))
        soundStates[id]?.volume = clamped
        generators[id]?.setVolume(clamped)
    }

    func stopAll() {
        for id in generators.keys {
            stopSound(id)
        }
    }

    var hasActiveSounds: Bool {
        soundStates.values.contains { $0.active }
    }

    // MARK: - Now Playing / Lock Screen

    private func updateNowPlaying() {
        let center = MPNowPlayingInfoCenter.default()
        if hasActiveSounds {
            var info = [String: Any]()
            info[MPMediaItemPropertyTitle] = "Nois — Ambient Soundscapes"
            info[MPMediaItemPropertyArtist] = "Nois"
            center.nowPlayingInfo = info

            setupRemoteCommands()
        } else {
            center.nowPlayingInfo = nil
        }
    }

    private func setupRemoteCommands() {
        let commandCenter = MPRemoteCommandCenter.shared()

        commandCenter.pauseCommand.isEnabled = true
        commandCenter.pauseCommand.addTarget { [weak self] _ in
            self?.stopAll()
            return .success
        }

        commandCenter.playCommand.isEnabled = true
        commandCenter.playCommand.addTarget { [weak self] _ in
            self?.ensureEngineRunning()
            return .success
        }
    }

    // MARK: - Presets

    func applyPreset(_ sounds: [String: SoundState]) {
        stopAll()
        for (id, presetState) in sounds {
            soundStates[id]?.volume = presetState.volume
            if presetState.active {
                startSound(id)
            }
        }
    }

    func dispose() {
        stopAll()
        for gen in generators.values {
            gen.dispose()
        }
        generators.removeAll()
        engine.stop()
    }
}
