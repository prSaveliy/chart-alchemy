import { useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  BarChart2,
  TrendingUp,
  PieChart,
  Activity,
  Check,
  Loader2,
  UploadCloud,
  FileSpreadsheet,
  X,
} from "lucide-react";
import ReactECharts from "echarts-for-react";

import defaultUserPicture from "@/assets/user.png";
import { Header2 } from "@/components/layout/header2";

import { handleUnauthorized } from "@/lib/handleUnauthorized";

import chartService from "@/services/chartService";

import type { ChartConfig } from "@/commons/schemas/chartConfig.schema";
import type {
  DatasetChartProps,
  DatasetChartType,
  DatasetField,
  DatasetGenerationResult,
} from "@/commons/interfaces/chartInterfaces";

const CHART_TYPES: {
  type: DatasetChartType;
  label: string;
  Icon: React.ElementType;
}[] = [
  { type: "bar", label: "Bar", Icon: BarChart2 },
  { type: "line", label: "Line", Icon: TrendingUp },
  { type: "pie", label: "Pie", Icon: PieChart },
  { type: "scatter", label: "Scatter", Icon: Activity },
];

const DEFAULT_TOOLBOX = {
  show: true,
  right: 10,
  bottom: 10,
  itemSize: 20,
  feature: {
    restore: { title: "Restore" },
    saveAsImage: { title: "Save as image", type: "png", pixelRatio: 2 },
  },
};

const ACCEPTED = ".csv,.xlsx";
const MAX_FILE_BYTES = 5 * 1024 * 1024;

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const fileExtension = (name: string): string =>
  name.split(".").pop()?.toUpperCase() ?? "";

const fieldBadgeColor: Record<DatasetField["type"], string> = {
  number: "bg-blue-100 text-blue-700",
  string: "bg-gray-100 text-gray-700",
  boolean: "bg-purple-100 text-purple-700",
  date: "bg-emerald-100 text-emerald-700",
  mixed: "bg-amber-100 text-amber-700",
};

const xAxisLabel = (chartType: DatasetChartType) => {
  if (chartType === "pie") return "Name field";
  if (chartType === "scatter") return "X field";
  return "Category field";
};

const yAxisLabel = (chartType: DatasetChartType) => {
  if (chartType === "pie") return "Value field";
  if (chartType === "scatter") return "Y field";
  return "Value field";
};

export const DatasetChart = ({
  initialName,
  initialData,
}: DatasetChartProps) => {
  const { token } = useParams();
  const navigate = useNavigate();
  const retriedRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [chartName, setChartName] = useState(initialName ?? "");
  const [savedName, setSavedName] = useState(initialName ?? "");

  const [file, setFile] = useState<File | null>(null);
  const [chartType, setChartType] = useState<DatasetChartType>("bar");
  const [fields, setFields] = useState<DatasetField[]>([]);
  const [xField, setXField] = useState<string>("");
  const [yField, setYField] = useState<string>("");
  const [truncated, setTruncated] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const [chartData, setChartData] = useState<ChartConfig | null>(
    initialData ?? null,
  );

  const [generateError, setGenerateError] = useState("");
  const [generating, setGenerating] = useState(false);

  const userPicture = localStorage.getItem("picture");

  const mergedOption = useMemo(
    () =>
      chartData?.option
        ? { ...chartData.option, toolbox: DEFAULT_TOOLBOX }
        : null,
    [chartData],
  );

  const onPickFile = (next: File | null) => {
    setGenerateError("");
    if (next) {
      const ext = next.name.split(".").pop()?.toLowerCase();
      if (ext !== "csv" && ext !== "xlsx") {
        setGenerateError("Unsupported file type. Use CSV or XLSX.");
        return;
      }
      if (next.size > MAX_FILE_BYTES) {
        setFile(null);
        setGenerateError("File too large. Max size is 5 MB.");
        return;
      }
    }
    setFile(next);
    setXField("");
    setYField("");
    if (next) generate(next, chartType, "", "");
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files?.[0] ?? null;
    if (dropped) onPickFile(dropped);
  };

  const generate = async (
    fileArg?: File,
    chartTypeArg?: DatasetChartType,
    xFieldArg?: string,
    yFieldArg?: string,
  ) => {
    const f = fileArg ?? file;
    const ct = chartTypeArg ?? chartType;
    const xf = xFieldArg !== undefined ? xFieldArg : xField;
    const yf = yFieldArg !== undefined ? yFieldArg : yField;
    if (!f) return;
    setGenerateError("");
    setGenerating(true);

    try {
      const fetchResult = await chartService.generateFromDataset(
        f,
        token!,
        ct,
        xf || undefined,
        yf || undefined,
      );

      if (fetchResult.errorMessage) {
        if (!retriedRef.current && fetchResult.statusCode === 401) {
          await handleUnauthorized(retriedRef, navigate, generate);
          return;
        }
        setGenerateError(fetchResult.errorMessage);
        return;
      }

      const result = fetchResult.data as DatasetGenerationResult;
      setChartData(result.chartData);
      setFields(result.fields);
      setXField(result.selectedXField);
      setYField(result.selectedYField);
      setTruncated(result.truncated);
    } finally {
      setGenerating(false);
    }
  };

  const saveName = async () => {
    const result = await chartService.rename(token!, chartName);
    if (!result.errorMessage) setSavedName(chartName);
  };

  return (
    <div className="flex flex-col w-full min-h-screen lg:h-screen">
      <Header2 userPicture={userPicture || defaultUserPicture} />

      <div className="flex flex-col lg:flex-row flex-1 items-stretch lg:items-start justify-center gap-6 p-4 sm:p-6 lg:p-8 lg:overflow-hidden">
        {/* Left panel */}
        <div className="flex flex-col w-full lg:w-96 lg:shrink-0 gap-4 lg:h-full lg:overflow-y-auto lg:pr-2">
          {/* Chart name */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={chartName}
              onChange={(e) => setChartName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveName();
              }}
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

          {/* File upload */}
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
              Dataset file
            </p>
            {!file ? (
              <div
                role="button"
                tabIndex={0}
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    fileInputRef.current?.click();
                  }
                }}
                onDragOver={handleDragOver}
                onDragEnter={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-colors outline-none ${
                  isDragging
                    ? "border-black bg-black/5"
                    : "border-gray-300 hover:border-gray-400"
                }`}
              >
                <UploadCloud
                  strokeWidth={1.5}
                  className="w-6 h-6 text-gray-500 mb-1.5 pointer-events-none"
                />
                <span className="text-sm text-gray-600 pointer-events-none">
                  Click to upload or drop a file
                </span>
                <span className="text-xs text-gray-400 mt-0.5 pointer-events-none">
                  CSV or XLSX · up to 5 MB
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPTED}
                  className="hidden"
                  onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
                />
              </div>
            ) : (
              <div className="flex items-center justify-between gap-2 px-3 py-2.5 border rounded-xl">
                <div className="flex items-center gap-2 min-w-0">
                  <FileSpreadsheet
                    strokeWidth={1.5}
                    className="w-4 h-4 text-gray-600 shrink-0"
                  />
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm text-gray-800 truncate">
                      {file.name}
                    </span>
                    <span className="text-xs text-gray-400">
                      {fileExtension(file.name)} · {formatFileSize(file.size)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => onPickFile(null)}
                  disabled={generating}
                  title="Remove file"
                  className="text-gray-400 hover:text-red-500 transition-colors cursor-pointer shrink-0 disabled:opacity-40 disabled:pointer-events-none"
                >
                  <X size={14} />
                </button>
              </div>
            )}
            {generateError && (
              <span className="mt-1.5 block text-xs text-red-500">{generateError}</span>
            )}
          </div>

          {/* Chart type picker */}
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
              Chart type
            </p>
            <div className="grid grid-cols-4 gap-2">
              {CHART_TYPES.map(({ type, label, Icon }) => (
                <button
                  key={type}
                  onClick={() => {
                    setChartType(type);
                    if (file) generate(file, type, xField, yField);
                  }}
                  disabled={generating}
                  className={`flex flex-col items-center justify-center gap-1.5 h-16 rounded-xl border-2 cursor-pointer transition-colors disabled:opacity-40 disabled:pointer-events-none ${
                    chartType === type
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

          {/* Field selectors */}
          {fields.length > 0 && (
            <div className="flex flex-col gap-3">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Fields
              </p>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">
                  {xAxisLabel(chartType)}
                </label>
                <select
                  value={xField}
                  onChange={(e) => {
                    setXField(e.target.value);
                    generate(undefined, undefined, e.target.value, yField);
                  }}
                  disabled={generating}
                  className="w-full h-9 rounded-md border bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[1px] cursor-pointer disabled:opacity-40"
                >
                  {fields.map((f) => (
                    <option key={f.name} value={f.name}>
                      {f.name} ({f.type})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">
                  {yAxisLabel(chartType)}
                </label>
                <select
                  value={yField}
                  onChange={(e) => {
                    setYField(e.target.value);
                    generate(undefined, undefined, xField, e.target.value);
                  }}
                  disabled={generating}
                  className="w-full h-9 rounded-md border bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[1px] cursor-pointer disabled:opacity-40"
                >
                  {fields.map((f) => (
                    <option key={f.name} value={f.name}>
                      {f.name} ({f.type})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}


          {/* Detected fields */}
          {fields.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                Detected fields
              </p>
              <ul className="flex flex-col gap-1.5">
                {fields.map((field) => (
                  <li
                    key={field.name}
                    className="flex items-center justify-between gap-2 px-3 py-2 border rounded-lg"
                  >
                    <span className="text-sm text-gray-800 truncate">
                      {field.name}
                    </span>
                    <span
                      className={`text-[10px] font-medium uppercase tracking-wide px-1.5 py-0.5 rounded ${fieldBadgeColor[field.type]}`}
                    >
                      {field.type}
                    </span>
                  </li>
                ))}
              </ul>
              {truncated && (
                <p className="mt-2 text-xs text-amber-600">
                  Dataset truncated to first 5,000 rows.
                </p>
              )}
            </div>
          )}

        </div>

        {/* Right panel — preview */}
        <div className="w-full lg:flex-1 border shadow-sm rounded-3xl h-[80vh] lg:h-full lg:min-h-full overflow-x-auto overflow-y-hidden lg:overflow-hidden">
          <div className="relative h-full min-w-[640px] lg:min-w-0">
            {generating && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 rounded-3xl">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
              </div>
            )}
            {mergedOption ? (
              /* @ts-expect-error - echarts-for-react typings are incompatible with React 19 */
              <ReactECharts
                option={mergedOption}
                style={{ height: "100%", width: "100%" }}
                notMerge={true}
                lazyUpdate={true}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 text-sm">
                <FileSpreadsheet
                  strokeWidth={1.25}
                  className="w-10 h-10 mb-3"
                />
                Upload a dataset to visualize your data.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
