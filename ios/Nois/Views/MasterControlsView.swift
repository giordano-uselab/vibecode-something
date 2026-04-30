import SwiftUI

struct MasterControlsView: View {
    @Environment(AppState.self) private var appState

    var body: some View {
        HStack(spacing: 16) {
            // Master volume
            HStack(spacing: 8) {
                Image(systemName: "speaker.fill")
                    .font(.system(size: 12))
                    .foregroundStyle(.secondary)

                Slider(
                    value: Binding(
                        get: { Double(appState.audioEngine.masterVolume) },
                        set: { appState.audioEngine.masterVolume = Float($0) }
                    ),
                    in: 0...1
                )
                .tint(Color.white.opacity(0.5))

                Image(systemName: "speaker.wave.3.fill")
                    .font(.system(size: 12))
                    .foregroundStyle(.secondary)
            }

            // Stop all button
            if appState.audioEngine.hasActiveSounds {
                Button {
                    appState.audioEngine.stopAll()
                } label: {
                    HStack(spacing: 4) {
                        Image(systemName: "stop.fill")
                            .font(.system(size: 10))
                        Text("Stop All")
                            .font(.system(size: 12, weight: .semibold))
                    }
                    .foregroundStyle(.white)
                    .padding(.horizontal, 14)
                    .padding(.vertical, 8)
                    .background(
                        Capsule()
                            .fill(Color.red.opacity(0.3))
                            .overlay(Capsule().stroke(Color.red.opacity(0.4), lineWidth: 1))
                    )
                }
                .buttonStyle(.plain)
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 10)
    }
}
