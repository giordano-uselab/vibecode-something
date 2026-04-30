import SwiftUI

@Observable
final class AppState {
    let audioEngine = AudioEngine()

    init() {
        registerAllSounds()
        audioEngine.configureAudioSession()
    }

    private func registerAllSounds() {
        // Rain
        audioEngine.register(id: "light-drizzle") { LightDrizzleGenerator() }
        audioEngine.register(id: "steady-rain") { SteadyRainGenerator() }
        audioEngine.register(id: "heavy-downpour") { HeavyDownpourGenerator() }
        audioEngine.register(id: "thunderstorm") { ThunderstormGenerator() }
        // Wind
        audioEngine.register(id: "gentle-breeze") { GentleBreezeGenerator() }
        audioEngine.register(id: "forest-wind") { ForestWindGenerator() }
        audioEngine.register(id: "coastal-wind") { CoastalWindGenerator() }
        // Nature
        audioEngine.register(id: "crackling-fire") { CracklingFireGenerator() }
        audioEngine.register(id: "flowing-river") { FlowingRiverGenerator() }
        audioEngine.register(id: "rustling-leaves") { RustlingLeavesGenerator() }
        audioEngine.register(id: "birds-at-dawn") { BirdsAtDawnGenerator() }
        audioEngine.register(id: "crickets-night") { CricketsNightGenerator() }
        // Urban
        audioEngine.register(id: "coffee-shop") { CoffeeShopGenerator() }
        audioEngine.register(id: "horse-hooves") { HorseHoovesGenerator() }
        audioEngine.register(id: "train-journey") { TrainJourneyGenerator() }
        // Focus
        audioEngine.register(id: "deep-space") { DeepSpaceGenerator() }
        audioEngine.register(id: "tibetan-bowl") { TibetanBowlGenerator() }
        // Horror
        audioEngine.register(id: "horror-ghosts") { HorrorGhostsGenerator() }
        audioEngine.register(id: "horror-music") { HorrorMusicGenerator() }
        audioEngine.register(id: "horror-heartbeat") { HorrorHeartbeatGenerator() }
        audioEngine.register(id: "dripping-cave") { DrippingCaveGenerator() }
        // Soundscapes
        audioEngine.register(id: "roman-piazza") { RomanPiazzaGenerator() }
        audioEngine.register(id: "ancient-kyoto") { AncientKyotoGenerator() }
        audioEngine.register(id: "amsterdam-canal") { AmsterdamCanalGenerator() }
    }
}
