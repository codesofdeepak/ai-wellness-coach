import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import App from "./App";
import Auth from "./auth";
import ExerciseCorrection from "./ExerciseCorrection";
import "./index.css";

function Root() {
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            isLoggedIn ? (
              <Navigate to="/app" />
            ) : (
              <Auth onLoginSuccess={() => setIsLoggedIn(true)} />
            )
          }
        />
        <Route path="/app" element={<App />} />
        <Route path="/exercise" element={<ExerciseCorrection />} />
      </Routes>
    </BrowserRouter>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<Root />);
