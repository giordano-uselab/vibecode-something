/**
 * Minimal AudioContext mock for testing sound generators in Node.
 * Web Audio API is browser-only, so we mock the essentials.
 */
export function createMockAudioContext(): AudioContext {
  const gainNode = {
    gain: { value: 1, setValueAtTime: () => {}, linearRampToValueAtTime: () => {}, exponentialRampToValueAtTime: () => {}, cancelScheduledValues: () => {} },
    connect: () => gainNode,
    disconnect: () => {},
  };

  const mockNode = {
    connect: () => mockNode,
    disconnect: () => {},
    start: () => {},
    stop: () => {},
    onended: null as ((ev: Event) => void) | null,
    type: 'lowpass',
    frequency: { value: 0, setValueAtTime: () => {}, linearRampToValueAtTime: () => {}, exponentialRampToValueAtTime: () => {}, cancelScheduledValues: () => {} },
    Q: { value: 0, setValueAtTime: () => {} },
    buffer: null,
    loop: false,
    playbackRate: { value: 1 },
  };

  const ctx = {
    state: 'running' as AudioContextState,
    sampleRate: 44100,
    currentTime: 0,
    destination: mockNode as unknown as AudioDestinationNode,
    createGain: () => gainNode as unknown as GainNode,
    createOscillator: () => ({ ...mockNode, type: 'sine' }) as unknown as OscillatorNode,
    createBiquadFilter: () => ({ ...mockNode }) as unknown as BiquadFilterNode,
    createBufferSource: () => ({ ...mockNode, buffer: null, loop: false }) as unknown as AudioBufferSourceNode,
    createBuffer: (channels: number, length: number, sampleRate: number) => ({
      numberOfChannels: channels,
      length,
      sampleRate,
      duration: length / sampleRate,
      getChannelData: () => new Float32Array(length),
    }) as unknown as AudioBuffer,
    resume: () => Promise.resolve(),
    suspend: () => Promise.resolve(),
    close: () => Promise.resolve(),
  } as unknown as AudioContext;

  return ctx;
}
