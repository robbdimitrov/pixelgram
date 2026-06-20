import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = ({ cookies }) => {
	const theme = cookies.get('theme') ?? 'light';
	return { theme };
};
