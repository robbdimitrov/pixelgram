import { describe, it, expect } from 'vitest';
import { typeaheadNav } from './typeaheadNav';

describe('typeaheadNav', () => {
	it('ArrowDown increments the index', () => {
		expect(typeaheadNav('ArrowDown', 0, 3)).toEqual({ index: 1, action: 'none' });
	});

	it('ArrowDown wraps from last to first', () => {
		expect(typeaheadNav('ArrowDown', 2, 3)).toEqual({ index: 0, action: 'none' });
	});

	it('ArrowUp decrements the index', () => {
		expect(typeaheadNav('ArrowUp', 2, 3)).toEqual({ index: 1, action: 'none' });
	});

	it('ArrowUp wraps from first to last', () => {
		expect(typeaheadNav('ArrowUp', 0, 3)).toEqual({ index: 2, action: 'none' });
	});

	it('Enter signals select at current index', () => {
		expect(typeaheadNav('Enter', 1, 3)).toEqual({ index: 1, action: 'select' });
	});

	it('Escape signals clear and resets index to 0', () => {
		expect(typeaheadNav('Escape', 2, 3)).toEqual({ index: 0, action: 'clear' });
	});

	it('returns none for unrecognised keys', () => {
		expect(typeaheadNav('Tab', 1, 3)).toEqual({ index: 1, action: 'none' });
	});

	it('returns none for any key when the list is empty', () => {
		expect(typeaheadNav('Enter', 0, 0)).toEqual({ index: 0, action: 'none' });
		expect(typeaheadNav('ArrowDown', 0, 0)).toEqual({ index: 0, action: 'none' });
	});
});
