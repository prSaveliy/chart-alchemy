import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Plus, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChartCard } from "@/components/ui/chart-card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DashboardEmptyState } from "@/components/ui/dashboard-empty-state";
import { DashboardNoMatchState } from "@/components/ui/dashboard-no-match-state";
import { Header2 } from "@/components/layout/header2";
import { Error } from "./error";

import { handleUnauthorized } from "@/lib/handleUnauthorized";
import chartService from "@/services/chartService";

import defaultUserPicture from "@/assets/user.png";

import type { ChartSummary } from "@/commons/interfaces/chartInterfaces";

export const Dashboard = () => {
  const navigate = useNavigate();
  const retriedRef = useRef(false);
  const userPicture = localStorage.getItem("picture");

  const [charts, setCharts] = useState<ChartSummary[] | null>(null);
  const [query, setQuery] = useState("");

  const [networkError, setNetworkError] = useState(false);
  const [serverError, setServerError] = useState(false);
  const [tooManyRequestsError, setTooManyRequestsError] = useState(false);

  const [pendingDeleteToken, setPendingDeleteToken] = useState<string | null>(null);
  const [deletingToken, setDeletingToken] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState("");

  const fetchCharts = async () => {
    const fetchResult = await chartService.list();

    if (fetchResult.errorMessage) {
      if (!retriedRef.current && fetchResult.statusCode === 401) {
        await handleUnauthorized(retriedRef, navigate, fetchCharts);
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

      return;
    }

    setCharts(fetchResult.data?.charts ?? []);
  };

  useEffect(() => {
    fetchCharts();
  }, []);

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
        setCharts(prev => prev?.filter(c => c.token !== token) ?? null);
        setDeleteError("");
      } else {
        setDeleteError(result.errorMessage);
      }
      setDeletingToken(null);
      setPendingDeleteToken(null);
      return;
    }

    setDeleteError("");
    setCharts(prev => prev?.filter(c => c.token !== token) ?? null);
    setDeletingToken(null);
    setPendingDeleteToken(null);
  };

  const pendingDeleteName = pendingDeleteToken
    ? (charts?.find(c => c.token === pendingDeleteToken)?.name ||
        "Untitled chart")
    : "";

  const filtered = useMemo(() => {
    if (!charts) return [];
    const q = query.trim().toLowerCase();
    if (!q) return charts;
    return charts.filter(chart => chart.name.toLowerCase().includes(q));
  }, [charts, query]);

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
              value={query}
              onChange={event => setQuery(event.target.value)}
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
            <DashboardEmptyState onCreate={() => navigate("/new-chart")} />
          ) : filtered.length === 0 ? (
            <DashboardNoMatchState query={query} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(chart => (
                <ChartCard
                  key={chart.token}
                  chart={chart}
                  onClick={() => navigate(`/chart/${chart.token}`)}
                  onDelete={() => setPendingDeleteToken(chart.token)}
                  deleting={deletingToken === chart.token}
                />
              ))}
            </div>
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
