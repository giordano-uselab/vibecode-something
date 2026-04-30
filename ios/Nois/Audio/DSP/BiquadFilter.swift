import Foundation

enum FilterType {
    case lowpass
    case highpass
    case bandpass
}

struct BiquadFilter {
    private var b0: Float = 1
    private var b1: Float = 0
    private var b2: Float = 0
    private var a1: Float = 0
    private var a2: Float = 0

    private var z1: Float = 0
    private var z2: Float = 0

    private var currentType: FilterType = .lowpass
    private var currentFreq: Float = 1000
    private var currentQ: Float = 0.707
    private var sampleRate: Float = 44100

    init() {}

    init(type: FilterType, frequency: Float, q: Float, sampleRate: Float) {
        self.sampleRate = sampleRate
        switch type {
        case .lowpass:  setLowpass(frequency: frequency, q: q, sampleRate: sampleRate)
        case .highpass: setHighpass(frequency: frequency, q: q, sampleRate: sampleRate)
        case .bandpass: setBandpass(frequency: frequency, q: q, sampleRate: sampleRate)
        }
    }

    mutating func setLowpass(frequency: Float, q: Float, sampleRate: Float) {
        currentType = .lowpass
        currentFreq = frequency
        currentQ = max(q, 0.001)
        self.sampleRate = sampleRate
        computeCoefficients()
    }

    mutating func setHighpass(frequency: Float, q: Float, sampleRate: Float) {
        currentType = .highpass
        currentFreq = frequency
        currentQ = max(q, 0.001)
        self.sampleRate = sampleRate
        computeCoefficients()
    }

    mutating func setBandpass(frequency: Float, q: Float, sampleRate: Float) {
        currentType = .bandpass
        currentFreq = frequency
        currentQ = max(q, 0.001)
        self.sampleRate = sampleRate
        computeCoefficients()
    }

    mutating func updateFrequency(_ frequency: Float) {
        currentFreq = frequency
        computeCoefficients()
    }

    mutating func updateQ(_ q: Float) {
        currentQ = max(q, 0.001)
        computeCoefficients()
    }

    private mutating func computeCoefficients() {
        let freq = min(max(currentFreq, 1), sampleRate * 0.499)
        let w0 = 2.0 * Float.pi * freq / sampleRate
        let sinW0 = sin(w0)
        let cosW0 = cos(w0)
        let alpha = sinW0 / (2.0 * currentQ)

        let a0: Float

        switch currentType {
        case .lowpass:
            b0 = (1 - cosW0) / 2
            b1 = 1 - cosW0
            b2 = (1 - cosW0) / 2
            a0 = 1 + alpha
            a1 = -2 * cosW0
            a2 = 1 - alpha

        case .highpass:
            b0 = (1 + cosW0) / 2
            b1 = -(1 + cosW0)
            b2 = (1 + cosW0) / 2
            a0 = 1 + alpha
            a1 = -2 * cosW0
            a2 = 1 - alpha

        case .bandpass:
            b0 = alpha
            b1 = 0
            b2 = -alpha
            a0 = 1 + alpha
            a1 = -2 * cosW0
            a2 = 1 - alpha
        }

        b0 /= a0
        b1 /= a0
        b2 /= a0
        a1 /= a0
        a2 /= a0
    }

    mutating func process(_ input: Float) -> Float {
        let output = b0 * input + z1
        z1 = b1 * input - a1 * output + z2
        z2 = b2 * input - a2 * output
        return output
    }

    mutating func reset() {
        z1 = 0
        z2 = 0
    }
}
