import { useState, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";

import { handleUnauthorized } from "@/lib/handleUnauthorized";

import { Info, Check } from "lucide-react";

import defaultUserPicture from "@/assets/user.png";

import { Button } from "@/components/ui/button";
import { Header2 } from "@/components/layout/header2";

import ReactECharts from "echarts-for-react";

import chartService from "@/services/chartService";
import type { ChartConfig } from "@/commons/schemas/chartConfig.schema";

const DEFAULT_TOOLBOX = {
  show: true,
  right: 10,
  bottom: 10,
  itemSize: 20,
  feature: {
    restore: {
      title: "Restore",
    },
    saveAsImage: {
      title: "Save as image",
      type: "png",
      pixelRatio: 2,
    },
  },
};

export const AIChart = ({
  initialData,
  initialName,
}: {
  initialData: ChartConfig | null;
  initialName?: string;
}) => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState("");
  const [chartName, setChartName] = useState(initialName ?? "");
  const [savedName, setSavedName] = useState(initialName ?? "");
  const [awaiting, setAwaiting] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [chartData, setChartData] = useState<ChartConfig | null>(
    initialData ?? null,
  );
  const [useMemory, setUseMemory] = useState(false);
  const [thinkingMode, setThinkingMode] = useState(false);
  const retried = useRef(false);

  const mergedOption = useMemo(
    () =>
      chartData?.option
        ? { ...chartData.option, toolbox: DEFAULT_TOOLBOX }
        : null,
    [chartData],
  );

  const userPicture = localStorage.getItem("picture");

  const generate = async () => {
    setAwaiting(true);

    const fetchResult = await chartService.generate(
      prompt,
      token!,
      useMemory ? chartData : null,
      thinkingMode,
    );

    if (fetchResult.errorMessage) {
      if (!retried.current && fetchResult.statusCode === 401) {
        await handleUnauthorized(retried, navigate, generate);
        return;
      } else {
        setFetchError(fetchResult.errorMessage);
      }
    } else {
      if (fetchResult.data.chartData) {
        setFetchError("");
        setChartData(fetchResult.data.chartData);
      }
    }

    setAwaiting(false);
  };

  const saveName = async () => {
    const result = await chartService.rename(token!, chartName);
    if (!result.errorMessage) {
      setSavedName(chartName);
    }
  };

  return (
    <div className="flex flex-col w-full min-h-screen">
      <Header2 userPicture={userPicture || defaultUserPicture} />
      <div className="flex flex-col flex-1 items-center px-4 sm:px-6 lg:px-8 pb-0 pt-2 sm:pt-3 lg:pt-4">
        <div className="flex w-full max-w-7xl flex-col mb-2 items-start">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <input
              id="chart-name"
              type="text"
              value={chartName}
              onChange={(e) => setChartName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveName();
              }}
              placeholder="Untitled chart"
              maxLength={255}
              className="flex-1 sm:w-80 text-xl font-semibold text-gray-800 bg-transparent outline-none placeholder:text-gray-300 border-b-2 border-transparent focus:border-gray-200 transition-colors duration-150 pb-1 truncate"
            />
            {chartName !== savedName && chartName.trim() && (
              <button
                onClick={saveName}
                title="Save name"
                className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer shrink-0"
              >
                <Check size={13} className="text-gray-600" />
              </button>
            )}
          </div>
        </div>
        <div className="w-full max-w-7xl h-[60vh] min-h-[400px] lg:h-[648px] border shadow-sm rounded-3xl overflow-x-auto overflow-y-hidden">
          {mergedOption && (
            <div className="h-full min-w-[640px] lg:min-w-0 w-full">
              {/* @ts-expect-error - echarts-for-react typings are incompatible with React 19 */}
              <ReactECharts
                option={mergedOption}
                style={{ height: "100%", width: "100%" }}
                notMerge={true}
                lazyUpdate={true}
              />
            </div>
          )}
        </div>

        <div className="flex w-full max-w-3xl mt-6 mb-3">
          <div className="flex flex-col w-full rounded-3xl border bg-white shadow-sm px-4 pt-3 pb-2 gap-2">
            <textarea
              id="prompt"
              rows={1}
              value={prompt}
              onChange={(e) => {
                setPrompt(e.target.value);
                const scrollY = window.scrollY;
                e.target.style.height = "auto";
                e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
                window.scrollTo({ top: scrollY, behavior: "instant" });
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && prompt && !awaiting) {
                  e.preventDefault();
                  generate();
                }
              }}
              placeholder="Describe the chart you want to generate..."
              className="w-full resize-none bg-transparent outline-none text-base leading-relaxed max-h-[200px] overflow-y-auto placeholder:text-gray-400"
            />
            {fetchError && (
              <span className="text-xs text-red-500">{fetchError}</span>
            )}
            <div className="flex flex-wrap justify-between items-center gap-2">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <label className="flex items-center gap-1.5 text-sm text-gray-600 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={useMemory}
                      onChange={(e) => setUseMemory(e.target.checked)}
                      className="w-3.5 h-3.5 accent-black cursor-pointer"
                    />
                    Use memory
                  </label>
                  <div className="relative flex items-center group">
                    <Info size={14} className="text-gray-400 cursor-default" />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 px-3 py-2 rounded-xl bg-white border border-gray-200 text-gray-600 text-xs leading-relaxed opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 shadow-md z-50">
                      Includes the current chart configuration in the request,
                      allowing the AI to modify or extend the existing
                      visualisation.
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-200" />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <label className="flex items-center gap-1.5 text-sm text-gray-600 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={thinkingMode}
                      onChange={(e) => setThinkingMode(e.target.checked)}
                      className="w-3.5 h-3.5 accent-black cursor-pointer"
                    />
                    Thinking mode
                  </label>
                  <div className="relative flex items-center group">
                    <Info size={14} className="text-gray-400 cursor-default" />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 px-3 py-2 rounded-xl bg-white border border-gray-200 text-gray-600 text-xs leading-relaxed opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 shadow-md z-50">
                      Enables extended reasoning before generating the chart.
                      Produces more accurate results for complex requests, but
                      takes longer.
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-200" />
                    </div>
                  </div>
                </div>
              </div>
              <Button
                type="button"
                size="sm"
                className="cursor-pointer rounded-full min-w-[110px]"
                disabled={awaiting || !prompt}
                onClick={generate}
              >
                {awaiting ? "Generating..." : "Generate"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
