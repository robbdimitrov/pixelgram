import { browser } from '$app/environment';
import { writable } from 'svelte/store';

function createTheme(initial: string) {
	const { subscribe, set: _set } = writable(initial);

	function set(value: string) {
		_set(value);
		if (browser) {
			document.documentElement.setAttribute('data-theme', value);
			document.cookie = `theme=${value}; path=/; max-age=31536000; samesite=lax`;
			try { localStorage.setItem('theme', value); } catch { /* ignore */ }
		}
	}

	return { subscribe, set };
}

export const theme = createTheme('light');
