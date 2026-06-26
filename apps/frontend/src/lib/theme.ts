export const THEME_MODES = ['system', 'light', 'dark'] as const;

export type ThemeMode = (typeof THEME_MODES)[number];
export type ResolvedTheme = Exclude<ThemeMode, 'system'>;

export function parseTheme(value: string | undefined): ThemeMode {
	return THEME_MODES.find((theme) => theme === value) ?? 'system';
}
