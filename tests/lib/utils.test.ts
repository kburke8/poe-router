import { describe, it, expect } from 'vitest';
import { formatTime, parseTime } from '@/lib/utils';

describe('formatTime', () => {
  it('formats 0 seconds', () => {
    expect(formatTime(0)).toBe('00:00:00');
  });

  it('formats seconds only', () => {
    expect(formatTime(45)).toBe('00:00:45');
  });

  it('formats minutes and seconds', () => {
    expect(formatTime(125)).toBe('00:02:05');
  });

  it('formats hours, minutes, and seconds', () => {
    expect(formatTime(3661)).toBe('01:01:01');
  });

  it('pads single-digit values', () => {
    expect(formatTime(3601)).toBe('01:00:01');
  });

  it('handles large hours', () => {
    expect(formatTime(36000)).toBe('10:00:00');
  });

  it('handles 59 seconds', () => {
    expect(formatTime(59)).toBe('00:00:59');
  });
});

describe('parseTime', () => {
  it('parses HH:MM:SS', () => {
    expect(parseTime('01:02:03')).toBe(3723);
  });

  it('parses MM:SS', () => {
    expect(parseTime('05:30')).toBe(330);
  });

  it('parses seconds only', () => {
    expect(parseTime('45')).toBe(45);
  });

  it('returns 0 for empty string', () => {
    expect(parseTime('')).toBe(0);
  });

  it('returns 0 for zero', () => {
    expect(parseTime('0')).toBe(0);
  });

  it('parses 00:00:00', () => {
    expect(parseTime('00:00:00')).toBe(0);
  });
});

describe('round-trip', () => {
  it('parseTime(formatTime(N)) === N', () => {
    for (const n of [0, 1, 59, 60, 3599, 3600, 3661, 36000]) {
      expect(parseTime(formatTime(n))).toBe(n);
    }
  });
});
