export type Token =
	| { type: 'mention'; value: string; href: `/${string}` }
	| { type: 'hashtag'; value: string; href: `/${string}` }
	| { type: 'url'; value: string; href: `http://${string}` | `https://${string}` }
	| { type: 'text'; value: string };

// Ordered alternation: mention, hashtag, url — everything else becomes text.
const TOKEN_RE = /(@[a-z0-9._]{3,30})|(#[A-Za-z0-9_]{1,50})|(https?:\/\/\S+)/gi;

function isHTTPURL(value: string): value is `http://${string}` | `https://${string}` {
	return value.startsWith('http://') || value.startsWith('https://');
}

export function linkify(text: string): Token[] {
	const tokens: Token[] = [];
	let lastIndex = 0;
	let match: RegExpExecArray | null;

	TOKEN_RE.lastIndex = 0;

	while ((match = TOKEN_RE.exec(text)) !== null) {
		const [full, mention, hashtag, url] = match;

		if (match.index > lastIndex) {
			tokens.push({ type: 'text', value: text.slice(lastIndex, match.index) });
		}

		if (mention) {
			const username = mention.slice(1).toLowerCase();
			tokens.push({ type: 'mention', value: mention, href: `/@${username}` });
		} else if (hashtag) {
			const tag = hashtag.slice(1).toLowerCase();
			tokens.push({ type: 'hashtag', value: hashtag, href: `/search?q=%23${tag}` });
		} else if (url && isHTTPURL(full)) {
			tokens.push({ type: 'url', value: full, href: full });
		}

		lastIndex = match.index + full.length;
	}

	if (lastIndex < text.length) {
		tokens.push({ type: 'text', value: text.slice(lastIndex) });
	}

	return tokens;
}
