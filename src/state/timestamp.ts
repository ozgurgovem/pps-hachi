/**
 * D-75: colon-free, UTC, millisecond-truncated — safe as a filename on
 * Windows (`:` is illegal there) and still lexicographically sortable as
 * long as every caller uses this same format.
 */
export function formatSnapshotTimestamp(date: Date): string {
  return date.toISOString().replace(/\.\d{3}Z$/, "Z").replace(/:/g, "");
}
