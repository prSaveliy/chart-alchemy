import { describe, test, before, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { FastifyInstance } from 'fastify';
import buildApp from '../src/app.js';

const makeUser = async (app: FastifyInstance, email: string) => {
  const bcrypt = await import('bcrypt');
  const password = 'password123';
  await (app as any).prisma.user.create({
    data: {
      email,
      password: await bcrypt.hash(password, 10),
      isActivated: true,
    },
  });
  const loginRes = await request(app.server)
    .post('/auth/login')
    .send({ email, password })
    .set('Content-Type', 'application/json');
  return loginRes.body.accessToken as string;
};

const makeDatasetChart = async (app: FastifyInstance, accessToken: string) => {
  const initRes = await request(app.server)
    .post('/chart/init')
    .set('Authorization', `Bearer ${accessToken}`)
    .send({ chartType: 'dataset' })
    .set('Content-Type', 'application/json');
  return initRes.body.token as string;
};

const csvBuffer = (rows: string[][]): Buffer =>
  Buffer.from(rows.map(r => r.join(',')).join('\n'));

const SIMPLE_CSV = csvBuffer([
  ['month', 'sales'],
  ['Jan', '100'],
  ['Feb', '150'],
  ['Mar', '120'],
]);

const SCATTER_CSV = csvBuffer([
  ['x', 'y'],
  ['1', '2'],
  ['3', '4'],
  ['5', '6'],
]);

const EMPTY_CSV = csvBuffer([['name', 'value']]);

const ONE_COLUMN_CSV = csvBuffer([['name'], ['Jan'], ['Feb']]);

describe('dataset chart generation integration tests', () => {
  let app: FastifyInstance;
  let redis: any;

  before(async () => {
    if (process.env.NODE_ENV !== 'test') {
      throw new Error('Refusing to wipe database: NODE_ENV is not "test"');
    }
    app = await buildApp();
    await app.ready();
    redis = (app as any).redis;
    const { execSync } = await import('node:child_process');
    execSync('npx prisma migrate reset --force');
  });

  beforeEach(async () => {
    await redis.flushdb();
  });

  after(async () => {
    await app.close();
  });

  describe('POST /chart/upload-and-generate-from-dataset/:token', () => {
    test('returns expected response shape for a CSV file', async () => {
      const accessToken = await makeUser(app, 'ds-shape@qwertyuiop1234.com');
      const chartToken = await makeDatasetChart(app, accessToken);

      const response = await request(app.server)
        .post(`/chart/upload-and-generate-from-dataset/${chartToken}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('file', SIMPLE_CSV, { filename: 'data.csv', contentType: 'text/csv' })
        .field('chartType', 'bar');

      assert.equal(response.status, 200);
      assert.ok(response.body.chartData);
      assert.ok(Array.isArray(response.body.fields));
      assert.ok(response.body.selectedType);
      assert.ok(response.body.selectedXField);
      assert.ok(response.body.selectedYField);
      assert.equal(typeof response.body.truncated, 'boolean');
    });

    test('reuses parsed dataset cache for a different chart combination', async () => {
      const accessToken = await makeUser(app, 'ds-cache-multi@qwertyuiop1234.com');
      const firstChartToken = await makeDatasetChart(app, accessToken);
      const secondChartToken = await makeDatasetChart(app, accessToken);

      const firstResponse = await request(app.server)
        .post(`/chart/upload-and-generate-from-dataset/${firstChartToken}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('file', SIMPLE_CSV, { filename: 'data.csv', contentType: 'text/csv' })
        .field('chartType', 'bar');

      assert.equal(firstResponse.status, 200);

      const parsedDatasetEntriesAfterFirst = await redis.keys('dataset-parse:*');
      const chartEntriesAfterFirst = await redis.keys('dataset-chart:*');

      assert.equal(parsedDatasetEntriesAfterFirst.length, 1);
      assert.equal(chartEntriesAfterFirst.length, 1);

      const cachedParsedDatasetValue = await redis.get(
        parsedDatasetEntriesAfterFirst[0],
      );

      const secondResponse = await request(app.server)
        .post(`/chart/upload-and-generate-from-dataset/${secondChartToken}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('file', SIMPLE_CSV, { filename: 'data.csv', contentType: 'text/csv' })
        .field('chartType', 'line');

      assert.equal(secondResponse.status, 200);
      assert.equal(secondResponse.body.selectedType, 'line');

      const parsedDatasetEntriesAfterSecond = await redis.keys('dataset-parse:*');
      const chartEntriesAfterSecond = await redis.keys('dataset-chart:*');
      const cachedParsedDatasetAfterSecond = await redis.get(
        parsedDatasetEntriesAfterSecond[0],
      );

      assert.equal(parsedDatasetEntriesAfterSecond.length, 1);
      assert.equal(cachedParsedDatasetAfterSecond, cachedParsedDatasetValue);
      assert.equal(chartEntriesAfterSecond.length, 2);
    });

    test('saves generated config to the chart record in DB', async () => {
      const accessToken = await makeUser(app, 'ds-save@qwertyuiop1234.com');
      const chartToken = await makeDatasetChart(app, accessToken);

      const response = await request(app.server)
        .post(`/chart/upload-and-generate-from-dataset/${chartToken}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('file', SIMPLE_CSV, { filename: 'data.csv', contentType: 'text/csv' })
        .field('chartType', 'bar');

      assert.equal(response.status, 200);

      const chart = await (app as any).prisma.chart.findUnique({
        where: { token: chartToken },
      });
      assert.deepEqual(chart.config, response.body.chartData);
    });

    test('stored config contains a non-empty ECharts option with series', async () => {
      const accessToken = await makeUser(app, 'ds-config@qwertyuiop1234.com');
      const chartToken = await makeDatasetChart(app, accessToken);

      await request(app.server)
        .post(`/chart/upload-and-generate-from-dataset/${chartToken}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('file', SIMPLE_CSV, { filename: 'data.csv', contentType: 'text/csv' })
        .field('chartType', 'bar');

      const chart = await (app as any).prisma.chart.findUnique({
        where: { token: chartToken },
      });
      const config = chart.config as { option?: { series?: unknown[] } };
      assert.ok(config.option, 'config should have an option key');
      assert.ok(Array.isArray(config.option.series), 'option should have a series array');
      assert.ok(config.option.series.length > 0, 'series should be non-empty');
    });

    test('re-generating overwrites the previously stored config', async () => {
      const accessToken = await makeUser(app, 'ds-overwrite@qwertyuiop1234.com');
      const chartToken = await makeDatasetChart(app, accessToken);

      await request(app.server)
        .post(`/chart/upload-and-generate-from-dataset/${chartToken}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('file', SIMPLE_CSV, { filename: 'data.csv', contentType: 'text/csv' })
        .field('chartType', 'bar');

      const firstConfig = ((await (app as any).prisma.chart.findUnique({
        where: { token: chartToken },
      })) as { config: unknown }).config;

      const secondCsv = csvBuffer([
        ['product', 'revenue'],
        ['A', '500'],
        ['B', '300'],
      ]);

      await request(app.server)
        .post(`/chart/upload-and-generate-from-dataset/${chartToken}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('file', secondCsv, { filename: 'data2.csv', contentType: 'text/csv' })
        .field('chartType', 'line');

      const secondConfig = ((await (app as any).prisma.chart.findUnique({
        where: { token: chartToken },
      })) as { config: unknown }).config;

      assert.notDeepEqual(secondConfig, firstConfig);
    });

    test('generates a bar chart and returns selectedType=bar', async () => {
      const accessToken = await makeUser(app, 'ds-bar@qwertyuiop1234.com');
      const chartToken = await makeDatasetChart(app, accessToken);

      const response = await request(app.server)
        .post(`/chart/upload-and-generate-from-dataset/${chartToken}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('file', SIMPLE_CSV, { filename: 'data.csv', contentType: 'text/csv' })
        .field('chartType', 'bar');

      assert.equal(response.status, 200);
      assert.equal(response.body.selectedType, 'bar');
    });

    test('generates a line chart and returns selectedType=line', async () => {
      const accessToken = await makeUser(app, 'ds-line@qwertyuiop1234.com');
      const chartToken = await makeDatasetChart(app, accessToken);

      const response = await request(app.server)
        .post(`/chart/upload-and-generate-from-dataset/${chartToken}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('file', SIMPLE_CSV, { filename: 'data.csv', contentType: 'text/csv' })
        .field('chartType', 'line');

      assert.equal(response.status, 200);
      assert.equal(response.body.selectedType, 'line');
    });

    test('generates a pie chart and returns selectedType=pie', async () => {
      const accessToken = await makeUser(app, 'ds-pie@qwertyuiop1234.com');
      const chartToken = await makeDatasetChart(app, accessToken);

      const response = await request(app.server)
        .post(`/chart/upload-and-generate-from-dataset/${chartToken}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('file', SIMPLE_CSV, { filename: 'data.csv', contentType: 'text/csv' })
        .field('chartType', 'pie');

      assert.equal(response.status, 200);
      assert.equal(response.body.selectedType, 'pie');
    });

    test('generates a scatter chart and returns selectedType=scatter', async () => {
      const accessToken = await makeUser(app, 'ds-scatter@qwertyuiop1234.com');
      const chartToken = await makeDatasetChart(app, accessToken);

      const response = await request(app.server)
        .post(`/chart/upload-and-generate-from-dataset/${chartToken}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('file', SCATTER_CSV, { filename: 'data.csv', contentType: 'text/csv' })
        .field('chartType', 'scatter');

      assert.equal(response.status, 200);
      assert.equal(response.body.selectedType, 'scatter');
    });

    test('defaults to bar when chartType is omitted', async () => {
      const accessToken = await makeUser(app, 'ds-default@qwertyuiop1234.com');
      const chartToken = await makeDatasetChart(app, accessToken);

      const response = await request(app.server)
        .post(`/chart/upload-and-generate-from-dataset/${chartToken}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('file', SIMPLE_CSV, { filename: 'data.csv', contentType: 'text/csv' });

      assert.equal(response.status, 200);
      assert.equal(response.body.selectedType, 'bar');
    });

    test('honours explicit xField and yField', async () => {
      const accessToken = await makeUser(app, 'ds-explicit@qwertyuiop1234.com');
      const chartToken = await makeDatasetChart(app, accessToken);

      const response = await request(app.server)
        .post(`/chart/upload-and-generate-from-dataset/${chartToken}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('file', SIMPLE_CSV, { filename: 'data.csv', contentType: 'text/csv' })
        .field('chartType', 'bar')
        .field('xField', 'month')
        .field('yField', 'sales');

      assert.equal(response.status, 200);
      assert.equal(response.body.selectedXField, 'month');
      assert.equal(response.body.selectedYField, 'sales');
    });

    test('infers field names and types from the CSV', async () => {
      const accessToken = await makeUser(app, 'ds-infer@qwertyuiop1234.com');
      const chartToken = await makeDatasetChart(app, accessToken);

      const response = await request(app.server)
        .post(`/chart/upload-and-generate-from-dataset/${chartToken}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('file', SIMPLE_CSV, { filename: 'data.csv', contentType: 'text/csv' })
        .field('chartType', 'bar');

      assert.equal(response.status, 200);

      const fields = response.body.fields as { name: string; type: string }[];
      const monthField = fields.find(f => f.name === 'month');
      const salesField = fields.find(f => f.name === 'sales');
      assert.ok(monthField, 'month field should be present');
      assert.ok(salesField, 'sales field should be present');
      assert.equal(monthField.type, 'string');
      assert.equal(salesField.type, 'number');
    });

    test('returns truncated=false for a small dataset', async () => {
      const accessToken = await makeUser(app, 'ds-trunc@qwertyuiop1234.com');
      const chartToken = await makeDatasetChart(app, accessToken);

      const response = await request(app.server)
        .post(`/chart/upload-and-generate-from-dataset/${chartToken}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('file', SIMPLE_CSV, { filename: 'data.csv', contentType: 'text/csv' })
        .field('chartType', 'bar');

      assert.equal(response.status, 200);
      assert.equal(response.body.truncated, false);
    });

    test('accepts a valid XLSX file', async () => {
      const accessToken = await makeUser(app, 'ds-xlsx@qwertyuiop1234.com');
      const chartToken = await makeDatasetChart(app, accessToken);

      const ExcelJS = (await import('exceljs')).default;
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Sheet1');
      sheet.addRow(['month', 'sales']);
      sheet.addRow(['Jan', 100]);
      sheet.addRow(['Feb', 150]);
      sheet.addRow(['Mar', 120]);
      const xlsxBuffer = Buffer.from(
        await workbook.xlsx.writeBuffer() as ArrayBuffer,
      );

      const response = await request(app.server)
        .post(`/chart/upload-and-generate-from-dataset/${chartToken}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('file', xlsxBuffer, {
          filename: 'data.xlsx',
          contentType:
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        })
        .field('chartType', 'bar');

      assert.equal(response.status, 200);
      assert.ok(response.body.chartData);
    });

    test('returns 401 without auth', async () => {
      const response = await request(app.server)
        .post('/chart/upload-and-generate-from-dataset/dataset-some-token')
        .attach('file', SIMPLE_CSV, { filename: 'data.csv', contentType: 'text/csv' })
        .field('chartType', 'bar');

      assert.equal(response.status, 401);
    });

    test('returns 403 when chart belongs to another user', async () => {
      const ownerToken = await makeUser(app, 'ds-owner@qwertyuiop1234.com');
      const otherToken = await makeUser(app, 'ds-other@qwertyuiop1234.com');
      const chartToken = await makeDatasetChart(app, ownerToken);

      const response = await request(app.server)
        .post(`/chart/upload-and-generate-from-dataset/${chartToken}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .attach('file', SIMPLE_CSV, { filename: 'data.csv', contentType: 'text/csv' })
        .field('chartType', 'bar');

      assert.equal(response.status, 403);
    });

    test('returns 404 for a nonexistent chart token', async () => {
      const accessToken = await makeUser(app, 'ds-notfound@qwertyuiop1234.com');

      const response = await request(app.server)
        .post('/chart/upload-and-generate-from-dataset/dataset-00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('file', SIMPLE_CSV, { filename: 'data.csv', contentType: 'text/csv' })
        .field('chartType', 'bar');

      assert.equal(response.status, 404);
    });

    test('returns 400 when no file is provided', async () => {
      const accessToken = await makeUser(app, 'ds-nofile@qwertyuiop1234.com');
      const chartToken = await makeDatasetChart(app, accessToken);

      const response = await request(app.server)
        .post(`/chart/upload-and-generate-from-dataset/${chartToken}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .field('chartType', 'bar');

      assert.equal(response.status, 400);
    });

    test('returns 400 for an unsupported file type', async () => {
      const accessToken = await makeUser(app, 'ds-badtype@qwertyuiop1234.com');
      const chartToken = await makeDatasetChart(app, accessToken);

      const response = await request(app.server)
        .post(`/chart/upload-and-generate-from-dataset/${chartToken}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('file', Buffer.from('hello world'), {
          filename: 'data.txt',
          contentType: 'text/plain',
        })
        .field('chartType', 'bar');

      assert.equal(response.status, 400);
    });

    test('returns 400 when the CSV file has no data rows', async () => {
      const accessToken = await makeUser(app, 'ds-empty@qwertyuiop1234.com');
      const chartToken = await makeDatasetChart(app, accessToken);

      const response = await request(app.server)
        .post(`/chart/upload-and-generate-from-dataset/${chartToken}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('file', EMPTY_CSV, { filename: 'data.csv', contentType: 'text/csv' })
        .field('chartType', 'bar');

      assert.equal(response.status, 400);
    });

    test('returns 400 when the dataset has fewer than two columns', async () => {
      const accessToken = await makeUser(app, 'ds-onecol@qwertyuiop1234.com');
      const chartToken = await makeDatasetChart(app, accessToken);

      const response = await request(app.server)
        .post(`/chart/upload-and-generate-from-dataset/${chartToken}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('file', ONE_COLUMN_CSV, { filename: 'data.csv', contentType: 'text/csv' })
        .field('chartType', 'bar');

      assert.equal(response.status, 400);
    });

    test('returns 400 for an invalid chartType', async () => {
      const accessToken = await makeUser(app, 'ds-badchart@qwertyuiop1234.com');
      const chartToken = await makeDatasetChart(app, accessToken);

      const response = await request(app.server)
        .post(`/chart/upload-and-generate-from-dataset/${chartToken}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('file', SIMPLE_CSV, { filename: 'data.csv', contentType: 'text/csv' })
        .field('chartType', 'radar');

      assert.equal(response.status, 400);
    });

    test('links identical dataset uploads to the same DatasetSource', async () => {
      const accessToken = await makeUser(app, 'ds-link-same@qwertyuiop1234.com');
      const chartToken1 = await makeDatasetChart(app, accessToken);
      const chartToken2 = await makeDatasetChart(app, accessToken);

      await request(app.server)
        .post(`/chart/upload-and-generate-from-dataset/${chartToken1}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('file', SIMPLE_CSV, { filename: 'identical.csv', contentType: 'text/csv' })
        .field('chartType', 'bar');

      await request(app.server)
        .post(`/chart/upload-and-generate-from-dataset/${chartToken2}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('file', SIMPLE_CSV, { filename: 'identical.csv', contentType: 'text/csv' })
        .field('chartType', 'line');

      const chart1 = await (app as any).prisma.chart.findUnique({
        where: { token: chartToken1 },
      });
      const chart2 = await (app as any).prisma.chart.findUnique({
        where: { token: chartToken2 },
      });

      assert.ok(chart1.datasetSourceId);
      assert.ok(chart2.datasetSourceId);
      assert.equal(
        chart1.datasetSourceId,
        chart2.datasetSourceId,
        'both charts should link to the same DatasetSource to avoid duplicates'
      );
    });
  });

  describe('POST /chart/regenerate-from-dataset/:token', () => {
    test('returns 404 if dataset source is not found', async () => {
      const accessToken = await makeUser(app, 'regen-notfound@qwertyuiop1234.com');
      const chartToken = await makeDatasetChart(app, accessToken);

      const response = await request(app.server)
        .post(`/chart/regenerate-from-dataset/${chartToken}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ chartType: 'bar' });

      assert.equal(response.status, 404);
    });

    test('regenerates chart using db persistence without a file', async () => {
      const accessToken = await makeUser(app, 'regen-success@qwertyuiop1234.com');
      const chartToken = await makeDatasetChart(app, accessToken);

      await request(app.server)
        .post(`/chart/upload-and-generate-from-dataset/${chartToken}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('file', SIMPLE_CSV, { filename: 'data.csv', contentType: 'text/csv' })
        .field('chartType', 'bar');

      const response = await request(app.server)
        .post(`/chart/regenerate-from-dataset/${chartToken}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ chartType: 'pie' });

      assert.equal(response.status, 200);
      assert.equal(response.body.selectedType, 'pie');
      assert.ok(response.body.datasetInfo);
      assert.equal(response.body.datasetInfo.fileName, 'data.csv');
      assert.equal(response.body.datasetInfo.mimeType, 'text/csv');
      
      const chart = await (app as any).prisma.chart.findUnique({
        where: { token: chartToken },
        include: { datasetSource: true },
      });
      assert.deepEqual(chart.config, response.body.chartData);
      assert.ok(chart.datasetSource);
      assert.equal(chart.datasetSource.fileName, 'data.csv');
      assert.equal(chart.datasetSource.mimeType, 'text/csv');
    });

    test('prevents metadata leakage on cache hit for identical datasets with different names', async () => {
      const accessToken = await makeUser(app, 'regen-leak-meta@qwertyuiop1234.com');
      const chartToken1 = await makeDatasetChart(app, accessToken);
      const chartToken2 = await makeDatasetChart(app, accessToken);

      // 1. Upload first file (fileA.csv)
      const res1 = await request(app.server)
        .post(`/chart/upload-and-generate-from-dataset/${chartToken1}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('file', SIMPLE_CSV, { filename: 'fileA.csv', contentType: 'text/csv' })
        .field('chartType', 'bar');
        
      assert.equal(res1.status, 200);

      // 2. Upload identical content but different filename (fileB.csv)
      const res2 = await request(app.server)
        .post(`/chart/upload-and-generate-from-dataset/${chartToken2}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('file', SIMPLE_CSV, { filename: 'fileB.csv', contentType: 'text/csv' })
        .field('chartType', 'bar');
        
      assert.equal(res2.status, 200);

      const chart1 = await (app as any).prisma.chart.findUnique({
        where: { token: chartToken1 },
      });
      const chart2 = await (app as any).prisma.chart.findUnique({
        where: { token: chartToken2 },
      });

      assert.ok(chart1.datasetSourceId);
      assert.ok(chart2.datasetSourceId);
      assert.notEqual(
        chart1.datasetSourceId, 
        chart2.datasetSourceId,
        'Files with different metadata should create different DatasetSource records'
      );

      // 3. Regenerate FIRST chart (chartToken1).
      // Even though the shared cache was overwritten by chart 2, chart 1 should
      // still correctly receive its own metadata (fileA.csv) without pollution.
      const regenRes1 = await request(app.server)
        .post(`/chart/regenerate-from-dataset/${chartToken1}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ chartType: 'bar' });

      assert.equal(regenRes1.status, 200);
      assert.equal(
        regenRes1.body.datasetInfo.fileName, 
        'fileA.csv',
        'Regenerated chart 1 should return fileA.csv metadata, not fileB.csv'
      );
    });
  });

  describe('DatasetSource Lifecycle and Cleanup', () => {
    const UNIQUE_CSV_1 = csvBuffer([['unique', 'val'], ['A', '1']]);
    const UNIQUE_CSV_2 = csvBuffer([['unique', 'val'], ['B', '2']]);
    const UNIQUE_CSV_3 = csvBuffer([['unique', 'val'], ['C', '3']]);

    test('deletes orphaned DatasetSource when a chart is deleted', async () => {
      const accessToken = await makeUser(app, 'cleanup-del@qwertyuiop1234.com');
      const chartToken = await makeDatasetChart(app, accessToken);

      await request(app.server)
        .post(`/chart/upload-and-generate-from-dataset/${chartToken}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('file', UNIQUE_CSV_1, { filename: 'data.csv', contentType: 'text/csv' })
        .field('chartType', 'bar');

      const chartBefore = await (app as any).prisma.chart.findUnique({
        where: { token: chartToken },
      });
      assert.ok(chartBefore.datasetSourceId);
      
      const sourceBefore = await (app as any).prisma.datasetSource.findUnique({
        where: { id: chartBefore.datasetSourceId },
      });
      assert.ok(sourceBefore);

      // Delete the chart using chart delete endpoint
      const delResponse = await request(app.server)
        .delete(`/chart/${chartToken}`)
        .set('Authorization', `Bearer ${accessToken}`);
      
      assert.equal(delResponse.status, 204);

      const sourceAfter = await (app as any).prisma.datasetSource.findUnique({
        where: { id: chartBefore.datasetSourceId },
      });
      assert.equal(sourceAfter, null, 'DatasetSource should be deleted when its last chart is deleted');
    });

    test('deletes orphaned DatasetSource when a chart dataset is overwritten', async () => {
      const accessToken = await makeUser(app, 'cleanup-overwrite@qwertyuiop1234.com');
      const chartToken = await makeDatasetChart(app, accessToken);

      // Upload first file
      await request(app.server)
        .post(`/chart/upload-and-generate-from-dataset/${chartToken}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('file', UNIQUE_CSV_2, { filename: 'first.csv', contentType: 'text/csv' })
        .field('chartType', 'bar');

      const chartFirst = await (app as any).prisma.chart.findUnique({
        where: { token: chartToken },
      });
      const firstSourceId = chartFirst.datasetSourceId;
      assert.ok(firstSourceId);

      // Upload second file
      await request(app.server)
        .post(`/chart/upload-and-generate-from-dataset/${chartToken}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('file', SCATTER_CSV, { filename: 'second.csv', contentType: 'text/csv' })
        .field('chartType', 'scatter');

      const chartSecond = await (app as any).prisma.chart.findUnique({
        where: { token: chartToken },
      });
      const secondSourceId = chartSecond.datasetSourceId;
      assert.ok(secondSourceId);
      assert.notEqual(firstSourceId, secondSourceId);

      const firstSourceAfter = await (app as any).prisma.datasetSource.findUnique({
        where: { id: firstSourceId },
      });
      assert.equal(firstSourceAfter, null, 'The first DatasetSource should be deleted because it is no longer referenced');

      const secondSourceAfter = await (app as any).prisma.datasetSource.findUnique({
        where: { id: secondSourceId },
      });
      assert.ok(secondSourceAfter, 'The second DatasetSource should exist');
    });

    test('does not delete DatasetSource if another chart still references it', async () => {
      const accessToken = await makeUser(app, 'cleanup-keep@qwertyuiop1234.com');
      const chartToken1 = await makeDatasetChart(app, accessToken);
      const chartToken2 = await makeDatasetChart(app, accessToken);

      // Upload same file to both charts (links to same DatasetSource)
      await request(app.server)
        .post(`/chart/upload-and-generate-from-dataset/${chartToken1}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('file', UNIQUE_CSV_3, { filename: 'shared.csv', contentType: 'text/csv' })
        .field('chartType', 'bar');

      await request(app.server)
        .post(`/chart/upload-and-generate-from-dataset/${chartToken2}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('file', UNIQUE_CSV_3, { filename: 'shared.csv', contentType: 'text/csv' })
        .field('chartType', 'line');

      const chart1 = await (app as any).prisma.chart.findUnique({
        where: { token: chartToken1 },
      });
      const chart2 = await (app as any).prisma.chart.findUnique({
        where: { token: chartToken2 },
      });
      
      assert.equal(chart1.datasetSourceId, chart2.datasetSourceId);
      const sharedSourceId = chart1.datasetSourceId;

      // Overwrite chart1's dataset
      await request(app.server)
        .post(`/chart/upload-and-generate-from-dataset/${chartToken1}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('file', SCATTER_CSV, { filename: 'new.csv', contentType: 'text/csv' })
        .field('chartType', 'scatter');

      // The original dataset source should still exist because chart2 still references it
      const sharedSourceAfter = await (app as any).prisma.datasetSource.findUnique({
        where: { id: sharedSourceId },
      });
      assert.ok(sharedSourceAfter, 'The shared DatasetSource should not be deleted because chart2 still references it');
    });
  });
});
