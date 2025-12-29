import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Auth from './Auth';
import App from './App';
import Exercise from './Exercise';
import NLPDiet from './NLPDiet';


export default function Root() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  return (
    <Router>
      <Routes>
        <Route 
          path="/" 
          element={
            isAuthenticated ? 
            <Navigate to="/app" replace /> : 
            <Auth onLoginSuccess={handleLoginSuccess} />
          } 
        />
        <Route 
          path="/auth" 
          element={
            isAuthenticated ? 
            <Navigate to="/app" replace /> : 
            <Auth onLoginSuccess={handleLoginSuccess} />
          } 
        />
        <Route 
          path="/app" 
          element={
            isAuthenticated ? 
            <App onLogout={handleLogout} /> : 
            <Navigate to="/" replace />
          } 
        />
        <Route 
          path="/exercise" 
          element={
            isAuthenticated ? 
            <Exercise /> : 
            <Navigate to="/" replace />
          } 
        />
        <Route 
        path="/diet" 
        element={
          isAuthenticated ? 
          <NLPDiet /> : 
          <Navigate to="/" replace />
          } 
        />
      </Routes>
    </Router>
  );
}