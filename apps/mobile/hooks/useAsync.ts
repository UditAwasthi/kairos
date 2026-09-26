import { useCallback, useEffect, useRef, useState } from 'react';

const queryCache = new Map<string, unknown>();

export function readQueryCache<T>(key: string): T | null {
  return (queryCache.get(key) as T | undefined) ?? null;
}

export function writeQueryCache<T>(key: string, value: T) {
  queryCache.set(key, value);
}

type AsyncResult<T> = {
  data: T | null;
  error: string | null;
  /** True only while the first load is in flight (no data yet). */
  loading: boolean;
  /** True while refreshing with existing data still on screen. */
  refreshing: boolean;
  reload: () => void;
};

type UseAsyncOptions = {
  /**
   * When this key changes (e.g. route id), drop previous data and show the
   * skeleton instead of briefly painting the wrong entity.
   */
  resetKey?: string | number | null;
  /** Keep last successful payload so revisiting a screen does not flash. */
  cacheKey?: string;
};

/**
 * Async loader that keeps previous data visible during reloads / soft deps changes.
 * Screens should gate the skeleton on `loading` (not `refreshing`).
 */
export function useAsync<T>(
  loader: () => Promise<T>,
  deps: unknown[] = [],
  options: UseAsyncOptions = {},
): AsyncResult<T> {
  const { resetKey, cacheKey } = options;
  const cached = cacheKey
    ? readQueryCache<T>(resetKey != null ? `${cacheKey}:${resetKey}` : cacheKey) ??
      (resetKey != null ? null : readQueryCache<T>(cacheKey))
    : null;
  const [data, setData] = useState<T | null>(cached);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(cached == null);
  const [refreshing, setRefreshing] = useState(false);
  const [tick, setTick] = useState(0);
  const dataRef = useRef<T | null>(cached);
  const resetKeyRef = useRef(resetKey);
  const loaderRef = useRef(loader);
  loaderRef.current = loader;
  dataRef.current = data;

  const reload = useCallback(() => setTick((t) => t + 1), []);
  const valueDeps = deps.filter((value) => typeof value !== 'function');

  useEffect(() => {
    let cancelled = false;
    const keyChanged =
      resetKey !== undefined && resetKeyRef.current !== resetKey;
    resetKeyRef.current = resetKey;

    if (keyChanged) {
      const nextCached =
        cacheKey && resetKey != null
          ? readQueryCache<T>(`${cacheKey}:${resetKey}`)
          : cacheKey
            ? readQueryCache<T>(cacheKey)
            : null;
      dataRef.current = nextCached;
      setData(nextCached);
      setLoading(nextCached == null);
      setRefreshing(nextCached != null);
    } else if (dataRef.current !== null) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    void loaderRef
      .current()
      .then((result) => {
        if (cancelled) return;
        dataRef.current = result;
        setData(result);
        setError(null);
        setLoading(false);
        setRefreshing(false);
        if (cacheKey) {
          writeQueryCache(cacheKey, result);
          if (resetKey != null) writeQueryCache(`${cacheKey}:${resetKey}`, result);
        }
      })
      .catch(() => {
        if (cancelled) return;
        setError('Unable to load data.');
        setLoading(false);
        setRefreshing(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, resetKey, cacheKey, ...valueDeps]);

  return { data, error, loading, refreshing, reload };
}
