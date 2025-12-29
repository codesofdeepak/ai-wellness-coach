import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, MessageCircle, Sparkles, Utensils, Plus, X, Heart, Clock, Flame } from "lucide-react";

export default function NLPDiet() {
  const navigate = useNavigate();
  const [userInput, setUserInput] = useState("");
  const [recommendations, setRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [conversation, setConversation] = useState([]);
  const [availableIngredients, setAvailableIngredients] = useState([]);
  const [newIngredient, setNewIngredient] = useState("");
  const [backendStatus, setBackendStatus] = useState("checking");

  // Check backend status on component mount
  useEffect(() => {
    checkBackendStatus();
  }, []);

  const checkBackendStatus = async () => {
    try {
      const response = await fetch('http://localhost:5002/diet/status');
      if (response.ok) {
        setBackendStatus("connected");
      } else {
        setBackendStatus("disconnected");
      }
    } catch (error) {
      setBackendStatus("disconnected");
      console.log("Diet backend not connected:", error);
    }
  };

  const handleBackToApp = () => {
    navigate("/app");
  };

  const getRecommendations = async (query, ingredients = []) => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:5002/diet/recommend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: query,
          ingredients: ingredients,
          method: 'hybrid'
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setRecommendations(data.recommendations);
        return data.recommendations;
      } else {
        throw new Error(data.error || 'Failed to get recommendations');
      }
    } catch (error) {
      console.error('Error getting recommendations:', error);
      // Fallback to local recommendations if backend fails
      return getFallbackRecommendations(query);
    } finally {
      setIsLoading(false);
    }
  };

  // Fallback recommendations if backend is down
  const getFallbackRecommendations = (query) => {
    const fallbackMeals = [
      {
        id: 1,
        name: "Greek Yogurt Protein Bowl",
        description: "High-protein breakfast with Greek yogurt, berries, and almonds",
        calories: 320,
        protein: 25,
        carbs: 30,
        fat: 10,
        prep_time: 5,
        cuisine: "mediterranean",
        similarity_score: 0.9
      },
      {
        id: 2,
        name: "Grilled Chicken Salad",
        description: "Lean protein with fresh vegetables and light dressing",
        calories: 450,
        protein: 40,
        carbs: 25,
        fat: 22,
        prep_time: 15,
        cuisine: "international",
        similarity_score: 0.8
      }
    ];
    setRecommendations(fallbackMeals);
    return fallbackMeals;
  };

  const handleSendMessage = async () => {
    if (!userInput.trim()) return;

    const userMessage = { type: 'user', content: userInput, timestamp: new Date() };
    setConversation(prev => [...prev, userMessage]);
    
    const currentInput = userInput;
    setUserInput("");
    setIsLoading(true);

    try {
      const recs = await getRecommendations(currentInput, availableIngredients);
      
      const aiResponse = {
        type: 'ai',
        content: `I found ${recs.length} meal recommendations based on your query: "${currentInput}"`,
        recommendations: recs,
        timestamp: new Date()
      };
      
      setConversation(prev => [...prev, aiResponse]);
      
    } catch (error) {
      console.error('Error processing message:', error);
      const errorMessage = {
        type: 'ai',
        content: "I apologize, but I'm having trouble processing your request. Please try again.",
        isError: true,
        timestamp: new Date()
      };
      setConversation(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const addIngredient = () => {
    if (newIngredient.trim() && !availableIngredients.includes(newIngredient.trim().toLowerCase())) {
      setAvailableIngredients(prev => [...prev, newIngredient.trim().toLowerCase()]);
      setNewIngredient("");
    }
  };

  const removeIngredient = (ingredient) => {
    setAvailableIngredients(prev => prev.filter(item => item !== ingredient));
  };

  const quickSuggestions = [
    "I want to lose weight",
    "High protein meals for muscle gain",
    "Quick and easy breakfast ideas",
    "Low carb dinner options",
    "Healthy vegetarian meals",
    "Meals under 400 calories"
  ];

  const handleQuickSuggestion = (suggestion) => {
    setUserInput(suggestion);
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
        <div className="flex-1">
          <h1 className="text-2xl font-bold">AI Diet Assistant</h1>
          <p className="text-sm text-slate-500">
            Get personalized meal recommendations using natural language processing
          </p>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
          backendStatus === 'connected' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {backendStatus === 'connected' ? '✅ Backend Connected' : '❌ Backend Offline'}
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Left Sidebar */}
        <div className="xl:col-span-1 space-y-6">
          {/* Quick Suggestions */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-500" />
              Quick Suggestions
            </h3>
            <div className="space-y-2">
              {quickSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickSuggestion(suggestion)}
                  className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-colors text-sm text-slate-700"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>

          {/* Available Ingredients */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Utensils className="w-5 h-5 text-teal-500" />
              Available Ingredients
            </h3>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newIngredient}
                onChange={(e) => setNewIngredient(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addIngredient()}
                placeholder="Add ingredient..."
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-300 text-sm"
              />
              <button
                onClick={addIngredient}
                className="px-3 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {availableIngredients.map((ingredient, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-teal-100 text-teal-800 rounded-full text-sm"
                >
                  {ingredient}
                  <button
                    onClick={() => removeIngredient(ingredient)}
                    className="hover:text-teal-900"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              {availableIngredients.length === 0 && (
                <p className="text-sm text-slate-500 text-center py-2">
                  Add ingredients you have available
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="xl:col-span-3 space-y-6">
          {/* Chat Interface */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <MessageCircle className="w-6 h-6 text-blue-500" />
              <div>
                <h2 className="text-xl font-semibold">Chat with Diet AI</h2>
                <p className="text-sm text-slate-500">
                  Describe your dietary needs, goals, or preferences in natural language
                </p>
              </div>
            </div>

            {/* Conversation */}
            <div className="h-96 overflow-y-auto mb-4 space-y-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
              {conversation.length === 0 && (
                <div className="text-center text-slate-500 py-8">
                  <MessageCircle className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p>Start a conversation about your dietary needs!</p>
                  <p className="text-sm mt-1">Try asking for meal suggestions based on your goals.</p>
                </div>
              )}
              
              {conversation.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-3/4 rounded-lg p-4 ${
                      message.type === 'user'
                        ? 'bg-blue-500 text-white'
                        : message.isError
                        ? 'bg-red-100 text-red-800 border border-red-200'
                        : 'bg-white border border-gray-200 text-gray-800'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                    <p className="text-xs opacity-70 mt-2">
                      {message.timestamp?.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-slate-600">
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      <span className="text-sm">Analyzing your request...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="flex gap-3">
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Example: 'I need high protein meals for muscle building' or 'Quick breakfast under 300 calories'"
                className="flex-1 px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
                disabled={isLoading}
              />
              <button
                onClick={handleSendMessage}
                disabled={isLoading || !userInput.trim()}
                className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                Send
              </button>
            </div>
          </div>

          {/* Recommendations Grid */}
          {recommendations.length > 0 && (
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold flex items-center gap-2">
                  <Utensils className="w-6 h-6 text-green-500" />
                  Personalized Recommendations
                  <span className="text-sm font-normal text-slate-500 ml-2">
                    ({recommendations.length} meals found)
                  </span>
                </h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recommendations.map((meal) => (
                  <div key={meal.id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow bg-white">
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-lg text-slate-800">{meal.name}</h4>
                        <button className="text-slate-400 hover:text-red-500 transition-colors">
                          <Heart className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <p className="text-sm text-slate-600 mb-3 line-clamp-2">{meal.description}</p>
                      
                      <div className="grid grid-cols-4 gap-2 text-xs mb-3">
                        <div className="text-center p-2 bg-blue-50 rounded">
                          <div className="font-semibold text-blue-600">{meal.calories}</div>
                          <div className="text-blue-500">cal</div>
                        </div>
                        <div className="text-center p-2 bg-green-50 rounded">
                          <div className="font-semibold text-green-600">{meal.protein}g</div>
                          <div className="text-green-500">protein</div>
                        </div>
                        <div className="text-center p-2 bg-orange-50 rounded">
                          <div className="font-semibold text-orange-600">{meal.carbs}g</div>
                          <div className="text-orange-500">carbs</div>
                        </div>
                        <div className="text-center p-2 bg-purple-50 rounded">
                          <div className="font-semibold text-purple-600">{meal.fat}g</div>
                          <div className="text-purple-500">fat</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm text-slate-500">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{meal.prep_time} min</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Flame className="w-3 h-3" />
                          <span>{meal.cuisine}</span>
                        </div>
                      </div>
                      
                      {meal.similarity_score && (
                        <div className="mt-2">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full" 
                              style={{ width: `${meal.similarity_score * 100}%` }}
                            ></div>
                          </div>
                          <p className="text-xs text-slate-500 text-right mt-1">
                            Match: {(meal.similarity_score * 100).toFixed(0)}%
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}