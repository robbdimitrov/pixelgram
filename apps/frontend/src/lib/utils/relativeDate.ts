const formatters: Partial<Record<string, Intl.RelativeTimeFormat>> = {};

function getFormatter(style: 'long' | 'short' | 'narrow') {
  return (formatters[style] ??= new Intl.RelativeTimeFormat('en', { numeric: 'auto', style }));
}

export function relativeDate(value: Date | string, style: 'long' | 'short' | 'narrow' = 'narrow'): string {
  const date = new Date(value);
  const seconds = Math.round((date.getTime() - Date.now()) / 1000);
  const absoluteSeconds = Math.abs(seconds);

  if (absoluteSeconds < 5) return 'now';

  const divisions = [
    { amount: 60, name: 'second' },
    { amount: 60, name: 'minute' },
    { amount: 24, name: 'hour' },
    { amount: 7, name: 'day' },
    { amount: 4.34524, name: 'week' },
    { amount: 12, name: 'month' },
    { amount: Number.POSITIVE_INFINITY, name: 'year' }
  ] as const;

  const formatter = getFormatter(style);
  let duration = seconds;
  for (const division of divisions) {
    if (Math.abs(duration) < division.amount) {
      return formatter.format(Math.round(duration), division.name);
    }
    duration /= division.amount;
  }

  return formatter.format(Math.round(duration), 'year');
}
