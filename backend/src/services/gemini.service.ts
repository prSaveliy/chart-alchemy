import { FastifyInstance } from 'fastify';

import { writeFile, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';

import { GoogleAuth } from 'google-auth-library';

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

    const project = fastify.config.GOOGLE_CLOUD_PROJECT;
    const location = fastify.config.GOOGLE_CLOUD_LOCATION;
    const host = location === 'global'
      ? 'aiplatform.googleapis.com'
      : `${location}-aiplatform.googleapis.com`;
    const url = `https://${host}/v1/projects/${project}/locations/${location}/publishers/google/models/${model}:generateContent`;

    const auth = new GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    });
    const accessToken = await auth.getAccessToken();
    const authHeaders = { Authorization: `Bearer ${accessToken}` };

    const requestBody = {
      systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
      contents: [{ role: 'user', parts: [{ text: promptText }] }],
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT',       threshold: 'BLOCK_LOW_AND_ABOVE' },
        { category: 'HARM_CATEGORY_HATE_SPEECH',       threshold: 'BLOCK_LOW_AND_ABOVE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_LOW_AND_ABOVE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_LOW_AND_ABOVE' },
      ],
      generationConfig: { responseMimeType: 'application/json' },
    };

    const httpResponse = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify(requestBody),
    });

    if (!httpResponse.ok) {
      if (httpResponse.status === 429) {
        throw fastify.httpErrors.tooManyRequests(
          'The AI Chart Generator is currently experiencing high demand. Please wait a moment and try again.',
        );
      }
      
      throw fastify.httpErrors.badGateway(
        `Something went wrong while trying to generate the chart`,
      );
    }

    const response = await httpResponse.json() as {
      candidates?: { content: { parts: { text: string }[] }; finishReason: string }[];
      usageMetadata?: unknown;
    };

    if (
      response.candidates &&
      response.candidates[0].finishReason === 'SAFETY'
    ) {
      await writeFile(`${cwd}/safetyBlock.json`, JSON.stringify(response.candidates[0]), 'utf8');
      throw fastify.httpErrors.badRequest(
        'Unable to generate chart: The request violates content safety guidelines.',
      );
    }

    const usage = response.usageMetadata;

    const raw = response.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
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
