import fetchClient from "@/lib/fetchClient";

class ChartService {
  async generate(prompt: string) {
   return await fetchClient.post('gemini/generate', { prompt });
  }
}

export default new ChartService();
