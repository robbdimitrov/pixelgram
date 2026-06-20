export function imageUrl(value: string | null | undefined): string {
  if (!value || value.length === 0) {
    return '/assets/placeholder.svg';
  }
  return `/uploads/${value}`;
}
