import React, { useState } from "react";
import { Lock, User, Mail } from "lucide-react";

export default function Auth({ onLoginSuccess }) {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: ""
  });

  const toggleMode = () => setIsLoginMode(!isLoginMode);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Simulate login/registration
    console.log(`${isLoginMode ? 'Login' : 'Signup'} attempt:`, formData);
    onLoginSuccess();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-6 flex flex-col items-center">
        <div className="w-14 h-14 rounded-full bg-gradient-to-r from-teal-500 to-cyan-400 flex items-center justify-center shadow-md mb-4">
          <Lock className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-slate-800 mb-1">
          AI Wellness Coach
        </h1>
        <p className="text-sm text-slate-500 mb-6">
          {isLoginMode ? "Log in to continue" : "Create your account"}
        </p>

        <form className="w-full space-y-4" onSubmit={handleSubmit}>
          {!isLoginMode && (
            <div>
              <label className="text-sm text-slate-600">Name</label>
              <div className="flex items-center mt-1 border border-gray-200 rounded-lg px-3 py-2 bg-slate-50">
                <User className="w-4 h-4 text-slate-400 mr-2" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Your Name"
                  className="flex-1 bg-transparent outline-none text-sm"
                  required={!isLoginMode}
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-sm text-slate-600">Email</label>
            <div className="flex items-center mt-1 border border-gray-200 rounded-lg px-3 py-2 bg-slate-50">
              <Mail className="w-4 h-4 text-slate-400 mr-2" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="you@example.com"
                className="flex-1 bg-transparent outline-none text-sm"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-sm text-slate-600">Password</label>
            <div className="flex items-center mt-1 border border-gray-200 rounded-lg px-3 py-2 bg-slate-50">
              <Lock className="w-4 h-4 text-slate-400 mr-2" />
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="••••••••"
                className="flex-1 bg-transparent outline-none text-sm"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-lg bg-gradient-to-r from-teal-500 to-cyan-400 text-white font-semibold shadow-md hover:shadow-lg transition"
          >
            {isLoginMode ? "Log In" : "Create Account"}
          </button>
        </form>

        <p className="text-sm text-slate-500 mt-4">
          {isLoginMode ? (
            <>
              Need an account?{" "}
              <button
                onClick={toggleMode}
                className="text-teal-500 font-medium hover:underline"
              >
                Sign Up
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                onClick={toggleMode}
                className="text-teal-500 font-medium hover:underline"
              >
                Log In
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}