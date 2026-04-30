import SwiftUI

struct ContentView: View {
    @Environment(AppState.self) private var appState

    var body: some View {
        ZStack {
            // Background
            Color(red: 0.04, green: 0.04, blue: 0.06)
                .ignoresSafeArea()

            ScrollView {
                VStack(spacing: 0) {
                    HeaderView()
                    MasterControlsView()
                    SoundGridView(
                        title: "Sounds",
                        sounds: SoundCatalog.basicSounds
                    )
                    if !SoundCatalog.soundscapes.isEmpty {
                        SoundGridView(
                            title: "Soundscapes",
                            sounds: SoundCatalog.soundscapes
                        )
                    }
                }
                .padding(.bottom, 40)
            }
        }
        .preferredColorScheme(.dark)
    }
}

struct HeaderView: View {
    var body: some View {
        VStack(spacing: 4) {
            Text("Nois")
                .font(.system(size: 36, weight: .bold, design: .rounded))
                .foregroundStyle(.white)
            Text("Nice noise, mixed by you.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
        }
        .padding(.top, 20)
        .padding(.bottom, 12)
    }
}
