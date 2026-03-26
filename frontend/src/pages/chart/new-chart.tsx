import { useState, useEffect } from "react";

import defaultUserPicture from "@/assets/user.png";

import { Sparkles, FileDown, Settings } from "lucide-react";

import { Header2 } from "@/components/layout/header2";
import { WorkflowChoiceCard } from "@/components/ui/workflow-choice-card";
import { Error } from "../error";

import { v4 } from "uuid";

import { validateJWT } from "@/lib/validateJWTToken";
import { unauthorizedInterceptor } from "@/lib/interceptors";

export const NewChart = () => {
  const [authorized, setAuthorized] = useState(false);
  const [networkError, setNetworkError] = useState(false);
  const [serverError, setServerError] = useState(false);
  const [tooManyRequestsError, setTooManyRequestsError] = useState(false);

  const userPicture = localStorage.getItem("picture");

  const authorize = async () => {
    const accessToken = localStorage.getItem("accessToken");
    const validated = validateJWT(accessToken);

    const errors: Record<number, () => void> = {
      500: () => setServerError(true),
      429: () => setTooManyRequestsError(true),
    };

    if (!validated) {
      const response = await unauthorizedInterceptor();

      if (response) {
        if (response.statusCode) {
          errors[response.statusCode]();
        } else if (response.networkError) {
          setNetworkError(true);
        } else {
          setAuthorized(true);
        }
      }
    } else {
      setAuthorized(true);
    }
  };

  useEffect(() => {
    authorize();
  }, []);

  const redirect = (mode: "ai" | "dataset" | "manual") => {
    const token = v4();
    window.location.href = `${import.meta.env.VITE_API_URL}/chart/${mode}-${token}`;
  };

  return (
    <div>
      {authorized && (
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
      {networkError && (
        <Error
          error="Something went wrong"
          secondaryMessage="An error occurred while trying to activate your account."
        />
      )}
      {serverError && (
        <Error
          error="Server Error"
          secondaryMessage="Something happend on our side. We are already working on it."
        />
      )}
      {tooManyRequestsError && (
        <Error
          error="Too Many Requests"
          secondaryMessage="You have made too many requests in a short period of time. Please try again later."
        />
      )}
    </div>
  );
};
