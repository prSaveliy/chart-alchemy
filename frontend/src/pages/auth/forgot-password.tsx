import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/layout/logo";

import { CircleX, CircleCheck, MailCheck } from "lucide-react";

import { useState } from "react";
import type { ChangeEvent } from "react";

import { emailSchema } from "@/commons/schemas/authSchema";

import authService from "@/services/authService";

import type { FetchResultErrorCode } from "@/commons/interfaces/authInterfaces";

export const ForgotPassword = ({ ...props }: React.ComponentProps<"form">) => {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [awaiting, setAwaititng] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleEmailChange = (event: ChangeEvent<HTMLInputElement>) => {
    setFetchError("");

    const value = event.target.value;
    setEmail(value);

    const parseResult = emailSchema.safeParse({ email: value });
    if (!parseResult.success) {
      setEmailError(true);
    } else {
      setEmailError(false);
    }
  };

  const forgotPassword = async () => {
    setAwaititng(true);

    const fetchResult: FetchResultErrorCode = await authService.forgotPassword(email);

    if (fetchResult.errorMessage) {
      setFetchError(fetchResult.errorMessage);
    } else {
      setFetchError("");
      setSuccess(true);
    }

    setAwaititng(false);
  };

  return (
    <div className="relative w-full h-screen flex flex-col">
      <div className="absolute top-10 left-10 z-10">
        <a
          href="/"
          aria-label="home"
          className="flex items-center space-x-2 z-20"
        >
          <Logo />
        </a>
      </div>
      {!success ? (
        <div className="flex justify-center content-center min-h-full">
          <div className="w-1/2 flex items-center justify-center p-8">
            <form
              className={cn("flex flex-col gap-6 w-full max-w-sm")}
              {...props}
            >
              <FieldGroup>
                <div className="flex flex-col items-center gap-1 text-center">
                  <h1 className="text-2xl font-bold">Forgot Your Password</h1>
                  <p className="text-muted-foreground text-sm text-balance">
                    Enter your email below to get a password reset link
                  </p>
                </div>
                <Field>
                  <FieldLabel htmlFor="email">Email</FieldLabel>
                  <div className="relative">
                    <CircleX
                      color="#ff0000"
                      size={18}
                      className={`absolute -left-6 top-1/2 -translate-y-1/2 transition-opacity duration-100 ${email && emailError ? "opacity-100" : "opacity-0"}`}
                    />
                    <CircleCheck
                      color="#37ff00"
                      size={18}
                      className={`absolute -left-6 top-1/2 -translate-y-1/2 transition-opacity duration-100 ${email && !emailError ? "opacity-100" : "opacity-0"}`}
                    />
                    <Input
                      id="email"
                      type="email"
                      placeholder="m@example.com"
                      value={email}
                      onChange={handleEmailChange}
                      required
                    />
                  </div>
                  {emailError && email && (
                    <span className="text-sm text-[#ff0000]">
                      Invalid email address
                    </span>
                  )}
                  {fetchError && (
                    <span className="text-sm text-[#ff0000]">{fetchError}</span>
                  )}
                </Field>
                <Field>
                  <Button
                    type="button"
                    className="cursor-pointer"
                    disabled={email && !emailError && !awaiting ? false : true}
                    onClick={forgotPassword}
                  >
                    Request reset link
                  </Button>
                </Field>
              </FieldGroup>
            </form>
          </div>
        </div>
      ) : (
        <div className="flex justify-center min-h-full">
          <div className="w-1/2 relative flex flex-col items-center justify-center p-8">
            <div className="relative flex w-lg items-center justify-center">
              <MailCheck
                size={100}
                color="#06ed02"
                className="absolute bottom-1/2 mb-4"
              />
            </div>
            <div className="flex flex-col w-lg">
              <h1 className="text-3xl font-bold text-center">
                Check your email
              </h1>
              <p className="text-center mt-2">
                Password reset link was sent to your email:{" "}
                <p className="font-bold">{email}</p>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
