import type { ChartConfig } from '../../schemas/chartConfig.schema.js';

export interface AIService {
  /**
   * generate a chart configuration
   *
   * @param prompt user's prompt
   * @param memory current chart configuration
   * @param thinkingMode flag to choose a better model
   */
  generate(
    prompt: string,
    memory: ChartConfig | null,
    thinkingMode: boolean,
  ): Promise<ChartConfig>;
}
