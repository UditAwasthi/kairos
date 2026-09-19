import { useCallback, useEffect, useRef, useState } from 'react';

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
  const { resetKey } = options;
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tick, setTick] = useState(0);
  const dataRef = useRef<T | null>(null);
  const resetKeyRef = useRef(resetKey);
  dataRef.current = data;

  const reload = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;
    const keyChanged =
      resetKey !== undefined && resetKeyRef.current !== resetKey;
    resetKeyRef.current = resetKey;

    if (keyChanged) {
      dataRef.current = null;
      setData(null);
      setLoading(true);
      setRefreshing(false);
    } else if (dataRef.current !== null) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    void loader()
      .then((result) => {
        if (!cancelled) {
          setData(result);
          setError(null);
          setLoading(false);
          setRefreshing(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError('Unable to load data.');
          setLoading(false);
          setRefreshing(false);
        }
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, resetKey, ...deps]);

  return { data, error, loading, refreshing, reload };
}
