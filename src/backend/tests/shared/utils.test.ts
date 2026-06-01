import { isValidEmail, parsePagination } from '../../src/shared/utils';

describe('isValidEmail', () => {
  it('should return true for valid emails', () => {
    expect(isValidEmail('test@example.com')).toBe(true);
    expect(isValidEmail('user.name+tag@domain.co.uk')).toBe(true);
  });

  it('should return false for invalid emails', () => {
    expect(isValidEmail('testexample.com')).toBe(false);
    expect(isValidEmail('test@example')).toBe(false);
    expect(isValidEmail('@example.com')).toBe(false);
    expect(isValidEmail('test@.com')).toBe(false);
    expect(isValidEmail('test@example.')).toBe(false);
    expect(isValidEmail('test@ex ample.com')).toBe(false);
    expect(isValidEmail('test @example.com')).toBe(false);
  });
});

describe('parsePagination', () => {
  it('should return default values if query is empty', () => {
    expect(parsePagination({})).toEqual({ limit: 10, page: 0 });
  });

  it('should parse valid limit and page strings', () => {
    expect(parsePagination({ limit: '20', page: '2' })).toEqual({ limit: 20, page: 2 });
  });

  it('should parse valid limit and page numbers', () => {
    expect(parsePagination({ limit: 20, page: 2 })).toEqual({ limit: 20, page: 2 });
  });

  it('should cap the limit at 50', () => {
    expect(parsePagination({ limit: '100', page: '2' })).toEqual({ limit: 50, page: 2 });
  });

  it('should return undefined for invalid limit or page', () => {
    expect(parsePagination({ limit: 'abc', page: '2' })).toBeUndefined();
    expect(parsePagination({ limit: '10', page: 'abc' })).toBeUndefined();
    expect(parsePagination({ limit: '10.5', page: '2' })).toBeUndefined();
    expect(parsePagination({ limit: '10', page: '2.5' })).toBeUndefined();
    expect(parsePagination({ limit: '-5', page: '2' })).toBeUndefined();
    expect(parsePagination({ limit: '10', page: '-2' })).toBeUndefined();
    expect(parsePagination({ limit: '0', page: '2' })).toBeUndefined(); // limit < 1
  });
});
