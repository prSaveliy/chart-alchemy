import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { handleUnauthorized } from "@/lib/handleUnauthorized";

import defaultUserPicture from "@/assets/user.png";

import { Sparkles, Settings, FileSpreadsheet } from "lucide-react";

import { Header2 } from "@/components/layout/header2";
import { WorkflowChoiceCard } from "@/components/ui/workflow-choice-card";
import { Error } from "../error";
import { emitWorkflowSelected, onWorkflowSelected } from "@/lib/workflowEvents";
import type { WorkflowType } from "@/commons/interfaces/chartInterfaces";

import chartService from "@/services/chartService";

export const NewChart = () => {
  const navigate = useNavigate();
  const userPicture = localStorage.getItem("picture");
  const retriedRef = useRef(false);

  const [badRequestError, setBadRequestError] = useState(false);
  const [networkError, setNetworkError] = useState(false);
  const [serverError, setServerError] = useState(false);
  const [tooManyRequestsError, setTooManyRequestsError] = useState(false);
  const [lastSelectedWorkflow, setLastSelectedWorkflow] = useState(
    sessionStorage.getItem("lastSelectedWorkflow") ?? "",
  );
  const [selectionCount, setSelectionCount] = useState(
    Number(sessionStorage.getItem("selectionCount") ?? "0"),
  );

  useEffect(() => {
    const selectionSubscription = onWorkflowSelected(
      "workflow:selected",
      (payload) => {
        setLastSelectedWorkflow(payload.label);
        sessionStorage.setItem("lastSelectedWorkflow", payload.label);
      },
    );

    const countSubscription = onWorkflowSelected("workflow:selected", () => {
      setSelectionCount((prev) => {
        const next = prev + 1;
        sessionStorage.setItem("selectionCount", next.toString());
        return next;
      });
    });

    // unsubscribe on page unmount
    const cleanup = () => {
      selectionSubscription.unsubscribe();
      countSubscription.unsubscribe();
    };

    return cleanup;
  }, []);

  const redirect = async (chartType: WorkflowType) => {
    const fetchResult = await chartService.init(chartType);

    if (fetchResult.errorMessage) {
      if (!retriedRef.current && fetchResult.statusCode === 401) {
        await handleUnauthorized(retriedRef, navigate, () =>
          redirect(chartType),
        );
        return;
      }

      const errors: Record<number, () => void> = {
        400: () => setBadRequestError(true),
        500: () => setServerError(true),
        429: () => setTooManyRequestsError(true),
      };

      if (fetchResult.statusCode && fetchResult.statusCode in errors) {
        errors[fetchResult.statusCode]();
      } else {
        setNetworkError(true);
      }

      return;
    }

    if (fetchResult.data?.token) {
      const token = fetchResult.data.token;
      navigate(`/chart/${token}`);
    }
  };

  const handleWorkflowClick = async (type: WorkflowType, label: string) => {
    emitWorkflowSelected("workflow:selected", {
      label,
    });
    await redirect(type);
  };

  return (
    <div>
      {(networkError || badRequestError) && (
        <Error
          error="Something went wrong"
          secondaryMessage="An error occurred while trying to initialize the chart."
        />
      )}
      {serverError && (
        <Error
          error="Server Error"
          secondaryMessage="Something happened on our side. We are already working on it."
        />
      )}
      {tooManyRequestsError && (
        <Error
          error="Too Many Requests"
          secondaryMessage="You have made too many requests in a short period of time. Please try again later."
        />
      )}
      {!networkError &&
        !badRequestError &&
        !serverError &&
        !tooManyRequestsError && (
          <div className="flex flex-col w-full min-h-screen">
            <Header2 userPicture={userPicture || defaultUserPicture} />

            <div className="flex flex-1 items-center justify-center px-4 sm:px-6 py-8 sm:py-12">
              <div className="flex flex-col items-center w-full max-w-5xl">
                <div className="flex flex-col items-center mb-8 sm:mb-10 text-center">
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">
                    How would you like to create your chart?
                  </h1>
                  <p className="mt-3 text-sm sm:text-base text-gray-600 max-w-xl">
                    Generate from a prompt, upload a dataset, or configure every
                    field by hand.
                  </p>
                </div>

                <div className="w-full max-w-3xl mb-8 rounded-2xl border bg-gray-50 px-4 py-4 sm:px-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                        Reactive workflow demo
                      </p>
                      <p className="mt-1 text-sm text-gray-700">
                        Last selected workflow:{" "}
                        <span className="font-medium text-gray-900">
                          {lastSelectedWorkflow || "None yet"}
                        </span>
                      </p>
                      <p className="mt-1 text-sm text-gray-700">
                        Total selections observed:{" "}
                        <span className="font-medium text-gray-900">
                          {selectionCount}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:flex-wrap justify-center items-center gap-4 sm:gap-6 w-full">
                  <WorkflowChoiceCard
                    Icon={Sparkles}
                    title="Generate with AI"
                    description="Describe the chart you want in plain language and AI model will build it for you. Iterate with follow-up prompts, carry context forward with memory, and refine your visualization turn by turn."
                    cta="Start with AI"
                    onClick={() =>
                      handleWorkflowClick("ai", "Generate with AI")
                    }
                  />

                  <WorkflowChoiceCard
                    Icon={FileSpreadsheet}
                    title="Generate from a dataset"
                    description="Upload a CSV or XLSX file and have the chart built from your data. Switch between bar, line, pie, and scatter and review the detected fields."
                    cta="Upload a file"
                    onClick={() =>
                      handleWorkflowClick("dataset", "Generate from a dataset")
                    }
                  />

                  <WorkflowChoiceCard
                    Icon={Settings}
                    title="Build manually"
                    description="Configure each chart field by hand. Choose from bar, line, area, pie, scatter, or radar, supply your own data, and watch the chart update live as you edit."
                    cta="Start manually"
                    onClick={() =>
                      handleWorkflowClick("manual", "Build manually")
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        )}
    </div>
  );
};
