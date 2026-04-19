import { FastifyInstance } from 'fastify';

import { writeFile, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';

import { HarmCategory, HarmBlockThreshold } from '@google/genai';

import {
  ChartConfig,
  chartConfigSchema,
} from '../commons/schemas/chartConfig.schema.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const cwd = process.cwd();

class GeminiService {
  async generate(
    fastify: FastifyInstance,
    prompt: string,
    memory: ChartConfig | null,
    thinkingMode: boolean,
  ): Promise<ChartConfig> {
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

    const safetySettings = [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
      },
    ];

    const response = await fastify.gemini.models
      .generateContent({
        model,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          // responseJsonSchema
          responseMimeType: 'application/json',
          safetySettings: safetySettings,
        },
        contents: [
          {
            role: 'user',
            parts: [{ text: promptText }],
          },
        ],
      })
      .catch((error) => {
        console.log(error);
        if (error.status === 429) {
          throw fastify.httpErrors.tooManyRequests(
            'The AI Chart Generator is currently experiencing high demand. Please wait a moment and try again.',
          );
        }
        throw error;
      });

    if (
      response.candidates &&
      response.candidates[0].finishReason === 'SAFETY'
    ) {
      await writeFile(
        `${cwd}/safetyBlock.json`,
        JSON.stringify(response.candidates[0]),
        'utf8',
      );
      throw fastify.httpErrors.badRequest(
        'Unable to generate chart: The request violates content safety guidelines.',
      );
    }

    const usage = response.usageMetadata;

    const raw = response.text ?? '';
    const cleaned = raw.replace(/```json|```/g, '').trim();
    let rawJson;
    try {
      rawJson = JSON.parse(cleaned);
    } catch {
      throw fastify.httpErrors.badGateway(
        'The AI generated invalid syntax. Please try again.',
      );
    }

    const validationResult = chartConfigSchema.safeParse(rawJson);

    if (!validationResult.success) {
      throw fastify.httpErrors.badGateway(
        'The AI generated an invalid chart configuration. Please try again.',
      );
    }

    const chartData = validationResult.data;

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
