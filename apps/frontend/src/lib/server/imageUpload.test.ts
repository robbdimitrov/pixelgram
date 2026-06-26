import { describe, expect, it } from 'vitest';
import { validateImageUpload } from './imageUpload';

describe('validateImageUpload', () => {
	it('accepts supported images up to 1 MB', () => {
		const file = new File([new Uint8Array(1024 * 1024)], 'image.jpg', { type: 'image/jpeg' });

		expect(validateImageUpload(file, 'Required')).toEqual({ ok: true, file });
	});

	it('rejects missing or empty files', () => {
		expect(validateImageUpload(null, 'Required')).toEqual({
			ok: false,
			status: 400,
			error: 'Required'
		});
		expect(
			validateImageUpload(new File([], 'empty.jpg', { type: 'image/jpeg' }), 'Required')
		).toEqual({
			ok: false,
			status: 400,
			error: 'Required'
		});
	});

	it('rejects files larger than 1 MB', () => {
		const file = new File([new Uint8Array(1024 * 1024 + 1)], 'large.jpg', {
			type: 'image/jpeg'
		});

		expect(validateImageUpload(file, 'Required')).toEqual({
			ok: false,
			status: 413,
			error: 'Image must be smaller than 1 MB.'
		});
	});

	it('rejects unsupported MIME types', () => {
		const file = new File(['%PDF'], 'document.pdf', { type: 'application/pdf' });

		expect(validateImageUpload(file, 'Required')).toEqual({
			ok: false,
			status: 400,
			error: 'Please select a JPEG, PNG, GIF, or WEBP image.'
		});
	});
});
