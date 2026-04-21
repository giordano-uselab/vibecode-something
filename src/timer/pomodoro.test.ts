import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PomodoroTimer, formatTime } from './pomodoro';

describe('PomodoroTimer', () => {
  let timer: PomodoroTimer;
  let onTick: ReturnType<typeof vi.fn>;
  let onModeSwitch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    onTick = vi.fn();
    onModeSwitch = vi.fn();
    timer = new PomodoroTimer(onTick, onModeSwitch);
  });

  it('starts in focus mode with 25 minutes', () => {
    const state = timer.getState();
    expect(state.mode).toBe('focus');
    expect(state.remainingSeconds).toBe(25 * 60);
    expect(state.isRunning).toBe(false);
  });

  it('start begins countdown', () => {
    timer.start();
    expect(timer.getState().isRunning).toBe(true);

    vi.advanceTimersByTime(3000);
    expect(onTick).toHaveBeenCalled();

    const lastCall = onTick.mock.calls.at(-1)![0];
    expect(lastCall.remainingSeconds).toBe(25 * 60 - 3);
  });

  it('pause stops countdown', () => {
    timer.start();
    vi.advanceTimersByTime(5000);
    timer.pause();
    expect(timer.getState().isRunning).toBe(false);

    const remaining = timer.getState().remainingSeconds;
    vi.advanceTimersByTime(5000);
    expect(timer.getState().remainingSeconds).toBe(remaining);
  });

  it('toggle switches between start and pause', () => {
    timer.toggle();
    expect(timer.getState().isRunning).toBe(true);
    timer.toggle();
    expect(timer.getState().isRunning).toBe(false);
  });

  it('reset returns to focus 25:00', () => {
    timer.start();
    vi.advanceTimersByTime(60000);
    timer.reset();
    expect(timer.getState().mode).toBe('focus');
    expect(timer.getState().remainingSeconds).toBe(25 * 60);
    expect(timer.getState().isRunning).toBe(false);
  });

  it('switches to break after focus ends', () => {
    timer.start();
    vi.advanceTimersByTime(25 * 60 * 1000);
    expect(onModeSwitch).toHaveBeenCalledWith('break');
    expect(timer.getState().mode).toBe('break');
    expect(timer.getState().remainingSeconds).toBe(5 * 60);
  });

  it('dispose stops the timer', () => {
    timer.start();
    timer.dispose();
    expect(timer.getState().isRunning).toBe(false);
  });
});

describe('formatTime', () => {
  it('formats minutes and seconds with padding', () => {
    expect(formatTime(25 * 60)).toBe('25:00');
    expect(formatTime(5 * 60)).toBe('05:00');
    expect(formatTime(0)).toBe('00:00');
    expect(formatTime(61)).toBe('01:01');
    expect(formatTime(599)).toBe('09:59');
  });
});
