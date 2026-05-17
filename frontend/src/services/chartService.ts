import fetchClient from "@/lib/fetchClient";
import type { ChartConfig } from "@/commons/schemas/chartConfig.schema";
import type { DatasetChartType } from "@/commons/interfaces/chartInterfaces";

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

  async list() {
    return await fetchClient.get("chart");
  }

  async verifyToken(token: string) {
    return await fetchClient.post("chart/verify-token", { token });
  }

  async generate(
    prompt: string,
    token: string,
    memory: ChartConfig | null,
    thinkingMode: boolean,
  ) {
    return await fetchClient.post("chart/generate", {
      prompt,
      token,
      memory,
      thinkingMode: thinkingMode ? "true" : "false",
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

}

export default new ChartService();
