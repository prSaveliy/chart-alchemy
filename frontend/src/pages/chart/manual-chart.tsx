import { useState, useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";

import { handleUnauthorized } from "@/lib/handleUnauthorized";

import { Check, Plus, Trash2, BarChart2, TrendingUp, PieChart, Radar, Activity, Layers, Save } from "lucide-react";
import ReactECharts from "echarts-for-react";

import defaultUserPicture from "@/assets/user.png";
import { Header2 } from "@/components/layout/header2";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import chartService from "@/services/chartService";
import type { ManualChartType } from "@/services/chartService";
import type { EChartsOption } from "@/commons/schemas/chartConfig.schema";
import type {
  PieEntry,
  RadarIndicator,
  ManualChartProps,
} from "@/commons/interfaces/chartInterfaces";
import { parseManualChartState } from "@/lib/parseManualChartState";

const CHART_TYPES: { type: ManualChartType; label: string; Icon: React.ElementType }[] = [
  { type: "bar", label: "Bar", Icon: BarChart2 },
  { type: "line", label: "Line", Icon: TrendingUp },
  { type: "area", label: "Area", Icon: Layers },
  { type: "pie", label: "Pie", Icon: PieChart },
  { type: "scatter", label: "Scatter", Icon: Activity },
  { type: "radar", label: "Radar", Icon: Radar },
];

const DEFAULT_TOOLBOX = {
  show: true,
  right: 20,
  top: 0,
  itemSize: 20,
  feature: {
    saveAsImage: { title: "Save as image", type: "png", pixelRatio: 2 },
  },
};

export const ManualChart = ({
  initialName,
  initialData,
  initialType,
}: ManualChartProps) => {
  const { token } = useParams();
  const navigate = useNavigate();
  const retried = useRef(false);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const initial = useMemo(
    () => parseManualChartState(initialData?.option, initialType),
    [initialData, initialType],
  );

  const [chartName, setChartName] = useState(initialName ?? "");
  const [savedName, setSavedName] = useState(initialName ?? "");

  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");

  const [selectedType, setSelectedType] = useState<ManualChartType>(initial.type);

  // Line / Bar / Area state
  const [categories, setCategories] = useState(initial.categories);
  const [seriesName, setSeriesName] = useState(initial.seriesName);
  const [seriesValues, setSeriesValues] = useState(initial.seriesValues);
  const [smooth, setSmooth] = useState(initial.smooth);

  // Pie state
  const [pieEntries, setPieEntries] = useState<PieEntry[]>(initial.pieEntries);

  // Scatter state
  const [scatterPoints, setScatterPoints] = useState(initial.scatterPoints);

  // Radar state
  const [radarIndicators, setRadarIndicators] = useState<RadarIndicator[]>(
    initial.radarIndicators,
  );
  const [radarSeriesName, setRadarSeriesName] = useState(initial.radarSeriesName);
  const [radarValues, setRadarValues] = useState(initial.radarValues);

  const option = useMemo((): EChartsOption => {
    const base: EChartsOption = { toolbox: DEFAULT_TOOLBOX, tooltip: { trigger: "item" } };

    if (selectedType === "bar" || selectedType === "line" || selectedType === "area") {
      const cats = categories.split(",").map((c) => c.trim()).filter(Boolean);
      const vals = seriesValues.split(",").map((v) => Number(v.trim())).filter((n) => !isNaN(n));
      return {
        ...base,
        tooltip: { trigger: "axis" },
        xAxis: { type: "category", data: cats },
        yAxis: { type: "value" },
        series: [
          {
            type: selectedType === "area" ? "line" : selectedType,
            name: seriesName,
            data: vals,
            smooth: smooth,
            ...(selectedType === "area" ? { areaStyle: {} } : {}),
          },
        ],
      };
    }

    if (selectedType === "pie") {
      const data = pieEntries
        .filter((e) => e.name.trim())
        .map((e) => ({ name: e.name.trim(), value: Number(e.value) || 0 }));
      return {
        ...base,
        series: [{ type: "pie", name: "Data", radius: "60%", data }],
      };
    }

    if (selectedType === "scatter") {
      const points = scatterPoints
        .split("\n")
        .map((line) => line.split(",").map((v) => Number(v.trim())))
        .filter((p) => p.length === 2 && !isNaN(p[0]) && !isNaN(p[1]));
      return {
        ...base,
        tooltip: { trigger: "item" },
        xAxis: { type: "value" },
        yAxis: { type: "value" },
        series: [{ type: "scatter", data: points, symbolSize: 10 }],
      };
    }

    if (selectedType === "radar") {
      const indicator = radarIndicators
        .filter((i) => i.name.trim())
        .map((i) => ({ name: i.name.trim(), max: Number(i.max) || 100 }));
      const vals = radarValues.split(",").map((v) => Number(v.trim())).filter((n) => !isNaN(n));
      return {
        ...base,
        radar: { indicator },
        series: [{ type: "radar", data: [{ name: radarSeriesName, value: vals }] }],
      };
    }

    return base;
  }, [
    selectedType,
    categories, seriesName, seriesValues, smooth,
    pieEntries,
    scatterPoints,
    radarIndicators, radarSeriesName, radarValues,
  ]);

  const saveName = async () => {
    const result = await chartService.rename(token!, chartName);
    if (!result.errorMessage) {
      setSavedName(chartName);
    }
  };

  const saveChart = async () => {
    setIsSaving(true);

    const fetchResult = await chartService.saveConfig(
      token!,
      { option },
      selectedType,
    );

    if (fetchResult.errorMessage) {
      if (!retried.current && fetchResult.statusCode === 401) {
        await handleUnauthorized(retried, navigate, saveChart);
        return;
      } else {
        setSaveError(fetchResult.errorMessage);
      }
    } else {
      setSaveError("");
      setSaved(true);
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
      savedTimerRef.current = setTimeout(() => setSaved(false), 2000);
    }

    setIsSaving(false);
  };

  const userPicture = localStorage.getItem("picture");

  return (
    <div className="flex flex-col w-full h-screen">
      <div
        className={`fixed top-4 left-1/2 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-black text-white text-sm shadow-lg transition-all duration-300 ease-out ${
          saved
            ? "opacity-100 -translate-x-1/2 translate-y-0"
            : "opacity-0 -translate-x-1/2 -translate-y-3 pointer-events-none"
        }`}
      >
        <Check size={14} />
        Chart saved
      </div>
      <Header2 userPicture={userPicture || defaultUserPicture} />

      <div className="flex flex-1 items-start justify-center gap-6 p-8 overflow-hidden">
        {/* Left panel */}
        <div className="flex flex-col w-96 shrink-0 gap-4 h-full overflow-y-auto pr-2">
          {/* Chart name */}
          <div className="flex items-center gap-2">
            <input
              id="chart-name"
              type="text"
              value={chartName}
              onChange={(e) => setChartName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") saveName(); }}
              placeholder="Untitled chart"
              maxLength={255}
              className="flex-1 text-xl font-semibold text-gray-800 bg-transparent outline-none placeholder:text-gray-300 border-b-2 border-transparent focus:border-gray-200 transition-colors duration-150 pb-1 truncate"
            />
            {chartName !== savedName && chartName.trim() && (
              <button
                onClick={saveName}
                title="Save name"
                className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer"
              >
                <Check size={13} className="text-gray-600" />
              </button>
            )}
          </div>

          {/* Chart type picker */}
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Chart type</p>
            <div className="grid grid-cols-3 gap-2">
              {CHART_TYPES.map(({ type, label, Icon }) => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`flex flex-col items-center justify-center gap-1.5 h-16 rounded-xl border-2 cursor-pointer transition-colors ${
                    selectedType === type
                      ? "border-black bg-black/5"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <Icon strokeWidth={1.5} className="w-5 h-5" />
                  <span className="text-xs font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Config form */}
          <div className="flex flex-col gap-3">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Data</p>

            {(selectedType === "bar" || selectedType === "line" || selectedType === "area") && (
              <div className="flex flex-col gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Categories (comma-separated)</label>
                  <Input
                    value={categories}
                    onChange={(e) => setCategories(e.target.value)}
                    placeholder="Jan,Feb,Mar"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Series name</label>
                  <Input
                    value={seriesName}
                    onChange={(e) => setSeriesName(e.target.value)}
                    placeholder="Series 1"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Values (comma-separated)</label>
                  <Input
                    value={seriesValues}
                    onChange={(e) => setSeriesValues(e.target.value)}
                    placeholder="10,20,30"
                  />
                </div>
                {(selectedType === "line" || selectedType === "area") && (
                  <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={smooth}
                      onChange={(e) => setSmooth(e.target.checked)}
                      className="w-3.5 h-3.5 accent-black cursor-pointer"
                    />
                    Smooth curve
                  </label>
                )}
              </div>
            )}

            {selectedType === "pie" && (
              <div className="flex flex-col gap-2">
                {pieEntries.map((entry, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Input
                      value={entry.name}
                      onChange={(e) => {
                        const next = [...pieEntries];
                        next[i] = { ...next[i], name: e.target.value };
                        setPieEntries(next);
                      }}
                      placeholder="Name"
                      className="flex-1"
                    />
                    <Input
                      value={entry.value}
                      onChange={(e) => {
                        const next = [...pieEntries];
                        next[i] = { ...next[i], value: e.target.value };
                        setPieEntries(next);
                      }}
                      placeholder="Value"
                      className="w-20"
                    />
                    <button
                      onClick={() => setPieEntries(pieEntries.filter((_, idx) => idx !== i))}
                      className="text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="cursor-pointer w-full"
                  onClick={() => setPieEntries([...pieEntries, { name: "", value: "0" }])}
                >
                  <Plus size={14} className="mr-1" /> Add slice
                </Button>
              </div>
            )}

            {selectedType === "scatter" && (
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Points (x,y — one per line)</label>
                <textarea
                  value={scatterPoints}
                  onChange={(e) => setScatterPoints(e.target.value)}
                  rows={6}
                  placeholder={"10,20\n30,50\n60,40"}
                  className="w-full resize-none rounded-md border bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[1px] placeholder:text-muted-foreground"
                />
              </div>
            )}

            {selectedType === "radar" && (
              <div className="flex flex-col gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Series name</label>
                  <Input
                    value={radarSeriesName}
                    onChange={(e) => setRadarSeriesName(e.target.value)}
                    placeholder="Stats"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-2 block">Indicators</label>
                  <div className="flex flex-col gap-2">
                    {radarIndicators.map((ind, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <Input
                          value={ind.name}
                          onChange={(e) => {
                            const next = [...radarIndicators];
                            next[i] = { ...next[i], name: e.target.value };
                            setRadarIndicators(next);
                          }}
                          placeholder="Name"
                          className="flex-1"
                        />
                        <Input
                          value={ind.max}
                          onChange={(e) => {
                            const next = [...radarIndicators];
                            next[i] = { ...next[i], max: e.target.value };
                            setRadarIndicators(next);
                          }}
                          placeholder="Max"
                          className="w-20"
                        />
                        <button
                          onClick={() => setRadarIndicators(radarIndicators.filter((_, idx) => idx !== i))}
                          className="text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="cursor-pointer w-full"
                      onClick={() => setRadarIndicators([...radarIndicators, { name: "", max: "100" }])}
                    >
                      <Plus size={14} className="mr-1" /> Add indicator
                    </Button>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Values (comma-separated)</label>
                  <Input
                    value={radarValues}
                    onChange={(e) => setRadarValues(e.target.value)}
                    placeholder="80,60,70,90,50"
                  />
                </div>
              </div>
            )}
          </div>

          <Button
            id="save-chart-btn"
            onClick={saveChart}
            disabled={isSaving}
            className="w-full cursor-pointer"
          >
            {isSaving ? (
              <><Save size={15} className="mr-1.5 animate-pulse" /> Saving…</>
            ) : (
              <><Save size={15} className="mr-1.5" /> Save chart</>
            )}
          </Button>
          {saveError && (
            <span className="text-xs text-red-500">{saveError}</span>
          )}
        </div>

        {/* Right panel — preview */}
        <div className="flex flex-1 border shadow-sm rounded-3xl items-center justify-center min-h-full">
          <div className="flex">
            {/* @ts-expect-error - echarts-for-react typings are incompatible with React 19 */}
            <ReactECharts
              option={option}
              style={{ height: "700px", width: "1400px" }}
              notMerge={true}
              lazyUpdate={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
