import { describe, it, expect } from 'vitest';
import { DateFormatter } from '../core/utils.js';

describe('DateFormatter.fromKoreanFormat', () => {
  it('converts valid date', () => {
    expect(DateFormatter.fromKoreanFormat('24.05.01')).toBe('2024-05-01');
  });

  it('returns empty string for invalid date', () => {
    expect(DateFormatter.fromKoreanFormat('24.13.01')).toBe('');
  });

  it('returns empty string for wrong format', () => {
    expect(DateFormatter.fromKoreanFormat('24.05.01(수)')).toBe('');
  });
});
