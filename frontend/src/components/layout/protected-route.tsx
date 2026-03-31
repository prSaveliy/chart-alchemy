import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Error } from "@/pages/error";
import { validateJWT } from "@/lib/validateJWTToken";
import { unauthorizedInterceptor } from "@/lib/interceptors";

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [authorized, setAuthorized] = useState(false);
  const [networkError, setNetworkError] = useState(false);
  const [serverError, setServerError] = useState(false);
  const [tooManyRequestsError, setTooManyRequestsError] = useState(false);
  const navigate = useNavigate();

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
          if (response.statusCode === 401) {
            navigate('/login');
            return;
          }
          if (response.statusCode in errors) {
            errors[response.statusCode]();
          }
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

  if (networkError) {
    return (
      <Error
        error="Something went wrong"
        secondaryMessage="An error occurred while trying to navigate to the page."
      />
    );
  }

  if (serverError) {
    return (
      <Error
        error="Server Error"
        secondaryMessage="Something happend on our side. We are already working on it."
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

  return authorized ? <>{children}</> : null;
};
