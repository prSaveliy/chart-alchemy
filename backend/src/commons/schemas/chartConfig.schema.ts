import { z } from 'zod';

// ─── Reusable primitives ──────────────────────────────────────────────────────

const colorPalette = z.array(z.string());

const textStyleSchema = z.looseObject({
  fontFamily: z.string().optional(),
  fontSize: z.number().optional(),
  fontWeight: z.union([z.string(), z.number()]).optional(),
  color: z.string().optional(),
});

const lineStyleSchema = z.looseObject({
  color: z.string().optional(),
  width: z.number().optional(),
  type: z.string().optional(),
});

const axisSchema = z.looseObject({
  type: z.enum(['category', 'value', 'time', 'log']).optional(),
  data: z.array(z.union([z.string(), z.number()])).optional(),
  axisLine: z.looseObject({ lineStyle: lineStyleSchema }).optional(),
  splitLine: z.looseObject({ lineStyle: lineStyleSchema }).optional(),
  axisLabel: z.looseObject({ formatter: z.string().optional() }).optional(),
  name: z.string().optional(),
  min: z.union([z.number(), z.string()]).optional(),
  max: z.union([z.number(), z.string()]).optional(),
});

const gridSchema = z.looseObject({
  containLabel: z.boolean().optional(),
  left: z.union([z.string(), z.number()]).optional(),
  right: z.union([z.string(), z.number()]).optional(),
  top: z.union([z.string(), z.number()]).optional(),
  bottom: z.union([z.string(), z.number()]).optional(),
});

const tooltipSchema = z.looseObject({
  trigger: z.enum(['item', 'axis', 'none']).optional(),
  confine: z.boolean().optional(),
  formatter: z.string().optional(),
  backgroundColor: z.string().optional(),
  borderWidth: z.number().optional(),
  borderColor: z.string().optional(),
  textStyle: textStyleSchema.optional(),
});

const legendSchema = z.looseObject({
  show: z.boolean().optional(),
  type: z.enum(['plain', 'scroll']).optional(),
  top: z.union([z.string(), z.number()]).optional(),
  bottom: z.union([z.string(), z.number()]).optional(),
  left: z.union([z.string(), z.number()]).optional(),
  right: z.union([z.string(), z.number()]).optional(),
  textStyle: textStyleSchema.optional(),
});

const titleSchema = z.looseObject({
  text: z.string().optional(),
  left: z.union([z.string(), z.number()]).optional(),
  top: z.union([z.string(), z.number()]).optional(),
  textStyle: textStyleSchema.optional(),
});

// ─── Series ───────────────────────────────────────────────────────────────────

const seriesItemSchema = z.looseObject({
  type: z.enum([
    'line', 'bar', 'scatter', 'pie', 'radar', 'map',
    'candlestick', 'boxplot', 'effectScatter', 'parallel',
    'sankey', 'funnel', 'gauge', 'pictorialBar', 'themeRiver',
    'sunburst', 'tree', 'treemap', 'graph', 'heatmap', 'custom',
  ]),
  name: z.string().optional(),
  data: z.array(z.unknown()).optional(),
  coordinateSystem: z.string().optional(),
  smooth: z.boolean().optional(),
  stack: z.string().optional(),
  roseType: z.string().optional(),
  radius: z.union([z.string(), z.array(z.string())]).optional(),
  label: z.looseObject({ show: z.boolean().optional() }).optional(),
  itemStyle: z.looseObject({ borderRadius: z.unknown().optional() }).optional(),
  barMaxWidth: z.number().optional(),
  symbolSize: z.union([z.number(), z.string()]).optional(),
  orient: z.string().optional(),
  layout: z.string().optional(),
  roam: z.boolean().optional(),
  nodes: z.array(z.unknown()).optional(),
  links: z.array(z.unknown()).optional(),
  force: z.unknown().optional(),
  progress: z.looseObject({ show: z.boolean().optional() }).optional(),
  detail: z.looseObject({ valueAnimation: z.boolean().optional(), formatter: z.string().optional() }).optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  sort: z.string().optional(),
});

// ─── ECharts option ───────────────────────────────────────────────────────────

export const echartsOptionSchema = z.looseObject({
  backgroundColor: z.string().optional(),
  animation: z.boolean().optional(),
  animationDuration: z.number().optional(),
  animationEasing: z.string().optional(),
  color: colorPalette.optional(),
  textStyle: textStyleSchema.optional(),
  title: titleSchema.optional(),
  tooltip: tooltipSchema.optional(),
  legend: legendSchema.optional(),
  grid: gridSchema.optional(),
  xAxis: z.union([axisSchema, z.array(axisSchema)]).optional(),
  yAxis: z.union([axisSchema, z.array(axisSchema)]).optional(),
  polar: z.looseObject({ radius: z.array(z.string()).optional() }).optional(),
  angleAxis: axisSchema.optional(),
  radiusAxis: axisSchema.optional(),
  radar: z.looseObject({
    indicator: z.array(z.looseObject({ name: z.string(), max: z.number().optional() })),
  }).optional(),
  calendar: z.looseObject({ range: z.union([z.string(), z.array(z.string())]) }).optional(),
  visualMap: z.union([z.looseObject({}), z.array(z.looseObject({}))]).optional(),
  singleAxis: z.looseObject({}).optional(),
  parallelAxis: z.array(z.looseObject({})).optional(),
  series: z.array(seriesItemSchema).optional(),
  toolbox: z.looseObject({}).optional(),
});

// ─── Top-level chart config ───────────────────────────────────────────────────

/**
 * The shape returned by Gemini and stored in the DB.
 * `{ option: EChartsOption }`
 */
export const chartConfigSchema = z.object({
  option: echartsOptionSchema,
});

export type EChartsOption = z.infer<typeof echartsOptionSchema>;
export type ChartConfig = z.infer<typeof chartConfigSchema>;
