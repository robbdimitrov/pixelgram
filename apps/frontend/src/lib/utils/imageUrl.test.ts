import { describe, it, expect } from 'vitest';
import { imageUrl } from '$lib/utils/imageUrl';

describe('imageUrl', () => {
	it('returns placeholder for null', () => {
		expect(imageUrl(null)).toBe('/assets/placeholder.svg');
	});

	it('returns placeholder for undefined', () => {
		expect(imageUrl(undefined)).toBe('/assets/placeholder.svg');
	});

	it('returns placeholder for empty string', () => {
		expect(imageUrl('')).toBe('/assets/placeholder.svg');
	});

	it('returns /uploads/ path for a filename', () => {
		expect(imageUrl('photo.jpg')).toBe('/uploads/photo.jpg');
	});

	it('does NOT use /api/uploads path', () => {
		const result = imageUrl('photo.jpg');
		expect(result).not.toContain('/api/');
	});
});
