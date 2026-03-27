import fetchClient from "@/lib/fetchClient";

class ChartService {
  async init(chartType: "ai" | "dataset" | "manual") {
    return await fetchClient.post("chart/init", { chartType });
  }

  async verifyToken(token: string) {
    return await fetchClient.post("chart/verify-token", { token });
  }

  async generate(prompt: string, name: string, token: string) {
    return await fetchClient.post("chart/generate", { prompt, name, token });
  }
}

export default new ChartService();
