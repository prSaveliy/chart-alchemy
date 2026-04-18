import fetchClient from "@/lib/fetchClient";
import type { ChartConfig } from "@/commons/schemas/chartConfig.schema";

export type ManualChartType =
  | "bar"
  | "line"
  | "area"
  | "pie"
  | "scatter"
  | "radar";

class ChartService {
  async init(chartType: "ai" | "manual") {
    return await fetchClient.post("chart/init", { chartType });
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
}

export default new ChartService();
