import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { handleUnauthorized } from "@/lib/handleUnauthorized";

import defaultUserPicture from "@/assets/user.png";

import { Sparkles, Settings } from "lucide-react";

import { Header2 } from "@/components/layout/header2";
import { WorkflowChoiceCard } from "@/components/ui/workflow-choice-card";
import { Error } from "../error";

import chartService from "@/services/chartService";

export const NewChart = () => {
  const navigate = useNavigate();
  const userPicture = localStorage.getItem("picture");
  const retried = useRef(false);

  const [badRequestError, setBadRequestError] = useState(false);
  const [networkError, setNetworkError] = useState(false);
  const [serverError, setServerError] = useState(false);
  const [tooManyRequestsError, setTooManyRequestsError] = useState(false);

  const redirect = async (chartType: "ai" | "manual") => {
    const fetchResult = await chartService.init(chartType);

    if (fetchResult.errorMessage) {
      if (!retried.current && fetchResult.statusCode === 401) {
        await handleUnauthorized(retried, navigate, () => redirect(chartType));
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
                    Start from a natural-language prompt or build your chart by
                    hand with full control over every field.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 w-full">
                  <WorkflowChoiceCard
                    Icon={Sparkles}
                    title="Generate with AI"
                    description="Describe the chart you want in plain language and AI model will build it for you. Iterate with follow-up prompts, carry context forward with memory, and refine your visualization turn by turn."
                    cta="Start with AI"
                    onClick={() => redirect("ai")}
                  />

                  <WorkflowChoiceCard
                    Icon={Settings}
                    title="Build manually"
                    description="Configure each chart field by hand. Choose from bar, line, area, pie, scatter, or radar, supply your own data, and watch the chart update live as you edit."
                    cta="Start manually"
                    onClick={() => redirect("manual")}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
    </div>
  );
};
