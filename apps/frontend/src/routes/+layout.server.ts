import { parseTheme } from '$lib/theme';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = ({ cookies }) => {
	return { theme: parseTheme(cookies.get('theme')) };
};
