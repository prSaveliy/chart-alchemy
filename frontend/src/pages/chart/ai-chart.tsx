import { useState, useRef } from "react";
import { useParams } from "react-router-dom";

import defaultUserPicture from "@/assets/user.png";

import { Button } from "@/components/ui/button";
import { Header2 } from "@/components/layout/header2";

import ReactECharts from "echarts-for-react";

import chartService from "@/services/chartService";
import { unauthorizedInterceptor } from "@/lib/interceptors";

export const AIChart = ({ initialData }: { initialData: any }) => {
  const { token } = useParams();
  const [prompt, setPrompt] = useState("");
  const [awaiting, setAwaiting] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [chartData, setChartData] = useState<any>(initialData || {});
  const retried = useRef(false);

  const userPicture = localStorage.getItem("picture");

  const generate = async () => {
    setAwaiting(true);

    const fetchResult = await chartService.generate(prompt, "test", token!);

    if (fetchResult.errorMessage) {
      if (!retried.current && fetchResult.statusCode === 401) {
        await unauthorizedInterceptor();
        retried.current = true;
        await generate();
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

  return (
    <div className="flex flex-col w-full min-h-screen">
      <Header2 userPicture={userPicture || defaultUserPicture} />
      <div className="flex flex-1">
        <div className="flex flex-col flex-1 items-center mt-6">
          <div className="flex w-380 h-162 border shadow-sm rounded-3xl justify-center items-center">
            {chartData?.option && (
              <div className="flex">
                {/* @ts-expect-error - echarts-for-react typings are incompatible with React 19 */}
                <ReactECharts
                  option={chartData.option}
                  style={{ height: "600px", width: "900px" }}
                  notMerge={true}
                  lazyUpdate={true}
                />
              </div>
            )}
          </div>

          <div className="flex w-full max-w-3xl px-4 mt-4 mb-6">
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
              <div className="flex justify-between items-center">
                {fetchError && (
                  <span className="text-xs text-red-500">{fetchError}</span>
                )}
                <div className="ml-auto">
                  <Button
                    type="button"
                    size="sm"
                    className="cursor-pointer rounded-full"
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
      </div>
    </div>
  );
};
