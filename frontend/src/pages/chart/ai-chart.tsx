import { useState, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";

import { handleUnauthorized } from "@/lib/handleUnauthorized";

import {
  Check,
  Sparkles,
  Brain,
  Lightbulb,
  Loader2,
  ArrowUp,
  Clock,
} from "lucide-react";

import defaultUserPicture from "@/assets/user.png";

import { Button } from "@/components/ui/button";
import { OptionToggle } from "@/components/ui/option-toggle";
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
  initialVersions = [],
  initialActiveVersionId = null,
}: {
  initialData: ChartConfig | null;
  initialName?: string;
  initialVersions?: any[];
  initialActiveVersionId?: number | null;
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
  const [versions, setVersions] = useState(initialVersions);
  const [activeVersionId, setActiveVersionId] = useState(
    initialActiveVersionId,
  );
  const [useMemory, setUseMemory] = useState(false);
  const [thinkingMode, setThinkingMode] = useState(false);
  const retriedRef = useRef(false);

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
      if (!retriedRef.current && fetchResult.statusCode === 401) {
        await handleUnauthorized(retriedRef, navigate, generate);
        return;
      } else {
        setFetchError(fetchResult.errorMessage);
      }
    } else {
      if (fetchResult.data.chartData) {
        setFetchError("");
        setChartData(fetchResult.data.chartData);
        if (fetchResult.data.versionId) {
          const newVersion = {
            id: fetchResult.data.versionId,
            prompt: fetchResult.data.prompt,
            config: fetchResult.data.chartData,
            createdAt: new Date().toISOString(),
          };
          setVersions((prev) => [newVersion, ...prev].slice(0, 10));
          setActiveVersionId(fetchResult.data.versionId);
        }
      }
    }

    setAwaiting(false);
  };

  const switchVersion = async (versionId: number) => {
    if (versionId === activeVersionId) return;
    setAwaiting(true);
    const result = await chartService.switchActiveVersion(token!, versionId);
    if (!result.errorMessage && result.data.chartData) {
      setChartData(result.data.chartData);
      setActiveVersionId(versionId);
    }
    setAwaiting(false);
  };

  const saveName = async () => {
    const result = await chartService.rename(token!, chartName);
    if (!result.errorMessage) {
      setSavedName(chartName);
    }
  };

  const canSubmit = !!prompt.trim() && !awaiting;

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-white to-gray-50/40">
      <Header2 userPicture={userPicture || defaultUserPicture} />

      <div className="flex flex-1">
        
        <div className="w-64 bg-white/50 border-r hidden md:flex flex-col shrink-0 p-4 z-10 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-4 text-gray-700 font-semibold shrink-0">
            <Clock className="w-4 h-4" />
            <h2>History</h2>
          </div>
          <div className="flex flex-col gap-3">
            {versions.map((v) => (
              <button
                key={v.id}
                onClick={() => switchVersion(v.id)}
                disabled={awaiting}
                className={`flex flex-col text-left p-3 rounded-xl border text-sm transition-all duration-200 cursor-pointer ${
                  v.id === activeVersionId
                    ? "border-blue-500 bg-blue-50/80 shadow-sm"
                    : "border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm"
                } ${awaiting ? "opacity-60 cursor-not-allowed" : ""}`}
              >
                <span className="font-medium text-gray-800 line-clamp-2 w-full break-words">
                  {v.prompt || "Initial Generation"}
                </span>
                <span className="text-xs text-gray-500 mt-1.5 font-medium">
                  {new Date(v.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col flex-1 overflow-x-hidden">
          <div className="flex flex-col flex-1 items-center px-4 sm:px-6 lg:px-8 pb-4 pt-2 sm:pt-3 lg:pt-4 min-h-0">
            
            <div className="flex w-full max-w-7xl flex-col mb-2 items-start shrink-0">
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

            <div className="relative w-full max-w-7xl h-[60vh] min-h-[400px] lg:h-[648px] shrink-0">
              <div className="h-full w-full border shadow-sm rounded-3xl overflow-x-auto overflow-y-hidden bg-white">
                {mergedOption ? (
                  <div className="h-full min-w-[640px] lg:min-w-0 w-full">
                    {/* @ts-expect-error - echarts-for-react typings are incompatible with React 19 */}
                    <ReactECharts
                      option={mergedOption}
                      style={{ height: "100%", width: "100%" }}
                      notMerge={true}
                      lazyUpdate={true}
                    />
                  </div>
                ) : (
                  !awaiting && (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 px-6 text-center">
                      <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-100 mb-4">
                        <Sparkles
                          strokeWidth={1.5}
                          className="w-7 h-7 text-gray-500"
                        />
                      </div>
                      <p className="text-sm font-medium text-gray-600">
                        Describe a chart to get started
                      </p>
                      <p className="text-xs text-gray-400 mt-1 max-w-xs">
                        Tell the AI what you want to visualize and it will build
                        the chart for you.
                      </p>
                    </div>
                  )
                )}
              </div>
              {awaiting && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/70 backdrop-blur-[1px] rounded-3xl pointer-events-none">
                  <Loader2
                    strokeWidth={1.5}
                    className="w-8 h-8 animate-spin text-gray-500"
                  />
                  <span className="mt-3 text-sm text-gray-500">
                    Generating your chart...
                  </span>
                </div>
              )}
            </div>

            <div className="flex w-full max-w-3xl mt-6 mb-3 shrink-0">
              <div className="flex flex-col w-full rounded-3xl border bg-white shadow-sm px-4 pt-3 pb-2.5 gap-2 transition-colors focus-within:border-gray-300 focus-within:shadow-md">
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
                    if (e.key === "Enter" && !e.shiftKey && canSubmit) {
                      e.preventDefault();
                      generate();
                    }
                  }}
                  placeholder="Describe the chart you want to generate..."
                  maxLength={5000}
                  className="w-full resize-none bg-transparent outline-none text-base leading-relaxed max-h-[200px] overflow-y-auto placeholder:text-gray-400"
                />
                {fetchError && (
                  <span className="text-xs text-red-500">{fetchError}</span>
                )}
                <div className="flex flex-wrap justify-between items-center gap-2">
                  <div className="flex items-center gap-2">
                    <OptionToggle
                      active={useMemory}
                      onChange={setUseMemory}
                      Icon={Brain}
                      label="Memory"
                      tooltip="Includes the current chart configuration in the request, allowing the AI to modify or extend the existing visualisation."
                    />
                    <OptionToggle
                      active={thinkingMode}
                      onChange={setThinkingMode}
                      Icon={Lightbulb}
                      label="Thinking"
                      tooltip="Enables extended reasoning before generating the chart. Produces more accurate results for complex requests, but takes longer."
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      className="cursor-pointer rounded-full min-w-[44px] h-9"
                      disabled={!canSubmit}
                      onClick={generate}
                      title="Generate"
                    >
                      {awaiting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <ArrowUp strokeWidth={2} className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};