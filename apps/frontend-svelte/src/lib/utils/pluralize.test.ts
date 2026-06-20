import { describe, it, expect } from 'vitest';
import { pluralize } from '$lib/utils/pluralize';

describe('pluralize', () => {
	it('returns singular for count of 1', () => {
		expect(pluralize(1, 'post')).toBe('post');
	});

	it('returns plural (with s) for count of 0', () => {
		expect(pluralize(0, 'post')).toBe('posts');
	});

	it('returns plural (with s) for count > 1', () => {
		expect(pluralize(5, 'post')).toBe('posts');
	});

	it('uses custom plural when provided', () => {
		expect(pluralize(2, 'person', 'people')).toBe('people');
	});

	it('handles "like" correctly', () => {
		expect(pluralize(1, 'like')).toBe('like');
		expect(pluralize(0, 'like')).toBe('likes');
	});

	it('handles "follower" correctly', () => {
		expect(pluralize(1, 'follower')).toBe('follower');
		expect(pluralize(100, 'follower')).toBe('followers');
	});
});
