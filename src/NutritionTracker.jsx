import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Scale, Apple, Flame, Zap, Droplets, BarChart3, Plus, Trash2 } from "lucide-react";

export default function NutritionTracker() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [mealItems, setMealItems] = useState([]);
  const [totalNutrition, setTotalNutrition] = useState(null);

  const handleBackToApp = () => {
    navigate("/app");
  };

  const searchFood = async () => {
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    setError("");
    
    try {
      const response = await fetch('http://localhost:5003/nutrition/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: searchQuery
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setSearchResults(data.nutrition);
        setError("");
      } else {
        setError(data.error || "Food not found. Try a different name.");
        setSearchResults(null);
      }
    } catch (error) {
      setError("Failed to connect to nutrition server. Please try again.");
      setSearchResults(null);
    } finally {
      setIsLoading(false);
    }
  };

  const addToMeal = () => {
    if (searchResults) {
      setMealItems(prev => [...prev, { ...searchResults, id: Date.now() }]);
      setSearchResults(null);
      setSearchQuery("");
      calculateTotalNutrition();
    }
  };

  const removeFromMeal = (id) => {
    setMealItems(prev => prev.filter(item => item.id !== id));
    calculateTotalNutrition();
  };

  const calculateTotalNutrition = () => {
    const total = {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
      sugar: 0
    };

    mealItems.forEach(item => {
      total.calories += item.calories || 0;
      total.protein += item.protein || 0;
      total.carbs += item.carbs || 0;
      total.fat += item.fat || 0;
      total.fiber += item.fiber || 0;
      total.sugar += item.sugar || 0;
    });

    setTotalNutrition(total);
  };

  const clearMeal = () => {
    setMealItems([]);
    setTotalNutrition(null);
  };

  const getNutritionColor = (value, type) => {
    const ranges = {
      calories: { low: 100, high: 400 },
      protein: { low: 5, high: 20 },
      carbs: { low: 10, high: 40 },
      fat: { low: 3, high: 15 }
    };

    const range = ranges[type];
    if (!range) return 'gray';

    if (value < range.low) return 'green';
    if (value > range.high) return 'red';
    return 'yellow';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={handleBackToApp}
          className="p-2 rounded-lg bg-white shadow-sm hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold">Food Nutrition Tracker</h1>
          <p className="text-sm text-slate-500">
            Search any food item to see its nutritional content
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Search & Results */}
        <div className="space-y-6">
          {/* Search Section */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <Search className="w-6 h-6 text-blue-500" />
              <div>
                <h2 className="text-lg font-semibold">Search Food</h2>
                <p className="text-sm text-slate-500">
                  Enter any food item to get nutritional information
                </p>
              </div>
            </div>

            <div className="flex gap-3 mb-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && searchFood()}
                placeholder="e.g., banana, chicken breast, pasta, apple..."
                className="flex-1 px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
              <button
                onClick={searchFood}
                disabled={isLoading || !searchQuery.trim()}
                className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Search className="w-4 h-4" />
                {isLoading ? "Searching..." : "Search"}
              </button>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            {/* Search Results */}
            {searchResults && (
              <div className="mt-4 p-4 border border-green-200 rounded-lg bg-green-50">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-lg text-green-800">
                    {searchResults.name}
                  </h3>
                  <span className="text-sm text-green-600 bg-green-100 px-2 py-1 rounded">
                    {searchResults.category}
                  </span>
                </div>

                <p className="text-sm text-green-700 mb-3">
                  Serving: {searchResults.serving_size}
                </p>

                {/* Nutrition Facts */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="text-center p-3 bg-white rounded-lg border">
                    <Flame className="w-6 h-6 text-orange-500 mx-auto mb-1" />
                    <div className="font-bold text-lg text-orange-600">{searchResults.calories}</div>
                    <div className="text-xs text-orange-500">Calories</div>
                  </div>

                  <div className="text-center p-3 bg-white rounded-lg border">
                    <Zap className="w-6 h-6 text-blue-500 mx-auto mb-1" />
                    <div className="font-bold text-lg text-blue-600">{searchResults.protein}g</div>
                    <div className="text-xs text-blue-500">Protein</div>
                  </div>

                  <div className="text-center p-3 bg-white rounded-lg border">
                    <Apple className="w-6 h-6 text-green-500 mx-auto mb-1" />
                    <div className="font-bold text-lg text-green-600">{searchResults.carbs}g</div>
                    <div className="text-xs text-green-500">Carbs</div>
                  </div>

                  <div className="text-center p-3 bg-white rounded-lg border">
                    <Droplets className="w-6 h-6 text-yellow-500 mx-auto mb-1" />
                    <div className="font-bold text-lg text-yellow-600">{searchResults.fat}g</div>
                    <div className="text-xs text-yellow-500">Fat</div>
                  </div>

                  <div className="text-center p-3 bg-white rounded-lg border">
                    <Scale className="w-6 h-6 text-purple-500 mx-auto mb-1" />
                    <div className="font-bold text-lg text-purple-600">{searchResults.fiber}g</div>
                    <div className="text-xs text-purple-500">Fiber</div>
                  </div>

                  <div className="text-center p-3 bg-white rounded-lg border">
                    <BarChart3 className="w-6 h-6 text-red-500 mx-auto mb-1" />
                    <div className="font-bold text-lg text-red-600">{searchResults.sugar}g</div>
                    <div className="text-xs text-red-500">Sugar</div>
                  </div>
                </div>

                <button
                  onClick={addToMeal}
                  className="w-full mt-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add to Meal
                </button>

                {searchResults.note && (
                  <p className="text-xs text-green-600 mt-2">{searchResults.note}</p>
                )}
              </div>
            )}
          </div>

          {/* Quick Search Suggestions */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h3 className="font-semibold mb-3">Quick Search</h3>
            <div className="flex flex-wrap gap-2">
              {['Apple', 'Banana', 'Chicken', 'Rice', 'Egg', 'Milk', 'Bread', 'Pasta', 'Salmon', 'Yogurt'].map((food) => (
                <button
                  key={food}
                  onClick={() => {
                    setSearchQuery(food);
                    setTimeout(searchFood, 100);
                  }}
                  className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                >
                  {food}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Meal Builder */}
        <div className="space-y-6">
          {/* Current Meal */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Apple className="w-5 h-5 text-green-500" />
                Your Meal
              </h2>
              {mealItems.length > 0 && (
                <button
                  onClick={clearMeal}
                  className="text-sm text-red-500 hover:text-red-700"
                >
                  Clear All
                </button>
              )}
            </div>

            {mealItems.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <Apple className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p>No items in your meal yet</p>
                <p className="text-sm mt-1">Search and add foods to see nutrition totals</p>
              </div>
            ) : (
              <div className="space-y-3">
                {mealItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-slate-500">
                        {item.calories} cal • {item.protein}g protein • {item.carbs}g carbs
                      </p>
                    </div>
                    <button
                      onClick={() => removeFromMeal(item.id)}
                      className="p-1 text-red-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Total Nutrition */}
          {totalNutrition && (
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-purple-500" />
                Total Nutrition
              </h2>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className={`text-center p-4 rounded-lg border-2 ${
                  getNutritionColor(totalNutrition.calories, 'calories') === 'green' ? 'border-green-200 bg-green-50' :
                  getNutritionColor(totalNutrition.calories, 'calories') === 'yellow' ? 'border-yellow-200 bg-yellow-50' :
                  'border-red-200 bg-red-50'
                }`}>
                  <div className="font-bold text-2xl text-slate-800">{totalNutrition.calories}</div>
                  <div className="text-sm text-slate-600">Calories</div>
                </div>

                <div className={`text-center p-4 rounded-lg border-2 ${
                  getNutritionColor(totalNutrition.protein, 'protein') === 'green' ? 'border-green-200 bg-green-50' :
                  getNutritionColor(totalNutrition.protein, 'protein') === 'yellow' ? 'border-yellow-200 bg-yellow-50' :
                  'border-red-200 bg-red-50'
                }`}>
                  <div className="font-bold text-2xl text-slate-800">{totalNutrition.protein}g</div>
                  <div className="text-sm text-slate-600">Protein</div>
                </div>

                <div className={`text-center p-4 rounded-lg border-2 ${
                  getNutritionColor(totalNutrition.carbs, 'carbs') === 'green' ? 'border-green-200 bg-green-50' :
                  getNutritionColor(totalNutrition.carbs, 'carbs') === 'yellow' ? 'border-yellow-200 bg-yellow-50' :
                  'border-red-200 bg-red-50'
                }`}>
                  <div className="font-bold text-2xl text-slate-800">{totalNutrition.carbs}g</div>
                  <div className="text-sm text-slate-600">Carbs</div>
                </div>

                <div className={`text-center p-4 rounded-lg border-2 ${
                  getNutritionColor(totalNutrition.fat, 'fat') === 'green' ? 'border-green-200 bg-green-50' :
                  getNutritionColor(totalNutrition.fat, 'fat') === 'yellow' ? 'border-yellow-200 bg-yellow-50' :
                  'border-red-200 bg-red-50'
                }`}>
                  <div className="font-bold text-2xl text-slate-800">{totalNutrition.fat}g</div>
                  <div className="text-sm text-slate-600">Fat</div>
                </div>

                <div className="text-center p-4 rounded-lg border-2 border-blue-200 bg-blue-50">
                  <div className="font-bold text-2xl text-slate-800">{totalNutrition.fiber}g</div>
                  <div className="text-sm text-slate-600">Fiber</div>
                </div>

                <div className="text-center p-4 rounded-lg border-2 border-pink-200 bg-pink-50">
                  <div className="font-bold text-2xl text-slate-800">{totalNutrition.sugar}g</div>
                  <div className="text-sm text-slate-600">Sugar</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}