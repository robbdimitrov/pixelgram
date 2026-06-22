export function pluralize(value: number, singular: string, plural?: string): string {
	const count = value || 0;
	if (count === 1) return singular;
	return plural ?? singular + 's';
}
