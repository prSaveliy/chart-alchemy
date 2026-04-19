import { Logo } from "@/components/layout/logo";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import React from "react";
import { cn } from "@/lib/utils";

export const HeroHeader = () => {
  const [menuState, setMenuState] = React.useState(false);
  const [isScrolled, setIsScrolled] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  return (
    <header>
      <nav
        data-state={menuState && "active"}
        className="group fixed z-20 w-full px-2"
      >
        <div
          className={cn(
            "relative mx-auto mt-2 max-w-6xl px-6 transition-all duration-300 lg:px-12 rounded-2xl",
            isScrolled && "max-w-4xl lg:px-5",
          )}
        >
          <div
            className={cn(
              "absolute inset-0 rounded-2xl transition-all duration-300 pointer-events-none -z-10",
              isScrolled && "bg-background/50 border backdrop-blur-lg",
            )}
          />
          <div className="relative flex h-14 items-center justify-between gap-6 lg:gap-0">
            <a
              href="/"
              aria-label="home"
              className="flex items-center space-x-2 z-20"
            >
              <Logo />
            </a>

            <button
              onClick={() => setMenuState(!menuState)}
              aria-label={menuState == true ? "Close Menu" : "Open Menu"}
              className="relative z-20 -m-2.5 -mr-4 block cursor-pointer p-2.5 lg:hidden"
            >
              <Menu className="group-data-[state=active]:rotate-180 group-data-[state=active]:scale-0 group-data-[state=active]:opacity-0 m-auto size-6 duration-200" />
              <X className="group-data-[state=active]:rotate-0 group-data-[state=active]:scale-100 group-data-[state=active]:opacity-100 absolute inset-0 m-auto size-6 -rotate-180 scale-0 opacity-0 duration-200" />
            </button>

            <div className="bg-background/50 backdrop-blur-lg lg:backdrop-blur-none absolute top-full left-0 mt-4 group-data-[state=active]:block lg:group-data-[state=active]:flex mb-6 hidden w-full flex-wrap items-center justify-end space-y-8 rounded-3xl border p-6 shadow-2xl shadow-zinc-300/20 md:flex-nowrap lg:static lg:mt-0 lg:m-0 lg:flex lg:w-fit lg:gap-6 lg:space-y-0 lg:border-transparent lg:bg-transparent lg:p-0 lg:shadow-none dark:shadow-none dark:lg:bg-transparent">
              <div className="flex w-full flex-col items-center space-y-3 sm:flex-row sm:gap-3 sm:space-y-0 md:w-fit">
                <Button
                  asChild
                  size="sm"
                  variant="outline"
                  className={cn(isScrolled && "lg:hidden")}
                >
                  <a href="/signup">
                    <span>Sign Up</span>
                  </a>
                </Button>
                <Button asChild size="sm">
                  <a href="/login">
                    <span>Login</span>
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
};
