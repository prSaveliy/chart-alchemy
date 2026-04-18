import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import googleAuthService from "@/services/googleAuthService";

import { Error } from "../error";
import { Loading } from "../loading";

export const GoogleLogin = () => {
  const [badRequestError, setBadRequestError] = useState(false);
  const [forbiddenError, setForbiddenError] = useState(false);
  const [networkError, setNetworkError] = useState(false);
  const [serverError, setServerError] = useState(false);
  const [tooManyRequestsError, setTooManyRequestsError] = useState(false);
  const navigate = useNavigate();

  const login = async () => {
    const queryParams = new URLSearchParams(window.location.search);
    const code = queryParams.get("code");
    const state = queryParams.get("state");

    if (code) {
      const fetchResult = await googleAuthService.login(code, state!);

      const errors: Record<number, () => void> = {
        400: () => setBadRequestError(true),
        403: () => setForbiddenError(true),
        500: () => setServerError(true),
        429: () => setTooManyRequestsError(true),
      };

      if (fetchResult.statusCode) {
        if (fetchResult.statusCode in errors) {
          errors[fetchResult.statusCode]();
        } else {
          setNetworkError(true);
        }
      } else if (fetchResult.errorMessage) {
        setNetworkError(true);
      } else {
        navigate('/dashboard');
      }
    }
  };

  useEffect(() => { login(); }, []);

  return (
    <div>
      {networkError || badRequestError && (
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
      {forbiddenError && (
        <Error
          error="Forbidden"
          secondaryMessage="You do not have access to this resource."
        />
      )}
      {!networkError &&
        !forbiddenError &&
        !badRequestError &&
        !serverError &&
        !tooManyRequestsError && <Loading message="Logging in" />}
    </div>
  );
};
