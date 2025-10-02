import React from "react";
import ReactDOM from "react-dom/client";
import { AuthProvider, Private } from "./auth/AuthContext";
import Applications from "./pages/Applications";
import Login from "./pages/Login";

function Router() {
  const path = window.location.pathname;
  if (path === "/login") return <Login />;
  return (
    <Private>
      <Applications />
    </Private>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <Router />
    </AuthProvider>
  </React.StrictMode>
);
