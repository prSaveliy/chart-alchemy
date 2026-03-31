import { Button } from "@/components/ui/button";
import { Logo } from "@/components/layout/logo";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const Error = (props: { error: string; secondaryMessage: string }) => {
  const navigate = useNavigate();
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

      <div className="mx-auto flex min-h-dvh flex-col items-center justify-center gap-8 p-8 md:gap-12 md:p-16 z-10">
        <div className="text-center">
          <h1 className="mb-2 text-3xl font-bold">{props.error}</h1>
          <p>{props.secondaryMessage}</p>
          <div className="mt-6 flex items-center justify-center gap-4 md:mt-8">
            <Button
              className="cursor-pointer"
              onClick={() => navigate('/')}
            >
              <ArrowLeft className="size-4"></ArrowLeft>
              <span>Back Home</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
