import Foundation

struct SoundState: Codable {
    let id: String
    var active: Bool
    var volume: Float // 0-1
}
