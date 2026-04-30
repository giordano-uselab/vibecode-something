import Foundation

struct Preset: Identifiable, Codable {
    let id: String
    let name: String
    let sounds: [String: SoundState]
    let masterVolume: Float
    let createdAt: Date
}
