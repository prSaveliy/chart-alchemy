import type { FastifyInstance } from 'fastify';
import { createHash } from 'node:crypto';

import type { ChartService } from '../chart.service.js';
import type { CacheService } from '../../commons/interfaces/services/cacheService.interface.js';

import type {
  DatasetChartType,
  DatasetGenerationResult,
  ParsedDataset,
} from '../../commons/interfaces/dataset/dataset.interface.js';

import { parseFile } from './parseFile.js';
import { buildChartOption } from './buildChartOption.js';

const DATASET_CHART_CACHE_TTL_SECONDS = 10 * 60;
const DATASET_PARSE_CACHE_TTL_SECONDS = 30 * 60;



export class DatasetService {
  constructor(
    private readonly app: FastifyInstance,
    private readonly chartService: ChartService,
    private readonly cacheService: CacheService,
  ) {}

  private getFileHash(fileBuffer: Buffer): string {
    return createHash('sha256').update(fileBuffer).digest('hex');
  }

  private buildParsedDatasetCacheKey(fileHash: string): string {
    return ['dataset-parse', fileHash].join(':');
  }

  private cacheKeyPart = (value: string | undefined): string =>
    value === undefined ? '_auto' : encodeURIComponent(value);

  private buildChartCacheKey(
    fileHash: string,
    mimetype: string,
    chartType: DatasetChartType,
    xField: string | undefined,
    yField: string | undefined,
  ): string {
    return [
      'dataset-chart',
      mimetype,
      fileHash,
      chartType,
      this.cacheKeyPart(xField),
      this.cacheKeyPart(yField),
    ].join(':');
  }

  private async getCachedResult(
    key: string,
  ): Promise<DatasetGenerationResult | null> {
    try {
      const cached = await this.cacheService.get(key);
      if (!cached) return null;

      const result = JSON.parse(cached) as DatasetGenerationResult;
      return result;
    } catch (error) {
      this.app.log.warn({ err: error, key }, 'dataset chart cache read failed');
      return null;
    }
  }

  private async getCachedParsedDataset(key: string): Promise<ParsedDataset | null> {
    try {
      const cached = await this.cacheService.get(key);
      if (!cached) return null;

      return JSON.parse(cached) as ParsedDataset;
    } catch (error) {
      this.app.log.warn({ err: error, key }, 'dataset parse cache read failed');
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

  private async cacheParsedDataset(
    key: string,
    dataset: ParsedDataset,
  ): Promise<void> {
    try {
      await this.cacheService.set(
        key,
        JSON.stringify(dataset),
        DATASET_PARSE_CACHE_TTL_SECONDS,
      );
    } catch (error) {
      this.app.log.warn({ err: error, key }, 'dataset parse cache write failed');
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
    const fileHash = this.getFileHash(fileBuffer);
    const chartCacheKey = this.buildChartCacheKey(
      fileHash,
      mimetype,
      chartType,
      xField,
      yField,
    );
    const cachedResult = await this.getCachedResult(chartCacheKey);
    if (cachedResult) {
      await this.chartService.save(cachedResult.chartData, token);
      return cachedResult;
    }

    const parsedDatasetCacheKey = this.buildParsedDatasetCacheKey(fileHash);
    let dataset = await this.getCachedParsedDataset(parsedDatasetCacheKey);
    if (!dataset) {
      dataset = await parseFile(this.app, fileBuffer, filename, mimetype);
      await this.cacheParsedDataset(parsedDatasetCacheKey, dataset);
    }

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
    await this.cacheResult(chartCacheKey, result);

    return result;
  }
}
