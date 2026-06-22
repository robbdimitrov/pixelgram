import type { ParamMatcher } from '@sveltejs/kit';

// Matches @username segments (e.g. @johndoe). The @ is part of the URL.
export const match: ParamMatcher = (param) => {
	return /^@[a-z0-9._]{3,30}$/.test(param);
};
