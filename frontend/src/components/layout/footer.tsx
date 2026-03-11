import { Separator } from "@/components/ui/separator";
import { Logo } from "./logo";

const footerLinks = [
  {
    title: "Features",
    href: "#",
  },
  {
    title: "About",
    href: "#",
  },
  {
    title: "Contribute",
    href: "#",
  },
];

const Footer = () => {
  return (
    <div className="flex flex-col">
      <footer className="">
        <div className="mx-auto max-w-(--breakpoint-xl)">
          <div className="flex flex-col items-center justify-start py-12">
            <Logo />
            <ul className="mt-6 flex flex-wrap items-center gap-4">
              {footerLinks.map(({ title, href }) => (
                <li key={title}>
                  <a
                    className="text-muted-foreground hover:text-foreground text-sm"
                    href={href}
                  >
                    {title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <Separator />
          <div className="flex flex-col-reverse items-center justify-between gap-x-2 gap-y-5 px-6 py-6 sm:flex-row xl:px-0">
            <span className="text-muted-foreground text-sm">
              &copy; {new Date().getFullYear()}{" "}
              <a href="/" target="_blank">
                ChartAlchemy
              </a>
              . All rights reserved.
            </span>

            <div className="flex items-center gap-5 text-muted-foreground">
              <a
                href="https://github.com/prSaveliy/chart-alchemy"
                target="_blank"
              >
                <svg
                  fill="currentcolor"
                  height="1.2em"
                  viewBox="0 0 24 24"
                  width="1.2em"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M12 0c6.63 0 12 5.276 12 11.79-.001 5.067-3.29 9.567-8.175 11.187-.6.118-.825-.25-.825-.56 0-.398.015-1.665.015-3.242 0-1.105-.375-1.813-.81-2.181 2.67-.295 5.475-1.297 5.475-5.822 0-1.297-.465-2.344-1.23-3.169.12-.295.54-1.503-.12-3.125 0 0-1.005-.324-3.3 1.209a11.32 11.32 0 00-3-.398c-1.02 0-2.04.133-3 .398-2.295-1.518-3.3-1.209-3.3-1.209-.66 1.622-.24 2.83-.12 3.125-.765.825-1.23 1.887-1.23 3.169 0 4.51 2.79 5.527 5.46 5.822-.345.294-.66.81-.765 1.577-.69.31-2.415.81-3.495-.973-.225-.354-.9-1.223-1.845-1.209-1.005.015-.405.56.015.781.51.28 1.095 1.327 1.23 1.666.24.663 1.02 1.93 4.035 1.385 0 .988.015 1.916.015 2.196 0 .31-.225.664-.825.56C3.303 21.374-.003 16.867 0 11.791 0 5.276 5.37 0 12 0z"></path>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Footer;
