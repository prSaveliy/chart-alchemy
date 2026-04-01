import { FastifyInstance } from 'fastify';

import { writeFile, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class GeminiService {
  async generate(
    fastify: FastifyInstance,
    prompt: string,
    memory: any | null,
    thinkingMode: boolean,
  ) {
    const SYSTEM_INSTRUCTION = await readFile(
      join(__dirname, '../prompts/system-instruction.txt'),
      'utf8',
    );

    let promptText = '';
    if (memory !== null && Object.keys(memory).length !== 0) {
      promptText += `CURRENT_CHART_CONFIG: ${JSON.stringify(memory)}\n\n`;
    }
    promptText += `USER_REQUEST: ${prompt}`;

    const model = thinkingMode
      ? 'gemini-3.1-pro-preview'
      : 'gemini-3-flash-preview';

    const response = await fastify.gemini.models.generateContent({
      model,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        // responseJsonSchema
        responseMimeType: 'application/json',
      },
      contents: [
        {
          role: 'user',
          parts: [{ text: promptText }],
        },
      ],
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
