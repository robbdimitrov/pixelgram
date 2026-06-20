import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { relativeDate } from '$lib/utils/relativeDate';

describe('relativeDate', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2024-01-15T12:00:00Z'));
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('returns "now" for very recent dates (within 5 seconds)', () => {
		const date = new Date('2024-01-15T12:00:03Z');
		expect(relativeDate(date)).toBe('now');
	});

	it('formats seconds ago', () => {
		const date = new Date('2024-01-15T11:59:50Z');
		const result = relativeDate(date);
		expect(result).toMatch(/s(ec)? ago/);
	});

	it('formats minutes ago', () => {
		const date = new Date('2024-01-15T11:55:00Z');
		const result = relativeDate(date);
		expect(result).toMatch(/m(in)? ago/);
	});

	it('accepts string dates', () => {
		const result = relativeDate('2024-01-15T11:00:00Z');
		expect(typeof result).toBe('string');
		expect(result.length).toBeGreaterThan(0);
	});

	it('returns year-level relative for old dates', () => {
		const date = new Date('2020-01-01T00:00:00Z');
		const result = relativeDate(date, 'long');
		expect(result).toContain('year');
	});
});
