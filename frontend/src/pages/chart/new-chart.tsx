import defaultUserPicture from "@/assets/user.png";

import { Sparkles, FileDown, Settings } from "lucide-react";

import { Header2 } from "@/components/layout/header2";
import { WorkflowChoiceCard } from "@/components/ui/workflow-choice-card";

import { v4 } from "uuid";

export const NewChart = () => {
  const userPicture = localStorage.getItem("picture");

  const redirect = (mode: "ai" | "dataset" | "manual") => {
    const token = v4();
    window.location.href = `${import.meta.env.VITE_API_URL}/chart/${mode}-${token}`;
  };

  return (
    <div className="flex flex-col w-full min-h-screen">
      <Header2 userPicture={userPicture || defaultUserPicture} />

      <div className="flex flex-1">
        <div className="flex flex-col w-full items-center justify-center">
          <div className="flex mb-8">
            <h1 className="flex text-4xl font-bold ">
              Choose the workflow that suits you best
            </h1>
          </div>
          <div>
            <WorkflowChoiceCard
              Icon={Sparkles}
              title="Prompt AI to generate charts"
              onCLick={() => redirect("ai")}
            />

            <WorkflowChoiceCard
              Icon={FileDown}
              title="Upload a dataset"
              onCLick={() => redirect("dataset")}
            />

            <WorkflowChoiceCard
              Icon={Settings}
              title="Manual configuration"
              onCLick={() => redirect("manual")}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
