import SwiftUI

struct SoundGridView: View {
    let title: String
    let sounds: [SoundMeta]

    private let columns = [
        GridItem(.flexible(), spacing: 10),
        GridItem(.flexible(), spacing: 10),
        GridItem(.flexible(), spacing: 10),
    ]

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(title.uppercased())
                .font(.system(size: 10, weight: .bold))
                .foregroundStyle(.secondary)
                .tracking(2)
                .padding(.horizontal, 16)

            LazyVGrid(columns: columns, spacing: 10) {
                ForEach(sounds) { meta in
                    SoundCardView(meta: meta)
                }
            }
            .padding(.horizontal, 12)
        }
        .padding(.top, 8)
    }
}
