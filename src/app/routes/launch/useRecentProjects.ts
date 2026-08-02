import { useCallback, useEffect, useState } from "react";
import { errorMessage } from "./errorMessage";
import { listRecentProjects } from "./ppsxIpc";
import { RecentEntryMetaSchema, type RecentEntryMeta } from "./recentEntry";

interface UseRecentProjectsResult {
  entries: RecentEntryMeta[];
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

/**
 * Cached rows that no longer match `RecentEntryMeta`'s shape (an older
 * build's cache, disk corruption) are dropped rather than surfaced as an
 * error — this list is a disposable cache (D-60), and one bad row must not
 * blank the whole launch screen.
 */
export function useRecentProjects(): UseRecentProjectsResult {
  const [entries, setEntries] = useState<RecentEntryMeta[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    listRecentProjects()
      .then((raw) => {
        if (cancelled) return;
        const valid = raw.filter((entry) => RecentEntryMetaSchema.safeParse(entry).success);
        setEntries(valid);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(errorMessage(err));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [refreshToken]);

  const refresh = useCallback(() => setRefreshToken((token) => token + 1), []);

  return { entries, isLoading, error, refresh };
}
