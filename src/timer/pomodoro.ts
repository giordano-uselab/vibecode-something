import type { PomodoroState } from '../types';

const FOCUS_DURATION = 25 * 60;
const BREAK_DURATION = 5 * 60;

/**
 * Pomodoro timer — manages focus/break cycles.
 * Single Responsibility: only timer logic and state.
 * UI rendering is done by the consumer via the onTick callback.
 */
export class PomodoroTimer {
  private readonly state: PomodoroState;
  private intervalId: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly onTick: (state: PomodoroState) => void,
    private readonly onModeSwitch: (mode: 'focus' | 'break') => void,
  ) {
    this.state = {
      mode: 'focus',
      remainingSeconds: FOCUS_DURATION,
      totalSeconds: FOCUS_DURATION,
      isRunning: false,
    };
  }

  getState(): PomodoroState {
    return { ...this.state };
  }

  toggle(): void {
    if (this.state.isRunning) {
      this.pause();
    } else {
      this.start();
    }
  }

  start(): void {
    if (this.state.isRunning) return;
    this.state.isRunning = true;

    this.intervalId = setInterval(() => {
      this.state.remainingSeconds--;

      if (this.state.remainingSeconds <= 0) {
        this.switchMode();
      }

      this.onTick(this.getState());
    }, 1000);

    this.onTick(this.getState());
  }

  pause(): void {
    this.state.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.onTick(this.getState());
  }

  reset(): void {
    this.pause();
    this.state.mode = 'focus';
    this.state.remainingSeconds = FOCUS_DURATION;
    this.state.totalSeconds = FOCUS_DURATION;
    this.onTick(this.getState());
  }

  private switchMode(): void {
    const newMode = this.state.mode === 'focus' ? 'break' : 'focus';
    const duration = newMode === 'focus' ? FOCUS_DURATION : BREAK_DURATION;

    this.state.mode = newMode;
    this.state.remainingSeconds = duration;
    this.state.totalSeconds = duration;

    this.onModeSwitch(newMode);
  }

  dispose(): void {
    this.pause();
  }
}

export function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}
