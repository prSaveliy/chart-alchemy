import type { FastifyInstance } from 'fastify';
import { createHash } from 'node:crypto';

import type { ChartService } from '../chart.service.js';
import type { CacheService } from '../../commons/interfaces/services/cacheService.interface.js';

import type {
  DatasetChartType,
  DatasetGenerationResult,
} from '../../commons/interfaces/dataset/dataset.interface.js';

import { parseFile } from './parseFile.js';
import { buildChartOption } from './buildChartOption.js';

const DATASET_CHART_CACHE_TTL_SECONDS = 10 * 60;

const cacheKeyPart = (value: string | undefined): string =>
  value === undefined ? '_auto' : encodeURIComponent(value);

export class DatasetService {
  constructor(
    private readonly app: FastifyInstance,
    private readonly chartService: ChartService,
    private readonly cacheService: CacheService,
  ) {}

  private buildCacheKey(
    fileBuffer: Buffer,
    mimetype: string,
    chartType: DatasetChartType,
    xField: string | undefined,
    yField: string | undefined,
  ): string {
    const fileHash = createHash('sha256').update(fileBuffer).digest('hex');

    return [
      'dataset-chart',
      mimetype,
      fileHash,
      chartType,
      cacheKeyPart(xField),
      cacheKeyPart(yField),
    ].join(':');
  }

  private async getCachedResult(
    key: string,
    token: string,
  ): Promise<DatasetGenerationResult | null> {
    try {
      const cached = await this.cacheService.get(key);
      if (!cached) return null;

      const result = JSON.parse(cached) as DatasetGenerationResult;
      await this.chartService.save(result.chartData, token);
      return result;
    } catch (error) {
      this.app.log.warn({ err: error, key }, 'dataset chart cache read failed');
      return null;
    }
  }

  private async cacheResult(
    key: string,
    result: DatasetGenerationResult,
  ): Promise<void> {
    try {
      await this.cacheService.set(
        key,
        JSON.stringify(result),
        DATASET_CHART_CACHE_TTL_SECONDS,
      );
    } catch (error) {
      this.app.log.warn({ err: error, key }, 'dataset chart cache write failed');
    }
  }

  async generate(
    fileBuffer: Buffer,
    filename: string,
    mimetype: string,
    chartType: DatasetChartType,
    token: string,
    xField: string | undefined,
    yField: string | undefined,
  ): Promise<DatasetGenerationResult> {
    const cacheKey = this.buildCacheKey(
      fileBuffer,
      mimetype,
      chartType,
      xField,
      yField,
    );
    const cachedResult = await this.getCachedResult(cacheKey, token);
    if (cachedResult) {
      return cachedResult;
    }

    const dataset = await parseFile(this.app, fileBuffer, filename, mimetype);

    if (dataset.fields.length < 2) {
      throw this.app.httpErrors.badRequest('Dataset must have at least two columns');
    }

    const { option, resolved } = buildChartOption(
      dataset,
      chartType,
      xField,
      yField,
    );
    const chartData = { option };

    const result = {
      chartData,
      fields: dataset.fields,
      selectedType: chartType,
      selectedXField: resolved.xField,
      selectedYField: resolved.yField,
      truncated: dataset.truncated,
    };

    await this.chartService.save(chartData, token);
    await this.cacheResult(cacheKey, result);

    return result;
  }
}
