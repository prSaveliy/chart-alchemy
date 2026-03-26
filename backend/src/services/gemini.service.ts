import { FastifyInstance } from 'fastify';

import { writeFile } from 'node:fs/promises';

class GeminiService {
  async generate(fastify: FastifyInstance, prompt: string) {
    const fullPrompt = `
      You are an API to generate charts using Apache Echarts.

      Rules: 
      Don't send anything except chart configurations.
      You should return an object containing properties needed for ReactECharts component

      User's prompt:
      ${prompt}
    `;

    const response = await fastify.gemini.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: fullPrompt,
    });
    const usage = response.usageMetadata;

    const cleaned = response.text.replace(/```json|```/g, '').trim();
    const chartData = JSON.parse(cleaned);

    const cwd = process.cwd();
    await writeFile(`${cwd}/geminiResponse.json`, cleaned, 'utf8');
    await writeFile(`${cwd}/metadata.txt`, JSON.stringify(usage ?? null, null, 2), 'utf8');

    return { chartData };
  }
}

export default new GeminiService();
