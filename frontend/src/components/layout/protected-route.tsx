import { useState, useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Error } from "@/pages/error";
import { validateJWT } from "@/lib/validateJWTToken";
import { unauthorizedInterceptor } from "@/lib/interceptors";

export const ProtectedRoute = ({ children }: { children?: React.ReactNode } = {}) => {
  const [authorized, setAuthorized] = useState(() => {
    const accessToken = localStorage.getItem("accessToken");
    return validateJWT(accessToken);
  });
  const [networkError, setNetworkError] = useState(false);
  const [serverError, setServerError] = useState(false);
  const [tooManyRequestsError, setTooManyRequestsError] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const accessToken = localStorage.getItem("accessToken");
    const validated = validateJWT(accessToken);

    if (validated) {
      return;
    }

    let isMounted = true;

    const tryRefresh = async () => {
      const errors: Record<number, () => void> = {
        500: () => setServerError(true),
        429: () => setTooManyRequestsError(true),
      };

      const response = await unauthorizedInterceptor();
      if (!isMounted) return;

      if (response) {
        if (response.statusCode) {
          if (response.statusCode === 401) {
            navigate("/login");
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
    };

    tryRefresh();

    return () => {
      isMounted = false;
    };
  }, [location.pathname, navigate]);

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

  return authorized ? <>{children ?? <Outlet />}</> : null;
};

export default ProtectedRoute;
