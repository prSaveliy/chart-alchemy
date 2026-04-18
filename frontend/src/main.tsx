import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

import { HeroSection } from "./pages/home";
import { GoogleLogin } from "./pages/auth/google-login";
import { Error } from "./pages/error";
import { LoginForm } from "./pages/auth/login";
import { SignUpForm } from "./pages/auth/signup";
import { ActivateAccount } from "./pages/auth/activate-account";
import { ForgotPassword } from "./pages/auth/forgot-password";
import { PasswordReset } from "./pages/auth/password-reset";
import { NewChart } from "./pages/chart/new-chart";
import { Chart } from "./pages/chart/chart";
import { Dashboard } from "./pages/dashboard";
import { ProtectedRoute } from "./components/layout/protected-route";

import { createBrowserRouter, RouterProvider } from "react-router-dom";

const router = createBrowserRouter([
  { path: "/", element: <HeroSection /> },
  { path: "/login", element: <LoginForm /> },
  { path: "/signup", element: <SignUpForm /> },
  { path: "/auth/google/*", element: <GoogleLogin /> },
  { path: "/activate/:token", element: <ActivateAccount /> },
  { path: "/forgot-password", element: <ForgotPassword /> },
  { path: "/password-reset/:token", element: <PasswordReset /> },
  { path: "/dashboard", element: <ProtectedRoute><Dashboard /></ProtectedRoute> },
  { path: "/new-chart", element: <ProtectedRoute><NewChart /></ProtectedRoute> },
  { path: "/chart/:token", element: <ProtectedRoute><Chart /></ProtectedRoute> },
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