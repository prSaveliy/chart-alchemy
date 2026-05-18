import type { FastifyInstance } from 'fastify';
import { createHash } from 'node:crypto';

import type { ChartService } from '../chart.service.js';
import type { CacheService } from '../../commons/interfaces/services/cacheService.interface.js';

import type {
  DatasetChartType,
  DatasetGenerationResult,
  CachedDatasetGenerationResult,
  ParsedDataset,
} from '../../commons/interfaces/dataset/dataset.interface.js';
import type { ChartRepository } from '../../repositories/chart.repository.js';

import { parseFile } from './parseFile.js';
import { buildChartOption } from './buildChartOption.js';

const DATASET_CHART_CACHE_TTL_SECONDS = 10 * 60;
const DATASET_PARSE_CACHE_TTL_SECONDS = 30 * 60;

export class DatasetService {
  constructor(
    private readonly app: FastifyInstance,
    private readonly chartService: ChartService,
    private readonly chartRepository: ChartRepository,
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
  ): Promise<CachedDatasetGenerationResult | null> {
    try {
      const cached = await this.cacheService.get(key);
      if (!cached) return null;

      const result = JSON.parse(cached) as CachedDatasetGenerationResult;
      return result;
    } catch (error) {
      this.app.log.warn({ err: error, key }, 'dataset chart cache read failed');
      return null;
    }
  }

  private async getCachedParsedDataset(
    key: string,
  ): Promise<ParsedDataset | null> {
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
    result: CachedDatasetGenerationResult,
  ): Promise<void> {
    try {
      await this.cacheService.set(
        key,
        JSON.stringify(result),
        DATASET_CHART_CACHE_TTL_SECONDS,
      );
    } catch (error) {
      this.app.log.warn(
        { err: error, key },
        'dataset chart cache write failed',
      );
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
      this.app.log.warn(
        { err: error, key },
        'dataset parse cache write failed',
      );
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

    const datasetSource = await this.chartRepository.findOrCreateDatasetSource(
      filename,
      mimetype,
      fileBuffer.length,
      fileHash,
      dataset.fields,
      dataset.rows,
      dataset.truncated,
      dataset.rows.length,
    );

    await this.chartRepository.assignDatasetSource(
      token,
      datasetSource.id,
      chartType,
      resolved.xField,
      resolved.yField,
    );

    const cacheData: CachedDatasetGenerationResult = {
      chartData,
      fields: dataset.fields,
      selectedType: chartType,
      selectedXField: resolved.xField,
      selectedYField: resolved.yField,
      truncated: dataset.truncated,
    };

    const result: DatasetGenerationResult = {
      ...cacheData,
      datasetInfo: {
        fileName: datasetSource.fileName,
        mimeType: datasetSource.mimeType,
        fileSize: datasetSource.fileSize,
      },
    };

    const chartCacheKey = this.buildChartCacheKey(
      fileHash,
      mimetype,
      chartType,
      resolved.xField,
      resolved.yField,
    );

    await this.chartService.save(chartData, token);
    await this.cacheResult(chartCacheKey, cacheData);

    return result;
  }

  async regenerate(
    token: string,
    chartType: DatasetChartType,
    xField: string | undefined,
    yField: string | undefined,
  ): Promise<DatasetGenerationResult> {
    const chart = await this.chartRepository.findByToken(token);

    if (!chart?.datasetSource) {
      throw this.app.httpErrors.notFound('Dataset source not found');
    }

    const chartCacheKey = this.buildChartCacheKey(
      chart.datasetSource.fileHash,
      chart.datasetSource.mimeType,
      chartType,
      xField,
      yField,
    );
    const cachedResult = await this.getCachedResult(chartCacheKey);
    if (cachedResult) {
      await this.chartRepository.assignDatasetSource(
        token,
        chart.datasetSource.id,
        cachedResult.selectedType,
        cachedResult.selectedXField,
        cachedResult.selectedYField,
      );
      await this.chartService.save(cachedResult.chartData, token);

      return {
        ...cachedResult,
        datasetInfo: {
          fileName: chart.datasetSource.fileName,
          mimeType: chart.datasetSource.mimeType,
          fileSize: chart.datasetSource.fileSize,
        },
      };
    }

    const dataset = {
      fields: chart.datasetSource.fields as unknown as ParsedDataset['fields'],
      rows: chart.datasetSource.rows as unknown as ParsedDataset['rows'],
      truncated: chart.datasetSource.truncated,
    };

    if (dataset.fields.length < 2) {
      throw this.app.httpErrors.badRequest(
        'Dataset must have at least two columns',
      );
    }

    const { option, resolved } = buildChartOption(
      dataset,
      chartType,
      xField,
      yField,
    );
    const chartData = { option };

    const cacheData: CachedDatasetGenerationResult = {
      chartData,
      fields: dataset.fields,
      selectedType: chartType,
      selectedXField: resolved.xField,
      selectedYField: resolved.yField,
      truncated: dataset.truncated,
    };

    const result: DatasetGenerationResult = {
      ...cacheData,
      datasetInfo: {
        fileName: chart.datasetSource.fileName,
        mimeType: chart.datasetSource.mimeType,
        fileSize: chart.datasetSource.fileSize,
      },
    };

    await this.chartRepository.assignDatasetSource(
      token,
      chart.datasetSource.id,
      chartType,
      resolved.xField,
      resolved.yField,
    );
    await this.chartService.save(chartData, token);

    const resolvedChartCacheKey = this.buildChartCacheKey(
      chart.datasetSource.fileHash,
      chart.datasetSource.mimeType,
      chartType,
      resolved.xField,
      resolved.yField,
    );
    await this.cacheResult(resolvedChartCacheKey, cacheData);

    return result;
  }
}
