import { Button } from "@/components/ui/button";
import { TextEffect } from "@/components/ui/text-effect";
import { AnimatedGroup } from "@/components/ui/animated-group";
import { HeroHeader } from "../components/layout/header";
import Footer from "../components/layout/footer";
import { FeatureImage } from "@/components/ui/feature-image";
import chartAI from "@/assets/chart-ai.png";
import chartManual from "@/assets/chart-manual.png";

const transitionVariants = {
  item: {
    hidden: {
      opacity: 0,
      filter: "blur(12px)",
      y: 12,
    },
    visible: {
      opacity: 1,
      filter: "blur(0px)",
      y: 0,
      transition: {
        type: "spring",
        bounce: 0.3,
        duration: 1.5,
      },
    },
  },
};

export const HeroSection = () => {
  return (
    <>
      <HeroHeader />
      <main className="overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 isolate hidden opacity-65 contain-strict lg:block"
        >
          <div className="w-140 h-320 -translate-y-87.5 absolute left-0 top-0 -rotate-45 rounded-full bg-[radial-gradient(68.54%_68.72%_at_55.02%_31.46%,hsla(0,0%,85%,.08)_0,hsla(0,0%,55%,.02)_50%,hsla(0,0%,45%,0)_80%)]" />
          <div className="h-320 absolute left-0 top-0 w-60 -rotate-45 rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,hsla(0,0%,85%,.06)_0,hsla(0,0%,45%,.02)_80%,transparent_100%)] [translate:5%_-50%]" />
          <div className="h-320 -translate-y-87.5 absolute left-0 top-0 w-60 -rotate-45 bg-[radial-gradient(50%_50%_at_50%_50%,hsla(0,0%,85%,.04)_0,hsla(0,0%,45%,.02)_80%,transparent_100%)]" />
        </div>
        <section>
          <div className="relative pt-24 md:pt-36">
            <AnimatedGroup
              variants={{
                container: {
                  visible: {
                    transition: {
                      delayChildren: 1,
                    },
                  },
                },
                item: {
                  hidden: {
                    opacity: 0,
                    y: 20,
                  },
                  visible: {
                    opacity: 1,
                    y: 0,
                    transition: {
                      type: "spring",
                      bounce: 0.3,
                      duration: 2,
                    },
                  },
                },
              }}
              className="mask-b-from-35% mask-b-to-90% absolute inset-0 top-56 -z-20 lg:top-32"
            >
              <img
                src="https://ik.imagekit.io/lrigu76hy/tailark/night-background.jpg?updatedAt=1745733451120"
                alt="background"
                className="hidden size-full dark:block"
              />
            </AnimatedGroup>

            <div
              aria-hidden
              className="absolute inset-0 -z-10 size-full [background:radial-gradient(125%_125%_at_50%_100%,transparent_0%,var(--color-background)_75%)]"
            />

            <div className="mx-auto max-w-7xl px-6">
              <div className="text-center sm:mx-auto lg:mr-auto lg:mt-0">
                <TextEffect
                  preset="fade-in-blur"
                  speedSegment={0.3}
                  as="h1"
                  className="mx-auto mt-8 max-w-4xl text-balance text-5xl max-md:font-semibold md:text-7xl lg:mt-16 xl:text-[5.25rem]"
                >
                  Making charts is easy now.
                </TextEffect>
                <TextEffect
                  per="line"
                  preset="fade-in-blur"
                  speedSegment={0.3}
                  delay={0.2}
                  as="p"
                  className="mx-auto mt-8 max-w-2xl text-balance text-lg"
                >
                  AI-powered when you want speed. Fully manual when you want
                  control.
                </TextEffect>

                <AnimatedGroup
                  variants={{
                    container: {
                      visible: {
                        transition: {
                          staggerChildren: 0.05,
                          delayChildren: 0.75,
                        },
                      },
                    },
                    ...transitionVariants,
                  }}
                  className="mt-12 flex flex-col items-center justify-center gap-2 md:flex-row"
                >
                  <div
                    key={1}
                    className="bg-foreground/10 rounded-[calc(var(--radius-xl)+0.125rem)] border p-0.5"
                  >
                    <Button
                      asChild
                      size="lg"
                      className="rounded-xl px-5 text-base"
                    >
                      <a href="/new-chart">
                        <span className="text-nowrap">Start Plotting</span>
                      </a>
                    </Button>
                  </div>
                </AnimatedGroup>
              </div>
            </div>

            <AnimatedGroup
              variants={{
                container: {
                  visible: {
                    transition: {
                      staggerChildren: 0.05,
                      delayChildren: 0.75,
                    },
                  },
                },
                ...transitionVariants,
              }}
            >
              <div className="relative mt-16 px-4 sm:px-6 lg:px-8 sm:mt-24 max-w-7xl mx-auto w-full">
                <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-16">
                  <FeatureImage src={chartAI} />
                  <div className="flex-1 w-full text-center lg:text-left">
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">
                      Generate with AI
                    </h2>
                    <p className="text-lg text-gray-600">
                      Describe the chart you want in plain language and our
                      advanced AI model will build it for you. Iterate with
                      follow-up prompts, carry context forward with memory, and
                      refine your visualization turn by turn.
                    </p>
                  </div>
                </div>
              </div>
              <div className="relative mt-16 px-4 sm:px-6 lg:px-8 sm:mt-24 mb-24 max-w-7xl mx-auto w-full">
                <div className="flex flex-col lg:flex-row-reverse items-center gap-8 lg:gap-16">
                  <FeatureImage src={chartManual} />
                  <div className="flex-1 w-full text-center lg:text-left">
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">
                      Build Manually
                    </h2>
                    <p className="text-lg text-gray-600">
                      Configure each chart field by hand. Choose from bar, line,
                      area, pie, scatter, or radar, supply your own data, and
                      watch the chart update live as you edit.
                    </p>
                  </div>
                </div>
              </div>
            </AnimatedGroup>
          </div>
        </section>
        <div>
          <Footer />
        </div>
      </main>
    </>
  );
};
