import { Pagination, PaginationQuery } from '../types';

function isValidEmail(email: string) {
  const regex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
  return regex.test(email);
}

function parsePagination(query: PaginationQuery): Pagination | undefined {
  const limit = query.limit === undefined ? 10 : Number(query.limit);
  const page = query.page === undefined ? 0 : Number(query.page);

  if (!Number.isInteger(limit) || !Number.isInteger(page) || page < 0 || limit < 1) {
    return undefined;
  }

  return {
    page,
    limit: Math.min(limit, 50)
  };
}

export {
  isValidEmail,
  parsePagination
};
