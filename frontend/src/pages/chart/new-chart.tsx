import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import defaultUserPicture from "@/assets/user.png";

import { Sparkles, FileDown, Settings } from "lucide-react";

import { Header2 } from "@/components/layout/header2";
import { WorkflowChoiceCard } from "@/components/ui/workflow-choice-card";
import { Error } from "../error";

import chartService from "@/services/chartService";
import { unauthorizedInterceptor } from "@/lib/interceptors";

export const NewChart = () => {
  const navigate = useNavigate();
  const userPicture = localStorage.getItem("picture");
  const retried = useRef(false);

  const [badRequestError, setBadRequestError] = useState(false);
  const [networkError, setNetworkError] = useState(false);
  const [serverError, setServerError] = useState(false);
  const [tooManyRequestsError, setTooManyRequestsError] = useState(false);

  const redirect = async (chartType: "ai" | "dataset" | "manual") => {
    const fetchResult = await chartService.init(chartType);

    if (fetchResult.errorMessage) {
      if (!retried.current && fetchResult.statusCode === 401) {
        const interceptorResult = await unauthorizedInterceptor();
        if (interceptorResult && interceptorResult.statusCode === 401) {
          navigate('/login');
          return;
        }
        retried.current = true;
        await redirect(chartType);
        retried.current = false;
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
        )}
    </div>
  );
};
