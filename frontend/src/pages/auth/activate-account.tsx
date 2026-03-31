import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

import authService from "@/services/authService";

import type { FetchResultErrorCode } from "@/commons/interfaces/authInterfaces";

import { Loading } from "../loading";

import { Error } from "../error";

export const ActivateAccount = () => {
  const [invalidToken, setInvalidToken] = useState(false);
  const [networkError, setNetworkError] = useState(false);
  const [serverError, setServerError] = useState(false);
  const [tooManyRequestsError, setTooManyRequestsError] = useState(false);
  const { token } = useParams();
  const navigate = useNavigate();

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
      navigate('/login');
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
        <Loading message="Activating your account" />
      )}
    </div>
  );
}
