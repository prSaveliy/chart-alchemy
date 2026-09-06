import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { Plus, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChartCard } from "@/components/ui/chart-card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DashboardEmptyState } from "@/components/ui/dashboard-empty-state";
import { DashboardNoMatchState } from "@/components/ui/dashboard-no-match-state";
import { Header2 } from "@/components/layout/header2";
import { Pagination } from "@/components/ui/pagination";
import { Error } from "./error";

import { handleUnauthorized } from "@/lib/handleUnauthorized";
import { cn } from "@/lib/utils";
import { useSearchParam } from "@/hooks/useSearchParam";
import { usePaginatedCharts } from "@/hooks/usePaginatedCharts";
import chartService from "@/services/chartService";

import defaultUserPicture from "@/assets/user.png";

import { MAX_SEARCH_QUERY_LENGTH } from "@/commons/constants/pagination.constants";

export const Dashboard = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const retriedRef = useRef(false);
  const userPicture = localStorage.getItem("picture");

  const pageParam = parseInt(searchParams.get("page") || "1", 10);
  const page = isNaN(pageParam) || pageParam < 1 ? 1 : pageParam;
  const { searchQuery, setSearchQuery, queryParam } = useSearchParam();
  const {
    charts,
    pagination,
    isLoading,
    networkError,
    serverError,
    tooManyRequestsError,
    refresh,
  } = usePaginatedCharts({ page, query: queryParam });

  const [pendingDeleteToken, setPendingDeleteToken] = useState<string | null>(null);
  const [deletingToken, setDeletingToken] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState("");

  // Scroll to top when page changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [page]);

  // Auto-correct out-of-bounds page requests (e.g. from bookmarked URLs)
  useEffect(() => {
    if (pagination && pagination.totalPages > 0 && page > pagination.totalPages) {
      setSearchParams(
        prev => {
          const next = new URLSearchParams(prev);
          next.set("page", String(pagination.totalPages));
          return next;
        },
        { replace: true },
      );
    }
  }, [pagination, page, setSearchParams]);

  const handlePageChange = (newPage: number) => {
    if (newPage === page || isLoading) return;
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.set("page", String(newPage));
      return next;
    }); // replace: false preserves page navigation in browser history
  };

  const confirmDelete = async (token: string) => {
    if (deletingToken) return;

    setDeletingToken(token);
    const result = await chartService.delete(token);

    if (result.errorMessage) {
      if (!retriedRef.current && result.statusCode === 401) {
        await handleUnauthorized(retriedRef, navigate, () => confirmDelete(token));
        setDeletingToken(null);
        return;
      }

      if (result.statusCode === 404) {
        setDeleteError("");
      } else {
        setDeleteError(result.errorMessage);
      }
      setDeletingToken(null);
      setPendingDeleteToken(null);
      refresh();
      return;
    }

    setDeleteError("");
    setDeletingToken(null);
    setPendingDeleteToken(null);

    // If the deleted chart was the only chart on page > 1, decrement page
    if (charts && charts.length === 1 && page > 1) {
      setSearchParams(prev => {
        const next = new URLSearchParams(prev);
        next.set("page", String(page - 1));
        return next;
      });
    } else {
      refresh();
    }
  };

  const pendingDeleteName = pendingDeleteToken
    ? (charts?.find(c => c.token === pendingDeleteToken)?.name ||
        "Untitled chart")
    : "";

  if (networkError) {
    return (
      <Error
        error="Something went wrong"
        secondaryMessage="A network error occurred while loading your charts."
      />
    );
  }

  if (serverError) {
    return (
      <Error
        error="Server Error"
        secondaryMessage="Something happened on our side. We are already working on it."
      />
    );
  }

  if (tooManyRequestsError) {
    return (
      <Error
        error="Too Many Requests"
        secondaryMessage="You have made too many requests in a short period of time. Please try again later."
      />
    );
  }

  if (charts === null) {
    return null;
  }

  return (
    <div className="flex flex-col w-full min-h-screen">
      <Header2 userPicture={userPicture || defaultUserPicture} />

      <div className="flex flex-1 justify-center px-4 sm:px-6 py-8 sm:py-12">
        <div className="flex flex-col w-full max-w-6xl">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6 sm:mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Your charts</h1>
              <p className="mt-2 text-sm text-gray-600">
                Browse, search, and open charts you have created.
              </p>
            </div>

            <Button
              className="cursor-pointer self-start sm:self-auto"
              onClick={() => navigate("/new-chart")}
            >
              <Plus strokeWidth={1.5} className="w-4 h-4" />
              New Chart
            </Button>
          </div>

          <div className="relative mb-8">
            <Search
              strokeWidth={1.5}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"
            />
            <Input
              type="search"
              placeholder="Search by chart name"
              value={searchQuery}
              maxLength={MAX_SEARCH_QUERY_LENGTH}
              onChange={event => setSearchQuery(event.target.value)}
              className="pl-9"
            />
          </div>

          {deleteError && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 flex items-start justify-between gap-3">
              <span className="text-sm text-red-700">{deleteError}</span>
              <button
                type="button"
                onClick={() => setDeleteError("")}
                className="text-red-500 hover:text-red-700 text-sm font-medium cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}

          {charts.length === 0 ? (
            queryParam ? (
              <DashboardNoMatchState query={queryParam} />
            ) : (
              <DashboardEmptyState onCreate={() => navigate("/new-chart")} />
            )
          ) : (
            <>
              <div
                className={cn(
                  "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 transition-opacity duration-150",
                  isLoading && "opacity-60 pointer-events-none",
                )}
              >
                {charts.map(chart => (
                  <ChartCard
                    key={chart.token}
                    chart={chart}
                    onClick={() => navigate(`/chart/${chart.token}`)}
                    onDelete={() => setPendingDeleteToken(chart.token)}
                    deleting={deletingToken === chart.token}
                  />
                ))}
              </div>

              {pagination && pagination.totalPages > 1 && (
                <Pagination
                  page={pagination.page}
                  totalPages={pagination.totalPages}
                  disabled={isLoading}
                  onPageChange={handlePageChange}
                />
              )}
            </>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={pendingDeleteToken !== null}
        onOpenChange={open => {
          if (!open && !deletingToken) setPendingDeleteToken(null);
        }}
        title="Delete chart?"
        description={`"${pendingDeleteName}" will be permanently deleted. This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        destructive
        loading={deletingToken !== null && deletingToken === pendingDeleteToken}
        onConfirm={() => {
          if (pendingDeleteToken) confirmDelete(pendingDeleteToken);
        }}
      />
    </div>
  );
};
