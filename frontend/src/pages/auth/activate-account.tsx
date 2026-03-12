import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";

import authService from "@/services/authService";

import type { FetchResultErrorCode } from "@/commons/interfaces/authInterfaces";

import { ScaleLoader } from "react-spinners";

import { Error } from "../error";

export const ActivateAccount = () => {
  const [invalidToken, setInvalidToken] = useState(false);
  const [networkError, setNetworkError] = useState(false);
  const [serverError, setServerError] = useState(false);
  const [tooManyRequestsError, setTooManyRequestsError] = useState(false);
  const { token } = useParams();

  const activate = async () => {
    const fetchResult: FetchResultErrorCode = await authService.activate(token!);
    
    const errors: Record<number, () => void> = {
      400: () => setInvalidToken(true),
      500: () => setServerError(true),
      429: () => setTooManyRequestsError(true)
    }

    if (fetchResult.statusCode) {
      if (fetchResult.statusCode in errors) {
        errors[fetchResult.statusCode]();
      } else {
        setNetworkError(true);
      }
    } else if (fetchResult.errorMessage) {
      setNetworkError(true);
    } else {
      window.location.href = import.meta.env.VITE_API_URL;
    }
  }
  
  useEffect(() => { activate(); }, []);

  return (
    <div>
      {networkError && (
        <Error
          error="Something went wrong"
          secondaryMessage="An error occurred while trying to activate your account."
        />
      )}
      {invalidToken && (
        <Error
          error="Page Not Found"
          secondaryMessage="Oops! The page you're trying to access doesn't exist."
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
      {!networkError && !invalidToken && !serverError && !tooManyRequestsError && (
        <div className="flex min-h-screen items-center justify-center">
          <ScaleLoader height={20} width={4} margin={1} />
          <span className="text-xl ml-2 font-semibold">Activating your account</span>
        </div>
      )}
    </div>
  );
}
