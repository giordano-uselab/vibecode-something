/**
 * Audio engine — manages the shared AudioContext lifecycle.
 * Single Responsibility: only handles context creation, resume, and suspend.
 */

let audioContext: AudioContext | null = null;

export function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  return audioContext;
}

export async function resumeAudioContext(): Promise<void> {
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') {
    await ctx.resume();
  }
}

export async function suspendAudioContext(): Promise<void> {
  if (audioContext?.state === 'running') {
    await audioContext.suspend();
  }
}

export function getMasterGain(): GainNode {
  const ctx = getAudioContext();
  if (!masterGain) {
    masterGain = ctx.createGain();
    masterGain.connect(ctx.destination);
  }
  return masterGain;
}

let masterGain: GainNode | null = null;

export function setMasterVolume(volume: number): void {
  const gain = getMasterGain();
  gain.gain.value = Math.max(0, Math.min(1, volume));
}
