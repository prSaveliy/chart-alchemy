import fetchClient from "@/lib/fetchClient";

class ChartService {
  async init(chartType: "ai" | "dataset" | "manual") {
    return await fetchClient.post("chart/init", { chartType });
  }

  async verifyToken(token: string) {
    return await fetchClient.post("chart/verify-token", { token });
  }

  async generate(
    prompt: string,
    name: string,
    token: string,
    memory: any | null,
    thinkingMode: boolean,
  ) {
    return await fetchClient.post("chart/generate", {
      prompt,
      name,
      token,
      memory,
      thinkingMode: thinkingMode ? "true" : "false",
    });
  }

  async getByToken(token: string) {
    return await fetchClient.get(`chart/${token}`);
  }
}

export default new ChartService();
