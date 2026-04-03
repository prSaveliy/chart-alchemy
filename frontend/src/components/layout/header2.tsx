import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Logo } from "@/components/layout/logo";
import { Avatar, AvatarImage } from "@/components/ui/avatar";

import { ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";

import authService from "@/services/authService";

export const Header2 = (props: { userPicture: string | null }) => {
  const navigate = useNavigate();

  const logout = async () => {
    await authService.logout();
    navigate('/login');
  };

  return (
    <div className="flex h-24 border-b items-center px-10">
      <div className="flex flex-1 content-center">
        <a href="/" aria-label="home" className="flex items-center space-x-2">
          <Logo />
        </a>
      </div>

      <div className="flex flex-1 items-center justify-end">
        <div className="flex">
          <DropdownMenu>
            <DropdownMenuTrigger>
              <button className="flex items-center justify-center w-18 h-12 rounded-2xl hover:bg-black/2 cursor-pointer">
                <Avatar className="mr-1">
                  <AvatarImage src={props.userPicture} alt="@shadcn" />
                </Avatar>
                <ChevronDown className="mt-1 text-black/60 w-5 h-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="align-middle w-36">
              <DropdownMenuGroup>
                <DropdownMenuLabel className="text-black/60 text-xs">
                  My Account
                </DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => navigate('/new-chart')}
                  className="cursor-pointer"
                >
                  New Chart
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {}}
                  className="cursor-pointer"
                >
                  Dashboard
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem
                  onClick={() => {}}
                  className="cursor-pointer"
                >
                  About
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    (window.location.href = "https://github.com/prSaveliy/chart-alchemy")
                  }
                  className="cursor-pointer"
                >
                  GitHub
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={logout} className="cursor-pointer">
                  Log Out
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
};
