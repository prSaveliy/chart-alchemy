import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useDebounce } from "@/hooks/useDebounce";
import { MAX_SEARCH_QUERY_LENGTH } from "@/commons/constants/pagination.constants";

export interface UseSearchParamOptions {
  paramKey?: string;
  pageKey?: string;
  debounceMs?: number;
  maxLength?: number;
}

export interface UseSearchParamReturn {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  queryParam: string;
  clearSearch: () => void;
}

/**
 * Custom hook that manages search input state with debounced two-way synchronization
 * to URL search parameters.
 *
 * - Immediately updates local input state for a responsive UI.
 * - Debounces writes to URL search params to avoid cluttering browser history.
 * - Automatically resets pagination to page 1 whenever the query changes.
 * - Synchronizes local state when the URL changes externally (e.g. Back/Forward navigation).
 */
export function useSearchParam({
  paramKey = "q",
  pageKey = "page",
  debounceMs = 300,
  maxLength = MAX_SEARCH_QUERY_LENGTH,
}: UseSearchParamOptions = {}): UseSearchParamReturn {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryParam = (searchParams.get(paramKey) || "").slice(0, maxLength);

  const [searchQuery, setSearchQuery] = useState(queryParam);
  const debouncedSearchQuery = useDebounce(searchQuery, debounceMs);

  // Sync state when navigating back/forward via browser history
  useEffect(() => {
    const handlePopState = () => {
      const urlQuery = (
        new URLSearchParams(window.location.search).get(paramKey) || ""
      ).slice(0, maxLength);
      setSearchQuery(urlQuery);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [paramKey, maxLength]);

  // Sync debounced search input to URL searchParams
  useEffect(() => {
    const trimmed = debouncedSearchQuery.trim().slice(0, maxLength);
    if (trimmed !== queryParam) {
      setSearchParams(
        prev => {
          const next = new URLSearchParams(prev);
          if (trimmed) {
            next.set(paramKey, trimmed);
          } else {
            next.delete(paramKey);
          }
          if (pageKey) {
            next.set(pageKey, "1");
          }
          return next;
        },
        { replace: true }, // History hygiene: replace entry for debounced keystrokes
      );
    }
  }, [debouncedSearchQuery, queryParam, paramKey, pageKey, maxLength, setSearchParams]);

  const clearSearch = useCallback(() => {
    setSearchQuery("");
  }, []);

  return {
    searchQuery,
    setSearchQuery,
    queryParam,
    clearSearch,
  };
}

export default useSearchParam;
