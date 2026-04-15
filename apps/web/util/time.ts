const normalizeTimestampString = (value: string) =>
  value.replace(/\.(\d{3})\d+/, ".$1");

const toDate = (value: number | string | Date) => {
  if (value instanceof Date) {
    return value;
  }

  if (typeof value === "number") {
    return new Date(value * 1000);
  }

  const trimmedValue = value.trim();
  if (!trimmedValue) {
    return new Date(Number.NaN);
  }

  if (/^\d+$/.test(trimmedValue)) {
    return new Date(Number(trimmedValue) * 1000);
  }

  return new Date(normalizeTimestampString(trimmedValue));
};

export const formatLocalDateTime = (value: number | string | Date) => {
  const date = toDate(value);
  if (Number.isNaN(date.getTime())) return "Invalid date";
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
};
