import { browser } from '$app/environment';
import { writable } from 'svelte/store';

function readCookieTheme(): string {
	if (!browser) return 'light';
	const m = document.cookie.match(/(?:^|;)\s*theme=([^;]+)/);
	return m?.[1] ?? 'light';
}

function createTheme() {
	const { subscribe, set: _set } = writable(readCookieTheme());

	function set(value: string) {
		_set(value);
		if (browser) {
			document.documentElement.setAttribute('data-theme', value);
			const secure = location.protocol === 'https:' ? '; Secure' : '';
			document.cookie = `theme=${value}; path=/; max-age=31536000; samesite=lax${secure}`;
		}
	}

	return { subscribe, set };
}

export const theme = createTheme();
