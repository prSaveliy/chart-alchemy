import { FastifyInstance } from 'fastify';

import { writeFile, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PROMPT_TEMPLATE = await readFile(
  join(__dirname, '../prompts/chart-generation.prompt.txt'),
  'utf8',
);

class GeminiService {
  async generate(
    fastify: FastifyInstance,
    prompt: string,
  ) {
    const fullPrompt = PROMPT_TEMPLATE.replace('{{USER_PROMPT}}', prompt);

    const response = await fastify.gemini.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: fullPrompt,
    });
    const usage = response.usageMetadata;

    const raw = response.text ?? '';
    const cleaned = raw.replace(/```json|```/g, '').trim();
    const chartData = JSON.parse(cleaned);

    const cwd = process.cwd();
    await writeFile(`${cwd}/geminiResponse.json`, cleaned, 'utf8');
    await writeFile(
      `${cwd}/metadata.txt`,
      JSON.stringify(usage ?? null, null, 2),
      'utf8',
    );

    return chartData;
  }
}

export default new GeminiService();
