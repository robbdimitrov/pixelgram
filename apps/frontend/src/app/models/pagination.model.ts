export interface CursorPage<T> {
  items: T[];
  nextCursor: string | null;
}
