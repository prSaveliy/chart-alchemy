import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/layout/logo";
import { CircleX, CircleCheck, Eye, EyeClosed } from "lucide-react";

import { useState, useEffect, type ChangeEvent } from 'react';
import { useParams } from 'react-router-dom';

import { ScaleLoader } from 'react-spinners';

import type { FetchResultErrorCode, FetchResult } from '@/commons/interfaces/authInterfaces';

import authService from '@/services/authService';

import { Error } from "../error";

import { registrationBaseSchema } from "@/commons/schemas/authSchema";

export const PasswordReset = () => {
  const [verifying, setVerifying] = useState(true);
  const [verified, setVerified] = useState(false);
  const [invalidToken, setInvalidToken] = useState(false);
  const [networkError, setNetworkError] = useState(false);
  const [serverError, setServerError] = useState(false);
  const [tooManyRequestsError, setTooManyRequestsError] = useState(false);
  const [password1, setPassword1] = useState('');
  const [password2, setPassword2] = useState('');
  const [password1Error, setPassword1Error] = useState('');
  const [password2Error, setPassword2Error] = useState('');
  const [password1Shown, setPassword1Shown] = useState(false);
  const [password2Shown, setPassword2Shown] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [awaiting, setAwaititng] = useState(false);
  const { token } = useParams();
  
  const verifyToken = async () => {
    const fetchResult: FetchResultErrorCode = await authService.verifyPasswordResetToken(token!);
    
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
      setVerified(true);
    }
    
    setVerifying(false);
  };
  
  useEffect(() => { verifyToken() }, []);
  
  const handlePassword1Change = (event: ChangeEvent<HTMLInputElement>) => {
    if (fetchError) setFetchError('');
    
    const value = event.target.value;
    setPassword1(value);
    
    const schema = registrationBaseSchema.omit({
      email: true,
      password2: true,
    });
    
    const parseResult = schema.safeParse({ password1: value });
    if (!parseResult.success) {
      setPassword1Error(parseResult.error.issues[0].message);
    } else {
      setPassword1Error('');
    }
  };
  
  const handlePassword2Change = (event: ChangeEvent<HTMLInputElement>) => {
    if (fetchError) setFetchError('');
    
    const value = event.target.value;
    setPassword2(value);
    
    const schema = registrationBaseSchema.omit({
      email: true,
      password1: true,
    });
    
    const parseResult = schema.safeParse({ password2: value });
    if (!parseResult.success) {
      setPassword2Error(parseResult.error.issues[0].message);
    } else if (value !== password1) {
      setPassword2Error('Passwords do not match');
    } else {
      setPassword2Error('');
    }
  };
  
  const resetPassword = async () => {
    setAwaititng(true);
    
    const fetchResult: FetchResult = await authService.resetPassword(token!, password1);
    
    if (fetchResult.errorMessage) {
      setFetchError(fetchResult.errorMessage);
    } else {
      setFetchError("");
      window.location.href = `${import.meta.env.VITE_API_URL}/login`;
    }
    
    setAwaititng(false);
  }
  
  return (
    <div>
      {verifying && (
        <div>
          <div className='flex min-h-screen items-center justify-center'>
            <ScaleLoader height={20} width={4} margin={1} />
            <span className="text-xl ml-2 font-semibold">
              Verifying
            </span>
          </div>
        </div>
      )}
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
      {verified && (
        <div>
          <div className="absolute top-10 left-10 z-10">
            <a
              href="/"
              aria-label="home"
              className="flex items-center space-x-2 z-20"
            >
              <Logo />
            </a>
          </div>
          <div className="flex justify-center content-center min-h-screen">
            <div className="w-1/2 flex items-center justify-center p-8">
              <form
                className={cn("flex flex-col gap-6 w-full max-w-sm")}
              >
                <FieldGroup>
                  <div className="flex flex-col items-center gap-1 text-center">
                    <h1 className="text-2xl font-bold">Password Reset</h1>
                    <p className="text-muted-foreground text-sm text-balance">
                      Enter your new password below
                    </p>
                  </div>
                  <Field>
                    <FieldLabel htmlFor="email">New password</FieldLabel>
                    <div className="relative">
                      <CircleX
                        color="#ff0000"
                        size={18}
                        className={`absolute -left-6 top-1/2 -translate-y-1/2 transition-opacity duration-100 ${password1 && password1Error ? "opacity-100" : "opacity-0"}`}
                      />
                      <CircleCheck
                        color="#37ff00"
                        size={18}
                        className={`absolute -left-6 top-1/2 -translate-y-1/2 transition-opacity duration-100 ${password1 && !password1Error ? "opacity-100" : "opacity-0"}`}
                      />
                      <button type="button" className="cursor-pointer" onClick={() => setPassword1Shown(!password1Shown)}>
                        {password1Shown
                          ? <EyeClosed size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700" />
                          : <Eye size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700" />}
                      </button>
                      <Input
                        id="password1"
                        type={password1Shown ? 'text' : 'password'}
                        value={password1}
                        onChange={handlePassword1Change}
                        required
                      />
                    </div>
                    {password1Error && password1 && <span className="text-sm text-[#ff0000]">{password1Error}</span>}
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="email">Confirm Password</FieldLabel>
                    <div className="relative">
                      <button type="button" className="cursor-pointer" onClick={() => setPassword2Shown(!password2Shown)}>
                        {password2Shown
                          ? <EyeClosed size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700" />
                          : <Eye size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700" />}
                      </button>
                      <CircleX
                        color="#ff0000"
                        size={18}
                        className={`absolute -left-6 top-1/2 -translate-y-1/2 transition-opacity duration-100 ${password2 && password2Error ? "opacity-100" : "opacity-0"}`}
                      />
                      <CircleCheck
                        color="#37ff00"
                        size={18}
                        className={`absolute -left-6 top-1/2 -translate-y-1/2 transition-opacity duration-100 ${password2 && !password2Error ? "opacity-100" : "opacity-0"}`}
                      />
                      <Input
                        id="password2"
                        type={password2Shown ? 'text' : 'password'}
                        value={password2}
                        onChange={handlePassword2Change}
                        required
                      />
                    </div>
                    {password2Error && password2 && <span className="text-sm text-[#ff0000]">{password2Error}</span>}
                    {fetchError && !password1Error &&
                      !password2Error && password1 && password2 && <span className="text-sm text-[#ff0000]">{fetchError}</span>}
                  </Field>
                  <Field>
                    <Button
                      type="button"
                      className="cursor-pointer"
                      disabled={password1 && !password1Error && password2 && !password2Error && !awaiting ? false : true}
                      onClick={resetPassword}
                    >
                      Reset Password
                    </Button>
                  </Field>
                </FieldGroup>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
