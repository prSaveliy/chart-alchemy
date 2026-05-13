import type { FastifyInstance } from 'fastify';
import type { ChartConfig } from '../commons/schemas/chartConfig.schema.js';
import type { EChartsOption } from '../commons/schemas/chartConfig.schema.js';
import type { ChartRepository } from '../commons/interfaces/repositories/chartRepository.interface.js';

import type { GeminiService } from './gemini.service.js';

import { v4 } from 'uuid';

export class ChartService {
  constructor(
    private readonly chartRepository: ChartRepository,
    private readonly geminiService: GeminiService,
  ) {}

  async init(
    fastify: FastifyInstance,
    chartType: 'ai' | 'manual' | 'dataset',
    userId: number,
  ) {
    const randomString = v4();
    const token = `${chartType}-${randomString}`;

    await this.chartRepository.create(token, userId);

    return { token };
  }

  async verifyToken(fastify: FastifyInstance, token: string, userId: number) {
    const chart = await this.chartRepository.findByToken(token);

    if (!chart) {
      throw fastify.httpErrors.notFound('Chart not found');
    } else if (chart.userId !== userId) {
      throw fastify.httpErrors.forbidden(
        "You don't have permissions to access this chart",
      );
    }
  }

  async generate(
    fastify: FastifyInstance,
    prompt: string,
    token: string,
    userId: number,
    memory: ChartConfig | null,
    thinkingMode: boolean,
  ) {
    const chartData = await this.geminiService.generate(
      fastify,
      prompt,
      memory,
      thinkingMode,
    );

    await this.save(fastify, chartData, token);

    return { chartData };
  }

  async rename(
    fastify: FastifyInstance,
    name: string,
    token: string,
    userId: number,
  ) {
    await this.verifyToken(fastify, token, userId);

    await this.chartRepository.updateName(token, name);
  }

  async save(fastify: FastifyInstance, chartData: ChartConfig, token: string) {
    await this.chartRepository.updateConfig(token, chartData);
  }

  async listByUser(fastify: FastifyInstance, userId: number) {
    const charts = await this.chartRepository.listByUser(userId);

    return { charts };
  }

  async getByToken(fastify: FastifyInstance, token: string, userId: number) {
    await this.verifyToken(fastify, token, userId);

    const chart = await this.chartRepository.findByToken(token);

    return {
      chartData: chart?.config,
      chartName: chart?.name,
      manualType: chart?.manualType ?? null,
    };
  }

  async delete(fastify: FastifyInstance, token: string, userId: number) {
    await this.verifyToken(fastify, token, userId);

    await this.chartRepository.deleteByToken(token);
  }

  async saveConfig(
    fastify: FastifyInstance,
    token: string,
    chartData: EChartsOption,
    userId: number,
    manualType?: string,
  ) {
    await this.verifyToken(fastify, token, userId);

    await this.chartRepository.updateConfig(token, chartData, manualType);
  }
}
