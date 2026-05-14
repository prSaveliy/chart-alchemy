import type { FastifyInstance } from 'fastify';
import type { ChartConfig } from '../commons/schemas/chartConfig.schema.js';
import type { EChartsOption } from '../commons/schemas/chartConfig.schema.js';
import type { ChartRepository } from '../commons/interfaces/repositories/chartRepository.interface.js';
import type { AIService } from '../commons/interfaces/services/AIService.interface.js';

import { v4 } from 'uuid';

export class ChartService {
  constructor(
    private readonly app: FastifyInstance,
    private readonly chartRepository: ChartRepository,
    private readonly aiService: AIService,
  ) {}

  async init(chartType: 'ai' | 'manual' | 'dataset', userId: number) {
    const randomString = v4();
    const token = `${chartType}-${randomString}`;

    await this.chartRepository.create(token, userId);

    return { token };
  }

  async verifyToken(token: string, userId: number) {
    const chart = await this.chartRepository.findByToken(token);

    if (!chart) {
      throw this.app.httpErrors.notFound('Chart not found');
    } else if (chart.userId !== userId) {
      throw this.app.httpErrors.forbidden(
        "You don't have permissions to access this chart",
      );
    }
  }

  async generate(
    prompt: string,
    token: string,
    userId: number,
    memory: ChartConfig | null,
    thinkingMode: boolean,
  ) {
    const chartData = await this.aiService.generate(prompt, memory, thinkingMode);

    await this.save(chartData, token);

    return { chartData };
  }

  async rename(
    name: string,
    token: string,
    userId: number,
  ) {
    await this.verifyToken(token, userId);

    await this.chartRepository.updateName(token, name);
  }

  async save(chartData: ChartConfig, token: string) {
    await this.chartRepository.updateConfig(token, chartData);
  }

  async listByUser(userId: number) {
    const charts = await this.chartRepository.listByUser(userId);

    return { charts };
  }

  async getByToken(token: string, userId: number) {
    await this.verifyToken(token, userId);

    const chart = await this.chartRepository.findByToken(token);

    return {
      chartData: chart?.config,
      chartName: chart?.name,
      manualType: chart?.manualType ?? null,
    };
  }

  async delete(token: string, userId: number) {
    await this.verifyToken(token, userId);

    await this.chartRepository.deleteByToken(token);
  }

  async saveConfig(
    token: string,
    chartData: EChartsOption,
    userId: number,
    manualType?: string,
  ) {
    await this.verifyToken(token, userId);

    await this.chartRepository.updateConfig(token, chartData, manualType);
  }
}
