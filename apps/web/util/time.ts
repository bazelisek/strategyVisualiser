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

export const formatLocalDate = (value: number | string | Date) => {
  const date = toDate(value);
  if (Number.isNaN(date.getTime())) return "Invalid date";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const formatLocalDateTime = (value: number | string | Date) => {
  const date = toDate(value);
  if (Number.isNaN(date.getTime())) return "Invalid date";
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
};
