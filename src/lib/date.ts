export const formatDateTime = (
  value: string
) => {
  return new Date(value).toLocaleString(
    "en-GB",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }
  );
};