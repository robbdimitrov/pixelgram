import { getContext, setContext } from 'svelte';
import { parseTheme, type ResolvedTheme, type ThemeMode } from '$lib/theme';

const THEME_CONTEXT = Symbol('theme');
const STORAGE_KEY = 'theme';
const DARK_MODE_QUERY = '(prefers-color-scheme: dark)';
const COOKIE_MAX_AGE = 31_536_000;

export interface ThemeController {
	readonly mode: ThemeMode;
	readonly resolved: ResolvedTheme;
	set: (mode: ThemeMode) => void;
	start: () => () => void;
}

export function setThemeContext(initialMode: () => ThemeMode): ThemeController {
	const controller = createTheme(initialMode());
	setContext(THEME_CONTEXT, controller);
	return controller;
}

export function getThemeContext(): ThemeController {
	const controller = getContext<ThemeController | undefined>(THEME_CONTEXT);
	if (!controller) throw new Error('Theme context is unavailable');
	return controller;
}

function createTheme(initialMode: ThemeMode): ThemeController {
	let mode = $state(initialMode);
	let systemTheme = $state<ResolvedTheme>('light');
	const resolved = $derived(mode === 'system' ? systemTheme : mode);

	function apply(): void {
		document.documentElement.dataset.theme = resolved;
	}

	function set(nextMode: ThemeMode): void {
		mode = nextMode;
		if (nextMode === 'system') {
			localStorage.removeItem(STORAGE_KEY);
		} else {
			localStorage.setItem(STORAGE_KEY, nextMode);
		}
		const secure = location.protocol === 'https:' ? '; Secure' : '';
		document.cookie = `${STORAGE_KEY}=${nextMode}; Path=/; Max-Age=${COOKIE_MAX_AGE}; SameSite=Lax${secure}`;
		apply();
	}

	function start(): () => void {
		const media = window.matchMedia(DARK_MODE_QUERY);
		systemTheme = media.matches ? 'dark' : 'light';
		if (mode === 'system') {
			localStorage.removeItem(STORAGE_KEY);
		} else {
			localStorage.setItem(STORAGE_KEY, mode);
		}
		apply();

		const handleSystemThemeChange = (event: MediaQueryListEvent) => {
			systemTheme = event.matches ? 'dark' : 'light';
			if (mode === 'system') apply();
		};
		const handleStorage = (event: StorageEvent) => {
			if (event.key !== STORAGE_KEY) return;
			mode = parseTheme(event.newValue ?? undefined);
			apply();
		};

		media.addEventListener('change', handleSystemThemeChange);
		window.addEventListener('storage', handleStorage);
		return () => {
			media.removeEventListener('change', handleSystemThemeChange);
			window.removeEventListener('storage', handleStorage);
		};
	}

	return {
		get mode() {
			return mode;
		},
		get resolved() {
			return resolved;
		},
		set,
		start
	};
}
