import { Sparkles, Settings } from "lucide-react";

export const ChartOptionsShowcase = () => {
  return (
    <div className="w-full max-w-md flex flex-col gap-5">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">
          Create charts your way
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Two ways to bring your data to life
        </p>
      </div>

      <div className="flex flex-col items-start text-left p-6 border rounded-2xl bg-white">
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gray-100">
          <Sparkles strokeWidth={1.5} className="w-6 h-6 text-gray-700" />
        </div>
        <h3 className="mt-5 text-xl font-semibold text-gray-900">
          Generate with AI
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-gray-600">
          Describe the chart you want in plain language and an AI model will
          build it for you. Iterate with follow-up prompts and refine your
          visualization turn by turn.
        </p>
      </div>

      <div className="flex flex-col items-start text-left p-6 border rounded-2xl bg-white">
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gray-100">
          <Settings strokeWidth={1.5} className="w-6 h-6 text-gray-700" />
        </div>
        <h3 className="mt-5 text-xl font-semibold text-gray-900">
          Build manually
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-gray-600">
          Configure each chart field by hand. Choose from bar, line, area, pie,
          scatter, or radar, supply your own data, and watch the chart update
          live as you edit.
        </p>
      </div>
    </div>
  );
};
