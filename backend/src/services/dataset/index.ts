import type { FastifyInstance } from 'fastify';

import type { ChartService } from '../chart.service.js';

import type {
  DatasetChartType,
  DatasetGenerationResult,
} from '../../commons/types/dataset.js';

import { parseFile } from './parseFile.js';
import { buildChartOption } from './buildChartOption.js';

export class DatasetService {
  constructor(private readonly chartService: ChartService) {}

  async generate(
    fastify: FastifyInstance,
    fileBuffer: Buffer,
    filename: string,
    mimetype: string,
    chartType: DatasetChartType,
    token: string,
    userId: number,
    xField: string | undefined,
    yField: string | undefined,
  ): Promise<DatasetGenerationResult> {
    const dataset = await parseFile(fastify, fileBuffer, filename, mimetype);

    if (dataset.fields.length < 2) {
      throw fastify.httpErrors.badRequest('Dataset must have at least two columns');
    }

    const { option, resolved } = buildChartOption(
      dataset,
      chartType,
      xField,
      yField,
    );
    const chartData = { option };

    await this.chartService.save(fastify, chartData, token);

    return {
      chartData,
      fields: dataset.fields,
      selectedType: chartType,
      selectedXField: resolved.xField,
      selectedYField: resolved.yField,
      truncated: dataset.truncated,
    };
  }
}
