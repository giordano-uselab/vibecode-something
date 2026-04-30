import Foundation

/// All sound metadata for the app.
enum SoundCatalog {
    static let all: [SoundMeta] = [
        // Rain
        SoundMeta(id: "light-drizzle", name: "Light Drizzle", category: .basic, icon: "🌦️", description: "Gentle drops on glass"),
        SoundMeta(id: "steady-rain", name: "Steady Rain", category: .basic, icon: "🌧️", description: "A calm, constant pour"),
        SoundMeta(id: "heavy-downpour", name: "Heavy Downpour", category: .basic, icon: "⛈️", description: "Dense rain, deep rumble"),
        SoundMeta(id: "thunderstorm", name: "Thunderstorm", category: .basic, icon: "🌩️", description: "Distant rolls of thunder"),
        // Wind
        SoundMeta(id: "gentle-breeze", name: "Gentle Breeze", category: .basic, icon: "🍃", description: "A warm breath of air"),
        SoundMeta(id: "forest-wind", name: "Forest Wind", category: .basic, icon: "🌲", description: "Wind through tall pines"),
        SoundMeta(id: "coastal-wind", name: "Coastal Wind", category: .basic, icon: "🌊", description: "Salty gusts by the sea"),
        // Nature
        SoundMeta(id: "crackling-fire", name: "Crackling Fire", category: .basic, icon: "🔥", description: "A warm hearth nearby"),
        SoundMeta(id: "flowing-river", name: "Flowing River", category: .basic, icon: "🏞️", description: "Water over smooth stones"),
        SoundMeta(id: "rustling-leaves", name: "Rustling Leaves", category: .basic, icon: "🍂", description: "Autumn leaves drifting"),
        SoundMeta(id: "birds-at-dawn", name: "Birds at Dawn", category: .basic, icon: "🐦", description: "First light, first songs"),
        SoundMeta(id: "crickets-night", name: "Crickets & Night", category: .basic, icon: "🦗", description: "A still summer night"),
        // Urban
        SoundMeta(id: "coffee-shop", name: "Coffee Shop", category: .basic, icon: "☕", description: "Cups and quiet voices"),
        SoundMeta(id: "horse-hooves", name: "Horse Hooves", category: .basic, icon: "🐴", description: "Clip-clop on cobblestones"),
        SoundMeta(id: "train-journey", name: "Train Journey", category: .basic, icon: "🚂", description: "Gentle rhythm on rails"),
        // Focus
        SoundMeta(id: "deep-space", name: "Deep Space", category: .basic, icon: "🌌", description: "Vast, infinite silence"),
        SoundMeta(id: "tibetan-bowl", name: "Tibetan Bowl", category: .basic, icon: "🔔", description: "Resonating stillness"),
        // Horror
        SoundMeta(id: "horror-ghosts", name: "Ghosts", category: .basic, icon: "👻", description: "Whispers from beyond"),
        SoundMeta(id: "horror-music", name: "Dark Drones", category: .basic, icon: "🎵", description: "Uneasy, shifting tones"),
        SoundMeta(id: "horror-heartbeat", name: "Heartbeat", category: .basic, icon: "🫀", description: "A slow, dark pulse"),
        SoundMeta(id: "dripping-cave", name: "Dripping Cave", category: .basic, icon: "💧", description: "Echoes in the deep"),
        // Soundscapes
        SoundMeta(id: "roman-piazza", name: "Roman Piazza", category: .soundscape, icon: "🏛️", description: "Sun-warmed Italian square"),
        SoundMeta(id: "ancient-kyoto", name: "Ancient Kyoto", category: .soundscape, icon: "⛩️", description: "A serene temple garden"),
        SoundMeta(id: "amsterdam-canal", name: "Amsterdam Canal", category: .soundscape, icon: "🇳🇱", description: "Quiet water, bicycle bells"),
    ]

    static var basicSounds: [SoundMeta] {
        all.filter { $0.category == .basic }
    }

    static var soundscapes: [SoundMeta] {
        all.filter { $0.category == .soundscape }
    }
}
