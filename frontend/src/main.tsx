import React from "react";
import ReactDOM from "react-dom/client";
import Applications from "./pages/Applications";
import Kanban from "./pages/Kanban";
import { AuthProvider, Private } from "./auth/AuthContext";
import Login from "./pages/Login";

function Router() {
  const path = window.location.pathname;
  if (path === "/login") return <Login />;
  if (path === "/kanban")
    return (
      <Private>
        <Kanban />
      </Private>
    );
  // default: listado
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
