import { describe, it, expect } from 'vitest';
import { linkify } from '$lib/utils/linkify';

describe('linkify', () => {
	it('returns a single text token for plain text', () => {
		expect(linkify('hello world')).toEqual([{ type: 'text', value: 'hello world' }]);
	});

	it('returns a mention token with correct href', () => {
		expect(linkify('@alice')).toEqual([{ type: 'mention', value: '@alice', href: '/@alice' }]);
	});

	it('lower-cases the mention href', () => {
		expect(linkify('@Alice')).toEqual([{ type: 'mention', value: '@Alice', href: '/@alice' }]);
	});

	it('returns a hashtag token with correct href', () => {
		expect(linkify('#cats')).toEqual([
			{ type: 'hashtag', value: '#cats', href: '/search?q=%23cats' }
		]);
	});

	it('lower-cases the hashtag href', () => {
		expect(linkify('#Cats')).toEqual([
			{ type: 'hashtag', value: '#Cats', href: '/search?q=%23cats' }
		]);
	});

	it('returns a url token for http://', () => {
		expect(linkify('http://example.com')).toEqual([
			{ type: 'url', value: 'http://example.com', href: 'http://example.com' }
		]);
	});

	it('returns a url token for https://', () => {
		expect(linkify('https://example.com')).toEqual([
			{ type: 'url', value: 'https://example.com', href: 'https://example.com' }
		]);
	});

	it('returns a text token for ftp:// (not a recognised url)', () => {
		expect(linkify('ftp://example.com')).toEqual([{ type: 'text', value: 'ftp://example.com' }]);
	});

	it('tokenises a mixed string with mention, hashtag, url, and plain text', () => {
		const result = linkify('Hey @bob check #news at https://example.com today');
		expect(result).toEqual([
			{ type: 'text', value: 'Hey ' },
			{ type: 'mention', value: '@bob', href: '/@bob' },
			{ type: 'text', value: ' check ' },
			{ type: 'hashtag', value: '#news', href: '/search?q=%23news' },
			{ type: 'text', value: ' at ' },
			{ type: 'url', value: 'https://example.com', href: 'https://example.com' },
			{ type: 'text', value: ' today' }
		]);
	});

	it('returns a text token for <script> input (no HTML injection)', () => {
		const result = linkify('<script>alert(1)</script>');
		expect(result).toEqual([{ type: 'text', value: '<script>alert(1)</script>' }]);
	});

	it('returns a text token for &amp; input', () => {
		expect(linkify('&amp;')).toEqual([{ type: 'text', value: '&amp;' }]);
	});
});
