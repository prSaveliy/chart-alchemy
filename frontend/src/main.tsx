import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

import { HeroSection } from "./pages/home";
import { GoogleLogin } from "./pages/auth/google-login";
import { Error } from "./pages/error";
import { LoginForm } from "./pages/auth/login";
import { SignUpForm } from "./pages/auth/signup";
import { ActivateAccount } from "./pages/auth/activate-account";

import { createBrowserRouter, RouterProvider } from "react-router-dom";

const router = createBrowserRouter([
  { path: "/", element: <HeroSection /> },
  { path: "/login", element: <LoginForm /> },
  { path: "/signup", element: <SignUpForm /> },
  { path: "/auth/google/*", element: <GoogleLogin /> },
  { path: "/activate/:token", element: <ActivateAccount /> },
  {
    path: "*",
    element: (
      <Error
        error="Page Not Found"
        secondaryMessage="Oops! The page you're trying to access doesn't exist."
      />
    ),
  },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
