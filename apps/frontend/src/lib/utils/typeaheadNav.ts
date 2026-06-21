export type TypeaheadAction = 'select' | 'clear' | 'none';

export function typeaheadNav(
	key: string,
	activeIndex: number,
	length: number
): { index: number; action: TypeaheadAction } {
	if (length === 0) return { index: activeIndex, action: 'none' };
	switch (key) {
		case 'ArrowDown':
			return { index: (activeIndex + 1) % length, action: 'none' };
		case 'ArrowUp':
			return { index: (activeIndex - 1 + length) % length, action: 'none' };
		case 'Enter':
			return { index: activeIndex, action: 'select' };
		case 'Escape':
			return { index: 0, action: 'clear' };
		default:
			return { index: activeIndex, action: 'none' };
	}
}
