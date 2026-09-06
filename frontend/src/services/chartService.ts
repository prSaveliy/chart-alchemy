import fetchClient from "@/lib/fetchClient";
import {
  DEFAULT_CHARTS_PER_PAGE,
  MAX_SEARCH_QUERY_LENGTH,
} from "@/commons/constants/pagination.constants";
import type { FetchResult } from "@/commons/interfaces/fetchInterfaces";
import type { ChartConfig } from "@/commons/schemas/chartConfig.schema";
import type {
  ChartListResponse,
  DatasetChartType,
} from "@/commons/interfaces/chartInterfaces";

export type ManualChartType =
  | "bar"
  | "line"
  | "area"
  | "pie"
  | "scatter"
  | "radar";

class ChartService {
  async init(chartType: "ai" | "manual" | "dataset") {
    return await fetchClient.post("chart/init", { chartType });
  }

  async list(
    page = 1,
    limit = DEFAULT_CHARTS_PER_PAGE,
    q?: string,
    signal?: AbortSignal,
  ): Promise<FetchResult<ChartListResponse>> {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    if (q && q.trim()) {
      params.set("q", q.trim().slice(0, MAX_SEARCH_QUERY_LENGTH));
    }
    return await fetchClient.get<ChartListResponse>(`chart?${params.toString()}`, { signal });
  }

  async verifyToken(token: string) {
    return await fetchClient.post("chart/verify-token", { token });
  }

  async generate(
    prompt: string,
    token: string,
    memory: boolean,
    thinkingMode: boolean,
  ) {
    return await fetchClient.post("chart/generate", {
      prompt,
      token,
      memory,
      thinkingMode,
    });
  }

  async rename(token: string, name: string) {
    return await fetchClient.patch("chart/rename", { token, name });
  }

  async getByToken(token: string) {
    return await fetchClient.get(`chart/${token}`);
  }

  async delete(token: string) {
    return await fetchClient.delete(`chart/${token}`);
  }

  async saveConfig(
    token: string,
    chartData: ChartConfig,
    manualType?: ManualChartType,
  ) {
    return await fetchClient.patch("chart/save-config", {
      token,
      chartData,
      ...(manualType ? { manualType } : {}),
    });
  }

  async uploadAndGenerateFromDataset(
    file: File,
    token: string,
    chartType: DatasetChartType,
    xField?: string,
    yField?: string,
  ) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("chartType", chartType);
    if (xField) formData.append("xField", xField);
    if (yField) formData.append("yField", yField);
    return await fetchClient.postFormData(
      `chart/upload-and-generate-from-dataset/${token}`,
      formData,
    );
  }

  async regenerateFromDataset(
    token: string,
    chartType: DatasetChartType,
    xField?: string,
    yField?: string,
  ) {
    return await fetchClient.post(
      `chart/regenerate-from-dataset/${token}`,
      {
        chartType,
        xField,
        yField,
      }
    );
  }

  async switchActiveVersion(token: string, versionId: number) {
    return await fetchClient.patch("chart/switch-active-version", {
      token,
      versionId,
    });
  }
}

export default new ChartService();
