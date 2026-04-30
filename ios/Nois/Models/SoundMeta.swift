import Foundation

enum SoundCategory: String, Codable, CaseIterable {
    case basic
    case soundscape
}

struct SoundMeta: Identifiable {
    let id: String
    let name: String
    let category: SoundCategory
    let icon: String
    let description: String
}
