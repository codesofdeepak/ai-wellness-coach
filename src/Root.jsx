import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import App from "./App";
import Auth from "./Auth";
import Exercise from "./Exercise";
import { useAuth } from "./AuthContext";

export default function Root() {
  const { user, logout } = useAuth();

  return (
    <Routes>
      <Route
        path="/"
        element={
          user ? <Navigate to="/app" /> : <Auth onLoginSuccess={() => {}} />
        }
      />

      <Route
        path="/app"
        element={
          user ? <App onLogout={logout} /> : <Navigate to="/" />
        }
      />

      <Route
        path="/exercise"
        element={
          user ? <Exercise /> : <Navigate to="/" />
        }
      />
    </Routes>
  );
}
