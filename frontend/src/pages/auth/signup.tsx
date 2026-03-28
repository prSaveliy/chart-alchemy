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

import { CircleX, CircleCheck, Eye, EyeClosed, MailCheck } from 'lucide-react';

import { useState } from "react";
import type { ChangeEvent } from "react";

import authService from "@/services/authService";

import { registrationBaseSchema, registrationSchema } from "@/commons/schemas/authSchema";
import type { FetchResultErrorCode } from '@/commons/interfaces/authInterfaces';

export const SignUpForm = ({
  className,
  ...props
}: React.ComponentProps<"form">) => {
  const [email, setEmail] = useState('');
  const [password1, setPassword1] = useState('');
  const [password2, setPassword2] = useState('');
  const [emailError, setEmailError] = useState('');
  const [password1Error, setPassword1Error] = useState('');
  const [password2Error, setPassword2Error] = useState('');
  const [fetchError, setFetchError] = useState('');
  const [password1Shown, setPassword1Shown] = useState(false);
  const [password2Shown, setPassword2Shown] = useState(false);
  const [awaitingRegistration, setAwaitingRegistration] = useState(false);
  const [emailSentShown, setEmailSentShown] = useState(false);
  
  const handleEmailChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (fetchError) setFetchError('');
    
    const value = event.target.value;
    setEmail(value);
    
    const schema = registrationBaseSchema.omit({
      password1: true,
      password2: true,
    });
    
    const parseResult = schema.safeParse({ email: value });
    if (!parseResult.success) {
      setEmailError(parseResult.error.issues[0].message);
    } else {
      setEmailError('');
    }
  }
  
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
  }
  
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
  }
  
  const register = async () => {
    setAwaitingRegistration(true);
    
    const parseResult = registrationSchema.safeParse({ email, password1, password2 });
    if (!parseResult.success) {
      setAwaitingRegistration(false);
      setFetchError('Invalid credentials');
      return;
    }
    
    const fetchResult: FetchResultErrorCode = await authService.register(email, password1);
    
    if (fetchResult.errorMessage) {
      setFetchError(fetchResult.errorMessage);
    } else {
      setEmailSentShown(true);
    }
    
    setAwaitingRegistration(false);
  }
  
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

      <div className="flex flex-1">
        {!emailSentShown && <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
          <form
            className={cn("flex flex-col gap-6 w-full max-w-sm", className)}
            {...props}
          >
            <FieldGroup>
              <div className="flex flex-col items-center gap-1 text-center">
                <h1 className="text-2xl font-bold">Create your account</h1>
              </div>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <div className="relative">
                  <CircleX color="#ff0000" size={18} className={`absolute -left-6 top-1/2 -translate-y-1/2 transition-opacity duration-100 ${email && emailError ? 'opacity-100' : 'opacity-0'}`} />
                  <CircleCheck color="#37ff00" size={18} className={`absolute -left-6 top-1/2 -translate-y-1/2 transition-opacity duration-100 ${email && !emailError ? 'opacity-100' : 'opacity-0'}`} />
                  <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    value={email}
                    onChange={handleEmailChange}
                    required
                  />
                </div>
                {emailError && email && <span className="text-sm text-[#ff0000]">{emailError}</span>}
              </Field>
              <Field>
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                </div>
                <div className="relative">
                  <CircleX color="#ff0000" size={18} className={`absolute -left-6 top-1/2 -translate-y-1/2 transition-opacity duration-100 ${password1 && password1Error ? 'opacity-100' : 'opacity-0'}`} />
                  <CircleCheck color="#37ff00" size={18} className={`absolute -left-6 top-1/2 -translate-y-1/2 transition-opacity duration-100 ${password1 && !password1Error ? 'opacity-100' : 'opacity-0'}`} />
                  <button type="button" className="cursor-pointer" onClick={() => setPassword1Shown(!password1Shown)}>
                    {password1Shown
                      ? <EyeClosed size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700" />
                      : <Eye size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700" />}
                  </button>
                  <Input
                    id="password"
                    type={password1Shown ? 'text' : 'password'}
                    value={password1}
                    onChange={handlePassword1Change}
                    required
                  />
                </div>
                {password1Error && password1 && <span className="text-sm text-[#ff0000]">{password1Error}</span>}
              </Field>
              <Field>
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">Confirm Password</FieldLabel>
                </div>
                <div className="relative">
                  <CircleX color="#ff0000" size={18} className={`absolute -left-6 top-1/2 -translate-y-1/2 transition-opacity duration-100 ${password2 && password2Error ? 'opacity-100' : 'opacity-0'}`} />
                  <CircleCheck color="#37ff00" size={18} className={`absolute -left-6 top-1/2 -translate-y-1/2 transition-opacity duration-100 ${password2 && !password2Error ? 'opacity-100' : 'opacity-0'}`} />
                  <button type="button" className="cursor-pointer" onClick={() => setPassword2Shown(!password2Shown)}>
                    {password2Shown
                      ? <EyeClosed size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700" />
                      : <Eye size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700" />}
                  </button>
                  <Input
                    id="password"
                    type={password2Shown ? 'text' : 'password'}
                    value={password2}
                    onChange={handlePassword2Change}
                    required
                  />
                </div>
                {password2Error && password2 && <span className="text-sm text-[#ff0000]">{password2Error}</span>}
                {fetchError && !emailError && !password1Error &&
                  !password2Error && email && password1 && password2 && <span className="text-sm text-[#ff0000]">{fetchError}</span>}
              </Field>
              <Field>
                <Button
                  type="button"
                  disabled={
                    !emailError && !password1Error && !password2Error &&
                      email && password1 && password2 && !awaitingRegistration
                      ? false
                      : true
                  }
                  className="cursor-pointer"
                  onClick={register}>
                  Sign up</Button>
              </Field>
              <FieldSeparator>Or continue with</FieldSeparator>
              <Field>
                <a href="http://localhost:3000/oauth/google/redirect-to-url">
                  <Button variant="outline" type="button" className="w-full cursor-pointer">
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
                  Already have an account?{" "}
                  <a href="login" className="underline underline-offset-4">
                    Sign in
                  </a>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </div>}
        
        {emailSentShown && <div className="w-full lg:w-1/2 relative flex flex-col items-center justify-center p-8">
          <div className="relative flex w-full max-w-lg items-center justify-center">
            <MailCheck size={100} color="#06ed02" className="absolute bottom-1/2 mb-4" />
          </div>
          <div className="flex flex-col w-full max-w-lg">
            <h1 className="mx-auto text-3xl font-bold text-center text-balance">Confirmation email was successfully sent</h1>
            <p className="mx-auto text-center mt-2 text-balance">Check your inbox and click the link to activate your account</p>
          </div>
        </div>}
        
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
  );
}
