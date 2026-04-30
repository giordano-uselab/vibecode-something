import SwiftUI

struct SoundCardView: View {
    let meta: SoundMeta
    @Environment(AppState.self) private var appState

    private var state: SoundState? {
        appState.audioEngine.soundStates[meta.id]
    }

    private var isActive: Bool {
        state?.active ?? false
    }

    var body: some View {
        VStack(spacing: 8) {
            // Toggle area
            Button {
                appState.audioEngine.toggleSound(meta.id)
            } label: {
                VStack(spacing: 6) {
                    Text(meta.icon)
                        .font(.system(size: 28))
                        .scaleEffect(isActive ? 1.1 : 1.0)
                        .animation(.easeInOut(duration: 0.8).repeatForever(autoreverses: true), value: isActive)

                    VStack(spacing: 2) {
                        Text(meta.name)
                            .font(.system(size: 12, weight: .semibold))
                            .foregroundStyle(.white)
                            .lineLimit(1)

                        Text(meta.description)
                            .font(.system(size: 10))
                            .foregroundStyle(.secondary)
                            .lineLimit(2)
                            .multilineTextAlignment(.center)
                    }
                }
            }
            .buttonStyle(.plain)

            // Volume slider (only when active)
            if isActive {
                Slider(
                    value: Binding(
                        get: { Double(state?.volume ?? 0.3) },
                        set: { appState.audioEngine.setVolume(meta.id, volume: Float($0)) }
                    ),
                    in: 0...1
                )
                .tint(Color.white.opacity(0.6))
                .frame(height: 20)

                Text(isActive ? "ON" : "OFF")
                    .font(.system(size: 9, weight: .bold))
                    .foregroundStyle(.green)
            }
        }
        .padding(12)
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(isActive
                    ? Color.white.opacity(0.08)
                    : Color.white.opacity(0.03))
                .overlay(
                    RoundedRectangle(cornerRadius: 12)
                        .stroke(isActive
                            ? Color.white.opacity(0.15)
                            : Color.white.opacity(0.06), lineWidth: 1)
                )
        )
        .animation(.easeInOut(duration: 0.2), value: isActive)
    }
}
