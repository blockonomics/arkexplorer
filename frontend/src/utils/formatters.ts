
/**
 * Formats a Unix timestamp into a human-readable date.
 * @param timestamp - Unix timestamp in seconds
 */
export const formatDate = (timestamp: number): string => {
  // If your Go backend sends milliseconds, remove the * 1000
  return new Date(timestamp * 1000).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

/**
 * Formats a number into a BTC string with standard decimal places.
 */
export const formatBTC = (value: number): string =>
  new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 8,
  }).format(value);

/**
 * Formats large numbers into a compact 'k' or 'M' format for chart axes.
 */
export const formatCompactNumber = (value: number): string => {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    compactDisplay: "short",
  }).format(value);
};