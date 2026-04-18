import { ArrowRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface WorkflowChoiceCardProps {
  Icon: LucideIcon;
  title: string;
  description: string;
  cta: string;
  onClick: () => void;
}

export const WorkflowChoiceCard = ({
  Icon,
  title,
  description,
  cta,
  onClick,
}: WorkflowChoiceCardProps) => {
  return (
    <button
      onClick={onClick}
      className="group flex w-80 h-96 flex-col items-start text-left p-6 border rounded-2xl bg-white cursor-pointer transition-all duration-200 hover:border-black/40 hover:shadow-md hover:-translate-y-0.5"
    >
      <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gray-100 group-hover:bg-black transition-colors duration-200">
        <Icon
          strokeWidth={1.5}
          className="w-6 h-6 text-gray-700 group-hover:text-white transition-colors duration-200"
        />
      </div>

      <h2 className="mt-5 text-xl font-semibold text-gray-900">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-gray-600">
        {description}
      </p>

      <div className="mt-auto flex items-center gap-1.5 text-sm font-medium text-gray-700 group-hover:text-black">
        {cta}
        <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
      </div>
    </button>
  );
};
