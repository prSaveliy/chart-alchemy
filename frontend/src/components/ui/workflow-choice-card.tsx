import { ArrowRightToLine } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface WorkflowChoiceCardProps {
  Icon: LucideIcon;
  title: string;
  onCLick: () => void;
}

export const WorkflowChoiceCard = ({ Icon, title, onCLick }: WorkflowChoiceCardProps) => {
  return (
    <button className="group flex w-140 h-30 border-2 mb-6 rounded-2xl cursor-pointer items-center justify-between hover:border-black/30" onClick={onCLick}>
      <div className="flex ml-4">
        <div className="flex">
          <Icon strokeWidth={1.5} className="w-6 h-6" />
        </div>
        <div>
          <h1 className="flex text-xl font-semibold ml-3">{title}</h1>
        </div>
      </div>
      <div className="flex mr-6 group-hover:mr-4 transition-all">
        <ArrowRightToLine className="w-6 h-6" />
      </div>
    </button>
  );
};
