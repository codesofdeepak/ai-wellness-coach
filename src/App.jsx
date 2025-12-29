import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  BarChart2,
  Video,
  Utensils,
  Apple,
  Search,
  Home,
  Menu,
  Clock,
  User,
  Play,
  LogOut,
} from "lucide-react";

export default function App({ onLogout }) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [goalCuisine, setGoalCuisine] = useState("");
  const [mealQuery, setMealQuery] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 2000);
    return () => clearTimeout(t);
  }, []);

  const handleExerciseClick = () => {
    navigate('/exercise');
  };

  const handleDietClick = () => {
    navigate('/diet');
  };

  const handleLogout = () => {
    onLogout();
    navigate('/');
  };

  // Mock data
  const mockMeals = [
    "Garlic Lemon Salmon - Low-carb",
    "Quinoa & Veggie Bowl - Balanced",
    "Chicken Salad - High-Protein",
  ];

  const mockNutrition = {
    name: "Sample Meal",
    calories: 540,
    protein: "35g",
    carbs: "42g",
    fat: "18g",
  };

  return (
    <div className="min-h-screen bg-gray-50 text-slate-800">
      {/* Loading screen */}
      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/90">
          <div className="flex flex-col items-center gap-6">
            {/* Animated logo */}
            <div className="relative flex items-center justify-center">
              <div className="absolute -inset-6 rounded-full bg-gradient-to-r from-teal-400 to-cyan-500 opacity-30 transform animate-pulse blur-2xl"></div>
              <div className="w-36 h-36 flex items-center justify-center rounded-full bg-white shadow-xl">
                <div className="w-20 h-20 rounded-full flex items-center justify-center bg-gradient-to-br from-teal-500 to-cyan-400 shadow-inner animate-[spin_2s_linear_infinite]">
                  <Play className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>
            <div className="text-center">
              <h2 className="text-xl font-semibold text-slate-700">
                AI Wellness Coach
              </h2>
              <p className="text-sm text-slate-500">
                Personalized fitness, nutrition & tracking — loading…
              </p>
            </div>
          </div>
        </div>
      )}

      {/* App Layout */}
      <div
        className={`min-h-screen ${
          isLoading ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
      >
        <div className="md:flex">
          {/* Sidebar */}
          <aside className="hidden md:flex md:flex-col md:sticky md:top-0 md:h-screen md:w-64 lg:w-72 bg-white/60 backdrop-blur border-r border-gray-100 px-4 py-6">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-400 flex items-center justify-center shadow-md">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold">AI Wellness Coach</h1>
                <p className="text-xs text-slate-500">Focus • Move • Nourish</p>
              </div>
            </div>

            <nav className="flex-1">
              <ul className="space-y-2">
                <li>
                  <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50">
                    <Home className="w-5 h-5 text-slate-600" />
                    <span className="text-sm font-medium">Dashboard</span>
                  </button>
                </li>
                <li>
                  <button 
                    onClick={handleExerciseClick}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <Video className="w-5 h-5 text-slate-600" />
                    <span className="text-sm font-medium">
                      Exercise Correction
                    </span>
                  </button>
                </li>
                <li>
                  <button 
                    onClick={handleDietClick}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <Utensils className="w-5 h-5 text-slate-600" />
                    <span className="text-sm font-medium">
                      Diet Recommendation
                    </span>
                  </button>
                </li>
                <li>
                  <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50">
                    <BarChart2 className="w-5 h-5 text-slate-600" />
                    <span className="text-sm font-medium">Progress</span>
                  </button>
                </li>
                <li>
                  <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50">
                    <Apple className="w-5 h-5 text-slate-600" />
                    <span className="text-sm font-medium">Nutrition</span>
                  </button>
                </li>
              </ul>
            </nav>

            <div className="mt-6">
              <div className="px-3 py-3 rounded-lg bg-gradient-to-r from-slate-50 to-white shadow-sm">
                <p className="text-xs text-slate-500">Today</p>
                <p className="text-sm font-semibold">Active Minutes: 42</p>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                <User className="w-5 h-5 text-slate-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Hi, User</p>
                <p className="text-xs text-slate-500">Ready for your session?</p>
              </div>
              <button 
                onClick={handleLogout}
                className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4 text-slate-500" />
              </button>
            </div>
          </aside>

          {/* Main content */}
          <main className="flex-1 p-4 md:p-8">
            {/* Top bar (mobile) */}
            <div className="flex items-center justify-between md:hidden mb-4">
              <div className="flex items-center gap-3">
                <button className="p-2 rounded-lg bg-white shadow-sm">
                  <Menu className="w-5 h-5" />
                </button>
                <h2 className="text-lg font-semibold">AI Wellness Coach</h2>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-slate-600" />
                <span className="text-sm text-slate-500">
                  {new Date().toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Header */}
            <header className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold">Welcome back 👋</h3>
                <p className="text-sm text-slate-500 mt-1">
                  Here's your dashboard overview
                </p>
              </div>
              <div className="hidden sm:flex items-center gap-3">
                <div className="px-3 py-2 rounded-lg bg-white shadow-sm text-sm">
                  Quick Stats
                </div>
                <button className="px-4 py-2 rounded-lg bg-gradient-to-r from-teal-500 to-cyan-400 text-white shadow-lg">
                  Start Session
                </button>
              </div>
            </header>

            {/* Grid Section */}
            <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2">
              {/* Exercise Correction */}
              <div className="col-span-1 bg-white rounded-2xl p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-gradient-to-br from-teal-50 to-cyan-50">
                      <Video className="w-6 h-6 text-teal-500" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold">
                        Exercise Correction
                      </h4>
                      <p className="text-sm text-slate-500">
                        Live Form Feedback - Ready for real-time form analysis.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 rounded-xl border border-dashed border-slate-100 p-4 flex flex-col gap-4 items-center justify-center">
                  <div className="w-full h-40 rounded-lg bg-slate-50 flex items-center justify-center border shadow-inner">
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center shadow">
                        <Play className="w-6 h-6 text-teal-500" />
                      </div>
                      <span>Camera / Video Placeholder</span>
                    </div>
                  </div>

                  <button 
                    onClick={handleExerciseClick}
                    className="mt-2 px-4 py-2 rounded-lg bg-gradient-to-r from-teal-500 to-cyan-400 text-white font-medium shadow hover:shadow-lg transition"
                  >
                    Start AI Workout Session
                  </button>
                </div>
              </div>

              {/* Diet Recommendation */}
              <div className="col-span-1 bg-white rounded-2xl p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-gradient-to-br from-amber-50 to-orange-50">
                      <Utensils className="w-6 h-6 text-amber-500" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold">
                        Diet Recommendation
                      </h4>
                      <p className="text-sm text-slate-500">
                        AI-Powered Meal Plans - Get personalized nutrition advice.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <label className="text-sm text-slate-500">
                    Tell me your dietary goals
                  </label>
                  <div className="mt-2 flex gap-2">
                    <input
                      value={goalCuisine}
                      onChange={(e) => setGoalCuisine(e.target.value)}
                      placeholder="e.g. I want to lose weight with high protein meals"
                      className="flex-1 px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-300"
                    />
                    <button className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors">
                      Apply
                    </button>
                  </div>

                  <div className="mt-4 space-y-2">
                    {mockMeals.map((m, i) => (
                      <div key={i} className="p-3 rounded-lg bg-slate-50 border hover:border-teal-300 transition-colors cursor-pointer">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{m}</p>
                            <p className="text-xs text-slate-400">
                              AI-suggested meal #{i + 1}
                            </p>
                          </div>
                          <div className="text-xs text-slate-500">10–20 min</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button 
                    onClick={handleDietClick}
                    className="w-full mt-4 py-2.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-400 text-white font-medium shadow hover:shadow-lg transition"
                  >
                    Get Personalized Diet Plan
                  </button>
                </div>
              </div>

              {/* Progress Tracking */}
              <div className="col-span-1 bg-white rounded-2xl p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-gradient-to-br from-sky-50 to-indigo-50">
                      <BarChart2 className="w-6 h-6 text-sky-500" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold">
                        Progress Tracking
                      </h4>
                      <p className="text-sm text-slate-500">
                        Stats Overview - Visualize your fitness journey.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="p-4 rounded-lg bg-slate-50 border flex flex-col">
                    <div className="text-xs text-slate-500">Weight</div>
                    <div className="mt-2 text-2xl font-bold">85 kg</div>
                    <div className="text-xs text-slate-400 mt-1">
                      -1.2 kg in 2 weeks
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-slate-50 border flex flex-col">
                    <div className="text-xs text-slate-500">Lifts Improved</div>
                    <div className="mt-2 text-2xl font-bold">15%</div>
                    <div className="text-xs text-slate-400 mt-1">
                      Since last month
                    </div>
                  </div>
                </div>

                <div className="mt-4 h-28 rounded-lg bg-gradient-to-br from-white to-slate-50 border flex items-center justify-center">
                  <div className="text-slate-400">Chart Placeholder</div>
                </div>
              </div>

              {/* Food Nutrition Tracker */}
              <div className="col-span-1 bg-white rounded-2xl p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-gradient-to-br from-emerald-50 to-lime-50">
                      <Apple className="w-6 h-6 text-emerald-500" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold">
                        Food Nutrition Tracker
                      </h4>
                      <p className="text-sm text-slate-500">
                        Log Your Meal - Analyze nutritional content.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex gap-2">
                    <input
                      value={mealQuery}
                      onChange={(e) => setMealQuery(e.target.value)}
                      placeholder="Search meal or ingredient"
                      className="flex-1 px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-300"
                    />
                    <button className="px-4 py-2 rounded-lg bg-gradient-to-r from-teal-500 to-cyan-400 text-white hover:shadow-lg transition">
                      Analyze Meal
                    </button>
                  </div>

                  <div className="mt-4 p-3 rounded-lg bg-slate-50 border">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{mockNutrition.name}</p>
                        <p className="text-xs text-slate-400">Mock analysis</p>
                      </div>
                      <div className="text-sm text-slate-500">
                        {mockNutrition.calories} kcal
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="p-2 bg-white rounded">
                        Protein<br />
                        <span className="font-semibold">
                          {mockNutrition.protein}
                        </span>
                      </div>
                      <div className="p-2 bg-white rounded">
                        Carbs<br />
                        <span className="font-semibold">
                          {mockNutrition.carbs}
                        </span>
                      </div>
                      <div className="p-2 bg-white rounded">
                        Fat<br />
                        <span className="font-semibold">
                          {mockNutrition.fat}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Footer */}
            <div className="mt-8 text-center text-xs text-slate-400">
              AI Wellness Coach - Your personal fitness and nutrition assistant
            </div>
          </main>
        </div>

        {/* Mobile Footer Navigation */}
        <footer className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-40 w-[95%] md:hidden">
          <div className="bg-white/90 backdrop-blur px-4 py-2 rounded-2xl shadow-lg flex items-center justify-between">
            <button className="flex flex-col items-center text-xs">
              <Home className="w-5 h-5 mb-1" />
              Home
            </button>
            <button 
              onClick={handleExerciseClick}
              className="flex flex-col items-center text-xs"
            >
              <Video className="w-5 h-5 mb-1" />
              Exercise
            </button>
            <button 
              onClick={handleDietClick}
              className="flex flex-col items-center text-xs"
            >
              <Utensils className="w-5 h-5 mb-1" />
              Diet
            </button>
            <button className="flex flex-col items-center text-xs">
              <BarChart2 className="w-5 h-5 mb-1" />
              Progress
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}