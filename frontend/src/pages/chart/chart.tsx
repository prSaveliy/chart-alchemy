import { AIChart } from "./ai-chart";

import { useParams } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { Error } from "../error";

import chartService from "@/services/chartService";
import { unauthorizedInterceptor } from "@/lib/interceptors";

export const Chart = () => {
  const { token } = useParams();
  const retried = useRef(false);

  const [notFoundError, setNotFoundError] = useState(false);
  const [forbiddenError, setForbiddenError] = useState(false);
  const [networkError, setNetworkError] = useState(false);
  const [serverError, setServerError] = useState(false);
  const [tooManyRequestsError, setTooManyRequestsError] = useState(false);

  const [verified, setVerified] = useState(false);

  useEffect(() => {
    const verify = async () => {
      const fetchResult = await chartService.verifyToken(token!);

      if (fetchResult.errorMessage) {
        if (!retried.current && fetchResult.statusCode === 401) {
          await unauthorizedInterceptor();
          retried.current = true;
          await verify();
          return;
        }

        const errors: Record<number, () => void> = {
          403: () => setForbiddenError(true),
          404: () => setNotFoundError(true),
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

      setVerified(true);
    };

    verify();
  }, [token]);

  if (networkError) {
    return (
      <Error
        error="Something went wrong"
        secondaryMessage="A network error occurred while trying to verify the chart."
      />
    );
  }

  if (serverError) {
    return (
      <Error
        error="Server Error"
        secondaryMessage="Something happened on our side. We are already working on it."
      />
    );
  }

  if (tooManyRequestsError) {
    return (
      <Error
        error="Too Many Requests"
        secondaryMessage="You have made too many requests in a short period of time. Please try again later."
      />
    );
  }

  if (forbiddenError) {
    return (
      <Error
        error="Forbidden"
        secondaryMessage="You do not have permissions to access this chart."
      />
    );
  }

  if (notFoundError) {
    return (
      <Error
        error="Not Found"
        secondaryMessage="The chart you are looking for does not exist."
      />
    );
  }

  if (verified) {
    return <AIChart />;
  }
};
