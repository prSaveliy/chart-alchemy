import { FastifyInstance } from 'fastify';
import { Readable } from 'node:stream';

import chartService from '../chart.service.js';

import {
  DatasetChartType,
  DatasetGenerationResult,
  ParsedDataset,
} from '../../commons/types/dataset.js';

import { parseFile } from './parseFile.js';
import { buildChartOption } from './buildChartOption.js';

class DatasetService {
  async parseUploadedFile(
    fastify: FastifyInstance,
    fileStream: Readable,
    filename: string,
    mimetype: string,
  ): Promise<ParsedDataset> {
    return await parseFile(fastify, fileStream, filename, mimetype);
  }

  async generate(
    fastify: FastifyInstance,
    datasetInput: ParsedDataset | Promise<ParsedDataset>,
    chartType: DatasetChartType,
    token: string,
    userId: number,
    xField: string | undefined,
    yField: string | undefined,
  ): Promise<DatasetGenerationResult> {
    const dataset = await datasetInput;

    if (dataset.fields.length < 2) {
      throw fastify.httpErrors.badRequest(
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
