import type { FastifyInstance } from 'fastify';

import { writeFile, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';

import {
  HarmCategory,
  HarmBlockThreshold,
  GenerateContentResponse,
} from '@google/genai';

import type { AIService } from '../commons/interfaces/services/AIService.interface.js';
import type { CacheService } from '../commons/interfaces/services/cacheService.interface.js';
import { chartConfigSchema } from '../commons/schemas/chartConfig.schema.js';
import type { ChartConfig } from '../commons/schemas/chartConfig.schema.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const cwd = process.cwd();

const SYSTEM_INSTRUCTION = await readFile(
  join(__dirname, '../prompts/system-instruction.txt'),
  'utf8',
);
const DEFAULT_GEMINI_MODEL = 'gemini-3-flash-preview';
const BUDGET_KEY = 'billing:tokens:daily_pool';

interface SafetySetting {
  category: HarmCategory;
  threshold: HarmBlockThreshold;
}

export class GeminiService implements AIService {
  constructor(
    private readonly app: FastifyInstance,
    private readonly cacheService: CacheService,
  ) {}

  async generate(
    prompt: string,
    memory: ChartConfig | null,
    thinkingMode: boolean,
  ): Promise<ChartConfig> {
    const promptText = this.buildPromptText(prompt, memory);

    await this.checkDailyLimit();

    const [thinkingModel, standardModel] = this.getModels();
    
    const worstCaseCost = await this.reserveProjectedTokens(promptText, thinkingModel);

    const model = thinkingMode ? thinkingModel : standardModel;
    const safetySettings = this.buildSafetySettings();

    let actualTokensUsed: number | null = null;
    try {
      const response = await this.requestAPI(model, safetySettings, promptText);
      actualTokensUsed = response.usageMetadata?.totalTokenCount ?? null;

      const raw = response.text ?? '';
      const cleaned = raw.replace(/```json|```/g, '').trim();

      await this.log('geminiResponse.json', cleaned);
      await this.log(
        'metadata.txt',
        JSON.stringify(response.usageMetadata ?? null, null, 2),
      );

      await this.validateResponse(response);

      const chartData = this.validateChartConfig(cleaned);

      return chartData;
    } finally {
      await this.refundOverestimation(worstCaseCost, actualTokensUsed);
    }
  }

  private async checkDailyLimit(): Promise<void> {
    const currentPoolUsage = await this.cacheService.get(BUDGET_KEY);
    if (
      currentPoolUsage &&
      Number(currentPoolUsage) >= this.app.config.GEMINI_DAILY_TOKEN_LIMIT
    ) {
      throw this.app.httpErrors.tooManyRequests(
        'Service temporarily unavailable due to high volume. Please try again later.',
      );
    }
  }

  private async reserveProjectedTokens(
    promptText: string,
    thinkingModel: string,
  ): Promise<number> {
    /*
      Input tokens are calculated for the most expensive model
      to account for worst-case scenario
    */
    const tokenInfo = await this.app.gemini.models.countTokens({
      model: thinkingModel,
      contents: promptText,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      },
    });
    const inputTokens = tokenInfo.totalTokens ?? 0;

    const worstCaseCost =
      inputTokens + this.app.config.GEMINI_MAX_OUTPUT_TOKENS;
    const totalProjected = await this.cacheService.incrby(
      BUDGET_KEY,
      worstCaseCost,
    );

    await this.cacheService.expire(BUDGET_KEY, 86400, 'NX');

    if (totalProjected > this.app.config.GEMINI_DAILY_TOKEN_LIMIT) {
      await this.cacheService.decrby(BUDGET_KEY, worstCaseCost);
      throw this.app.httpErrors.tooManyRequests(
        'Service temporarily unavailable due to high volume. Please try again later.',
      );
    }

    return worstCaseCost;
  }

  private async refundOverestimation(
    worstCaseCost: number,
    actualTokensUsed: number | null,
  ): Promise<void> {
    const overestimationRefund = worstCaseCost - (actualTokensUsed ?? 0);
    if (overestimationRefund > 0) {
      const exists = await this.cacheService.get(BUDGET_KEY);
      if (exists !== null) {
        const newValue = await this.cacheService.decrby(BUDGET_KEY, overestimationRefund);
        if (newValue < 0) {
          await this.cacheService.set(BUDGET_KEY, 0);
        }
      }
    }
  }

  private buildPromptText(
    userPrompt: string,
    memory: ChartConfig | null,
  ): string {
    let promptText = '';
    if (memory && Object.keys(memory).length !== 0) {
      promptText += `<CURRENT_CHART_CONFIG>\n${JSON.stringify(memory)}\n</CURRENT_CHART_CONFIG>\n\n`;
    }
    promptText += `<USER_REQUEST>\n${userPrompt}\n</USER_REQUEST>`;

    return promptText;
  }

  private getModels(): [string, string] {
    const models = this.app.config.GEMINI_MODELS
      .split(',')
      .map(model => model.trim())
      .filter(Boolean);

    const thinkingModel = models[0] ?? DEFAULT_GEMINI_MODEL;
    const standardModel = models[1] ?? DEFAULT_GEMINI_MODEL;

    if (models.length < 2) {
      this.app.log.warn(
        {
          geminiModels: this.app.config.GEMINI_MODELS,
          fallbackModel: DEFAULT_GEMINI_MODEL,
        },
        'GEMINI_MODELS is missing entries; using fallback model',
      );
    }

    return [thinkingModel, standardModel];
  }

  private buildSafetySettings(): SafetySetting[] {
    return [
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
  }

  private async requestAPI(
    model: string,
    safetySettings: SafetySetting[],
    promptText: string,
  ): Promise<GenerateContentResponse> {
    return await this.app.gemini.models
      .generateContent({
        model,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json',
          safetySettings: safetySettings,
          maxOutputTokens: this.app.config.GEMINI_MAX_OUTPUT_TOKENS,
        },
        contents: [
          {
            role: 'user',
            parts: [{ text: promptText }],
          },
        ],
      })
      .catch(error => {
        if (error.status === 429) {
          throw this.app.httpErrors.tooManyRequests(
            'The AI Chart Generator is currently experiencing high demand. Please wait a moment and try again.',
          );
        }
        this.app.log.error({ err: error }, 'gemini generateContent failed');
        throw this.app.httpErrors.badGateway(
          'Unable to generate chart. Please try again.',
        );
      });
  }

  private async validateResponse(
    response: GenerateContentResponse,
  ): Promise<void> {
    if (
      response.candidates &&
      response.candidates[0].finishReason === 'SAFETY'
    ) {
      await this.log(
        'safetyBlock.json',
        JSON.stringify(response.candidates[0]),
      );
      throw this.app.httpErrors.badRequest(
        'Unable to generate chart: The request violates content safety guidelines.',
      );
    }
  }

  private validateChartConfig(cleanedResponse: string): ChartConfig {
    let rawJson;
    try {
      rawJson = JSON.parse(cleanedResponse);
    } catch {
      throw this.app.httpErrors.badGateway(
        'The AI generated invalid syntax. Please try again.',
      );
    }

    const validationResult = chartConfigSchema.safeParse(rawJson);

    if (!validationResult.success) {
      throw this.app.httpErrors.badGateway(
        'The AI generated an invalid chart configuration. Please try again.',
      );
    }

    return validationResult.data;
  }

  private async log(filepath: string, payload: string): Promise<void> {
    if (process.env.NODE_ENV === 'production') return;
    try {
      await writeFile(`${cwd}/${filepath}`, payload, 'utf8');
    } catch (error) {
      this.app.log.warn(
        {
          err: error,
          filepath,
        },
        'Failed to write Gemini debug log',
      );
    }
  }
}
