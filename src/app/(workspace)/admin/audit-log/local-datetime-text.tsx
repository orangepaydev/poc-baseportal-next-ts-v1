'use client';

type LocalDateTimeTextProps = {
  value: string;
};

const browserDateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
});

function formatBrowserDateTime(value: string) {
  // Attempt to parse the value as a UTC date-time string. If parsing fails, return the original value.
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return browserDateTimeFormatter.format(date);
}

export function LocalDateTimeText({ value }: LocalDateTimeTextProps) {
  return <>{formatBrowserDateTime(value)}</>;
}
