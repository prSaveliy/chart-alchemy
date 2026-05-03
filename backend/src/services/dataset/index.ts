import { FastifyInstance } from 'fastify';

import chartService from '../chart.service.js';

import {
  DatasetChartType,
  DatasetGenerationResult,
} from '../../commons/types/dataset.js';

import { parseFile } from './parseFile.js';
import { buildChartOption } from './buildChartOption.js';

class DatasetService {
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

    await chartService.save(fastify, chartData, token);

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

export default new DatasetService();
