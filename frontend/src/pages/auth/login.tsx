import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import white from "@/assets/Solid_white.png";
import { Logo } from "@/components/layout/logo";

import { Eye, EyeClosed } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useState, useEffect } from "react";
import type { ChangeEvent } from "react";

import authService from "@/services/authService";

import type { FetchResultErrorCode } from "@/commons/interfaces/authInterfaces";

import { validateJWT } from "@/lib/validateJWTToken";
import { unauthorizedInterceptor } from "@/lib/interceptors";

export const LoginForm = ({
  className,
  ...props
}: React.ComponentProps<"form">) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordShown, setPasswordShown] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [loginRequired, setLoginRequired] = useState(false);
  const navigate = useNavigate();

  const checkAuth = async () => {
    const accessToken = localStorage.getItem("accessToken");
    const authorized = validateJWT(accessToken);

    if (authorized) {
      navigate("/dashboard");
    } else {
      const result = await unauthorizedInterceptor();
      if (result && !result.networkError && !result.statusCode) {
        navigate("/dashboard");
      } else {
        setLoginRequired(true);
      }
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const handleEmailChange = (event: ChangeEvent<HTMLInputElement>) => {
    setEmail(event.target.value);
  };

  const handlePasswordChange = (event: ChangeEvent<HTMLInputElement>) => {
    setPassword(event.target.value);
  };

  const login = async () => {
    const fetchResult: FetchResultErrorCode = await authService.login(
      email,
      password,
    );

    if (fetchResult.errorMessage) {
      setFetchError(fetchResult.errorMessage);
    } else {
      setFetchError("");
      navigate("/dashboard");
    }
  };

  return (
    <div>
      {loginRequired && (
        <div className="relative w-full min-h-screen flex flex-col">
          <div className="absolute top-4 left-4 sm:top-6 sm:left-6 lg:top-10 lg:left-10 z-10">
            <a
              href="/"
              aria-label="home"
              className="flex items-center space-x-2 z-20"
            >
              <Logo />
            </a>
          </div>

          <div className="flex flex-1">
            <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8 pt-20 sm:pt-8">
              <form
                className={cn("flex flex-col gap-6 w-full max-w-sm", className)}
                {...props}
              >
                <FieldGroup>
                  <div className="flex flex-col items-center gap-1 text-center">
                    <h1 className="text-2xl font-bold">
                      Login to your account
                    </h1>
                    <p className="text-muted-foreground text-sm text-balance">
                      Enter your credentials below to login to your account
                    </p>
                  </div>
                  <Field>
                    <FieldLabel htmlFor="email">Email</FieldLabel>
                    <Input
                      id="email"
                      type="email"
                      placeholder="m@example.com"
                      value={email}
                      onChange={handleEmailChange}
                      required
                    />
                  </Field>
                  <Field>
                    <div className="flex items-center">
                      <FieldLabel htmlFor="password">Password</FieldLabel>
                      <a
                        href="forgot-password"
                        className="ml-auto text-sm underline-offset-4 hover:underline"
                      >
                        Forgot your password?
                      </a>
                    </div>
                    <div className="relative">
                      <button
                        type="button"
                        className="cursor-pointer"
                        onClick={() => setPasswordShown(!passwordShown)}
                      >
                        {passwordShown ? (
                          <EyeClosed
                            size={18}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                          />
                        ) : (
                          <Eye
                            size={18}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                          />
                        )}
                      </button>
                      <Input
                        id="password"
                        type={passwordShown ? "text" : "password"}
                        value={password}
                        onChange={handlePasswordChange}
                        required
                      />
                    </div>
                    {fetchError && (
                      <span className="text-sm text-[#ff0000]">
                        {fetchError}
                      </span>
                    )}
                  </Field>
                  <Field>
                    <Button
                      type="button"
                      className="cursor-pointer"
                      disabled={!email || !password}
                      onClick={login}
                    >
                      Login
                    </Button>
                  </Field>
                  <FieldSeparator>Or continue with</FieldSeparator>
                  <Field>
                    <a href="http://localhost:3000/oauth/google/redirect-to-url">
                      <Button
                        variant="outline"
                        type="button"
                        className="w-full cursor-pointer"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="800px"
                          height="800px"
                          viewBox="-3 0 262 262"
                          preserveAspectRatio="xMidYMid"
                        >
                          <path
                            d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622 38.755 30.023 2.685.268c24.659-22.774 38.875-56.282 38.875-96.027"
                            fill="#4285F4"
                          />
                          <path
                            d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055-34.523 0-63.824-22.773-74.269-54.25l-1.531.13-40.298 31.187-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1"
                            fill="#34A853"
                          />
                          <path
                            d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82 0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602l42.356-32.782"
                            fill="#FBBC05"
                          />
                          <path
                            d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0 79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251"
                            fill="#EB4335"
                          />
                        </svg>
                        Login with Google
                      </Button>
                    </a>
                    <FieldDescription className="text-center">
                      Don&apos;t have an account?{" "}
                      <a href="signup" className="underline underline-offset-4">
                        Sign up
                      </a>
                    </FieldDescription>
                  </Field>
                </FieldGroup>
              </form>
            </div>

            <div className="hidden lg:flex lg:w-1/2 bg-white items-center justify-center p-3">
              <div className="w-full h-full rounded-2xl flex items-center justify-center">
                <img
                  src={white}
                  alt="Login visual"
                  className="w-full h-full object-cover rounded-2xl"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
