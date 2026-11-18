'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { demoService } from '@/services/demo.service';
import { errorMessage } from '@/services/errors';
import type { ApiEnvelope } from '@/types/domain';

export interface ApiState<T> {
  data: T | undefined;
  meta: ApiEnvelope<T>['meta'];
  error: string | null;
  loading: boolean;
  reload: () => void;
}

/**
 * Fetches on mount and whenever `deps` change. Refetches automatically after "Reset demo data".
 * Responses that arrive after a newer request has started are ignored.
 */
export function useApi<T>(fetcher: () => Promise<ApiEnvelope<T>>, deps: React.DependencyList = []): ApiState<T> {
  const [data, setData] = useState<T>();
  const [meta, setMeta] = useState<ApiEnvelope<T>['meta']>();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const seq = useRef(0);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const run = useCallback(() => {
    const id = ++seq.current;
    setLoading(true);
    setError(null);
    fetcherRef
      .current()
      .then((res) => {
        if (id !== seq.current) return;
        setData(res.data);
        setMeta(res.meta);
      })
      .catch((e) => {
        if (id === seq.current) setError(errorMessage(e));
      })
      .finally(() => {
        if (id === seq.current) setLoading(false);
      });
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(run, deps);
  useEffect(() => demoService.subscribe(run), [run]);

  return { data, meta, error, loading, reload: run };
}
