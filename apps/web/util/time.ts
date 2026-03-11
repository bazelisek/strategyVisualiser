export const formatLocalDateTime = (unixSeconds: number) => {
  const date = new Date(unixSeconds * 1000);
  if (Number.isNaN(date.getTime())) return "Invalid date";
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
};