import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import chartService from "@/services/chartService";
import { handleUnauthorized } from "@/lib/handleUnauthorized";
import { DEFAULT_CHARTS_PER_PAGE } from "@/commons/constants/pagination.constants";
import type {
  ChartSummary,
  PaginationMeta,
} from "@/commons/interfaces/chartInterfaces";

export interface UsePaginatedChartsOptions {
  page: number;
  query?: string;
  limit?: number;
}

export interface UsePaginatedChartsReturn {
  charts: ChartSummary[] | null;
  pagination: PaginationMeta | null;
  isLoading: boolean;
  networkError: boolean;
  serverError: boolean;
  tooManyRequestsError: boolean;
  refresh: () => void;
}

/**
 * Custom hook for fetching and managing paginated chart data.
 *
 * Handles:
 * - Loading and pagination states
 * - Error normalization (500, 429, network)
 * - Request cancellation via AbortController on rapid parameter changes
 * - Automatic 401 token refresh retry via handleUnauthorized
 * - BFCache (Back/Forward Cache) invalidation via window pageshow
 */
export function usePaginatedCharts({
  page,
  query = "",
  limit = DEFAULT_CHARTS_PER_PAGE,
}: UsePaginatedChartsOptions): UsePaginatedChartsReturn {
  const navigate = useNavigate();
  const retriedRef = useRef(false);

  const [charts, setCharts] = useState<ChartSummary[] | null>(null);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [networkError, setNetworkError] = useState(false);
  const [serverError, setServerError] = useState(false);
  const [tooManyRequestsError, setTooManyRequestsError] = useState(false);

  const [refreshKey, setRefreshKey] = useState(0);
  const triggerRefresh = useCallback(() => setRefreshKey(k => k + 1), []);

  useEffect(() => {
    const controller = new AbortController();

    const loadCharts = async () => {
      setIsLoading(true);
      const fetchResult = await chartService.list(
        page,
        limit,
        query,
        controller.signal,
      );

      if (fetchResult.isAborted) {
        return;
      }

      if (fetchResult.errorMessage) {
        if (!retriedRef.current && fetchResult.statusCode === 401) {
          await handleUnauthorized(retriedRef, navigate, loadCharts);
          setIsLoading(false);
          return;
        }

        const errors: Record<number, () => void> = {
          500: () => setServerError(true),
          429: () => setTooManyRequestsError(true),
        };

        if (fetchResult.statusCode && fetchResult.statusCode in errors) {
          errors[fetchResult.statusCode]();
        } else {
          setNetworkError(true);
        }

        setIsLoading(false);
        return;
      }

      retriedRef.current = false;
      setNetworkError(false);
      setServerError(false);
      setTooManyRequestsError(false);
      setCharts(fetchResult.data?.charts ?? []);
      setPagination(fetchResult.data?.pagination ?? null);
      setIsLoading(false);
    };

    loadCharts();

    return () => {
      controller.abort();
    };
  }, [page, query, limit, refreshKey, navigate]);

  // Refresh list if restored from browser BFCache
  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        triggerRefresh();
      }
    };
    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, [triggerRefresh]);

  return {
    charts,
    pagination,
    isLoading,
    networkError,
    serverError,
    tooManyRequestsError,
    refresh: triggerRefresh,
  };
}

export default usePaginatedCharts;
