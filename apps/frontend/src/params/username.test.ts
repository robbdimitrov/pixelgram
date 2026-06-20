import { describe, it, expect } from 'vitest';
import { match } from './username';

describe('username param matcher', () => {
  it('accepts @-prefixed names within length bounds', () => {
    expect(match('@abc')).toBe(true);
    expect(match('@johndoe')).toBe(true);
    expect(match('@a.b_c.99')).toBe(true);
    expect(match('@' + 'a'.repeat(30))).toBe(true);
  });

  it('rejects names missing the @ prefix', () => {
    expect(match('johndoe')).toBe(false);
  });

  it('rejects names outside the 3–30 length bounds', () => {
    expect(match('@ab')).toBe(false);
    expect(match('@' + 'a'.repeat(31))).toBe(false);
  });

  it('rejects disallowed characters', () => {
    expect(match('@John')).toBe(false);
    expect(match('@john doe')).toBe(false);
    expect(match('@john-doe')).toBe(false);
  });
});
