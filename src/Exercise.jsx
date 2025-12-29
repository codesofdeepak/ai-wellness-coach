import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Video, Camera, Play, AlertCircle, CheckCircle, Square, RotateCcw, Volume2, VolumeX } from "lucide-react";

export default function Exercise() {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const feedbackIntervalRef = useRef(null);
  const [selectedExercise, setSelectedExercise] = useState("bicep");
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [aiFeedback, setAiFeedback] = useState({
    reps: 0,
    stage: null,
    feedback: [],
    symmetry: 0,
    angle: 0
  });
  const [backendStatus, setBackendStatus] = useState("disconnected");
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [lastSpoken, setLastSpoken] = useState("");
  const lastRepCountRef = useRef(0);
  const lastFeedbackRef = useRef("");

  const exercises = [
    "bicep",
    "pushup", 
    "squat",
    "lunge",
    "shoulder"
  ];

  const exerciseDisplayNames = {
    bicep: "Bicep Curls",
    pushup: "Push-ups",
    squat: "Squats",
    lunge: "Lunges",
    shoulder: "Shoulder Press"
  };

  const exerciseDescriptions = {
    bicep: "Curl your arms while keeping elbows close to your body",
    pushup: "Lower your body until chest nearly touches the floor",
    squat: "Lower your hips as if sitting back into a chair",
    lunge: "Step forward and lower your hips until both knees are bent at 90°",
    shoulder: "Raise arms overhead while keeping them straight"
  };

  // Check backend connection
  useEffect(() => {
    checkBackendConnection();
  }, []);

  // Cleanup function
  useEffect(() => {
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
      }
      if (feedbackIntervalRef.current) {
        clearInterval(feedbackIntervalRef.current);
      }
      window.speechSynthesis?.cancel();
    };
  }, []);

  // Voice feedback for reps
  useEffect(() => {
    if (voiceEnabled && isSessionActive && aiFeedback.reps > lastRepCountRef.current) {
      speakText(`Rep ${aiFeedback.reps} completed! Good job!`);
      lastRepCountRef.current = aiFeedback.reps;
    }
  }, [aiFeedback.reps, voiceEnabled, isSessionActive]);

  // Voice feedback for form corrections
  useEffect(() => {
    if (voiceEnabled && isSessionActive && aiFeedback.feedback.length > 0) {
      const newFeedback = aiFeedback.feedback[0];
      if (newFeedback !== lastFeedbackRef.current && !newFeedback.includes("💪") && !newFeedback.includes("🔥") && !newFeedback.includes("🎯")) {
        speakText(newFeedback);
        lastFeedbackRef.current = newFeedback;
      }
    }
  }, [aiFeedback.feedback, voiceEnabled, isSessionActive]);

  const speakText = (text) => {
    if (!voiceEnabled) return;
    
    try {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      utterance.volume = 0.8;
      
      // Get available voices and prefer English voices
      const voices = window.speechSynthesis.getVoices();
      const englishVoice = voices.find(voice => voice.lang.includes('en'));
      if (englishVoice) {
        utterance.voice = englishVoice;
      }
      
      utterance.onend = () => {
        setLastSpoken(text);
      };
      
      window.speechSynthesis.speak(utterance);
    } catch (error) {
      console.error("Speech synthesis error:", error);
    }
  };

  const toggleVoiceFeedback = () => {
    const newVoiceState = !voiceEnabled;
    setVoiceEnabled(newVoiceState);
    
    if (!newVoiceState) {
      window.speechSynthesis.cancel();
    } else {
      speakText("Voice feedback enabled");
    }
  };

  const checkBackendConnection = async () => {
    try {
      const response = await fetch('http://localhost:5000/status');
      if (response.ok) {
        setBackendStatus("connected");
      } else {
        setBackendStatus("error");
      }
    } catch (error) {
      console.error("Backend connection failed:", error);
      setBackendStatus("error");
    }
  };

  const handleBackToApp = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
    }
    if (feedbackIntervalRef.current) {
      clearInterval(feedbackIntervalRef.current);
    }
    window.speechSynthesis?.cancel();
    setIsSessionActive(false);
    navigate("/app");
  };

  const startCamera = async () => {
    try {
      setIsLoading(true);
      setCameraError("");

      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user" 
        } 
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await new Promise((resolve) => {
          if (videoRef.current) {
            videoRef.current.onloadedmetadata = () => {
              resolve();
            };
          }
        });
      }
      
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error("Error accessing camera:", error);
      setCameraError("Could not access camera. Please check permissions.");
      setIsLoading(false);
      return false;
    }
  };

  const fetchAIFeedback = async () => {
    try {
      const response = await fetch(`http://localhost:5000/exercise_data`);
      if (!response.ok) {
        throw new Error('Failed to fetch AI feedback');
      }
      const data = await response.json();
      
      // Debug log to see what data we're receiving
      console.log("AI Feedback:", data);
      
      if (data && typeof data.reps === 'number') {
        setAiFeedback({
          reps: data.reps || 0,
          stage: data.stage || null,
          feedback: data.feedback || [],
          symmetry: data.symmetry || 0,
          angle: data.angle || 0
        });
      }
    } catch (error) {
      console.error("Error fetching AI feedback:", error);
    }
  };

  const startExerciseSession = async () => {
    if (!selectedExercise) {
      alert("Please select an exercise first!");
      return;
    }

    await checkBackendConnection();
    if (backendStatus === "error") {
      alert("Backend server is not connected. Please make sure the Flask server is running on port 5000.");
      return;
    }

    const cameraStarted = await startCamera();
    if (!cameraStarted) {
      return;
    }

    setIsSessionActive(true);
    setAiFeedback({
      reps: 0,
      stage: null,
      feedback: [],
      symmetry: 0,
      angle: 0
    });
    lastRepCountRef.current = 0;
    lastFeedbackRef.current = "";

    // Reset count on backend
    try {
      await fetch(`http://localhost:5000/reset_count?exercise=${selectedExercise}`);
    } catch (error) {
      console.error("Error resetting count:", error);
    }

    // Start polling for AI feedback
    startFeedbackPolling();
  };

  const stopExerciseSession = () => {
    setIsSessionActive(false);
    
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
    }
    
    if (feedbackIntervalRef.current) {
      clearInterval(feedbackIntervalRef.current);
      feedbackIntervalRef.current = null;
    }
    
    window.speechSynthesis?.cancel();
  };

  const resetSession = async () => {
    setAiFeedback({
      reps: 0,
      stage: null,
      feedback: [],
      symmetry: 0,
      angle: 0
    });
    lastRepCountRef.current = 0;
    lastFeedbackRef.current = "";

    try {
      await fetch(`http://localhost:5000/reset_count?exercise=${selectedExercise}`);
    } catch (error) {
      console.error("Error resetting count:", error);
    }
  };

  const startFeedbackPolling = () => {
    if (feedbackIntervalRef.current) {
      clearInterval(feedbackIntervalRef.current);
    }

    // Fetch immediately
    fetchAIFeedback();

    // Poll every 500ms
    feedbackIntervalRef.current = setInterval(async () => {
      if (!isSessionActive) {
        clearInterval(feedbackIntervalRef.current);
        return;
      }
      await fetchAIFeedback();
    }, 500);
  };

  const getStageColor = (stage) => {
    switch (stage) {
      case 'up': return 'text-green-500';
      case 'down': return 'text-blue-500';
      default: return 'text-gray-500';
    }
  };

  const getStageText = (stage) => {
    switch (stage) {
      case 'up': return 'Up';
      case 'down': return 'Down';
      default: return 'Ready';
    }
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
          <h1 className="text-2xl font-bold">AI Exercise Correction</h1>
          <p className="text-sm text-slate-500">
            Real-time form analysis and feedback using MediaPipe
          </p>
          <div className={`text-xs mt-1 ${backendStatus === 'connected' ? 'text-green-600' : 'text-red-600'}`}>
            Backend: {backendStatus === 'connected' ? 'Connected' : 'Disconnected'}
          </div>
        </div>
        
        {/* Voice Toggle */}
        {isSessionActive && (
          <button
            onClick={toggleVoiceFeedback}
            className={`ml-auto p-3 rounded-full transition-all ${
              voiceEnabled 
                ? 'bg-green-500 text-white shadow-lg' 
                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            }`}
            title={voiceEnabled ? "Disable voice feedback" : "Enable voice feedback"}
          >
            {voiceEnabled ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
          </button>
        )}
      </div>

      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Left Column */}
          <div className="xl:col-span-1 space-y-6">
            {/* Exercise Selection */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Select Exercise</h3>
              <div className="space-y-3">
                {exercises.map((exercise) => (
                  <button
                    key={exercise}
                    onClick={() => setSelectedExercise(exercise)}
                    className={`w-full p-4 rounded-lg border text-left transition-all ${
                      selectedExercise === exercise
                        ? "border-teal-500 bg-teal-50 text-teal-700 shadow-md"
                        : "border-slate-200 hover:border-teal-300 hover:shadow-sm"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{exerciseDisplayNames[exercise]}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          {exerciseDescriptions[exercise]}
                        </p>
                      </div>
                      {selectedExercise === exercise && (
                        <CheckCircle className="w-5 h-5 text-teal-500 flex-shrink-0" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Session Controls */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Session Controls</h3>
              
              {selectedExercise && (
                <div className="mb-4 p-4 rounded-lg bg-teal-50 border border-teal-200">
                  <p className="text-sm font-medium text-teal-700 mb-1">
                    Selected: {exerciseDisplayNames[selectedExercise]}
                  </p>
                  <p className="text-xs text-teal-600">
                    {exerciseDescriptions[selectedExercise]}
                  </p>
                </div>
              )}

              <div className="space-y-3">
                {!isSessionActive ? (
                  <button
                    onClick={startExerciseSession}
                    disabled={!selectedExercise || isLoading}
                    className={`w-full py-3 rounded-lg font-semibold shadow-lg transition-all flex items-center justify-center gap-2 ${
                      selectedExercise && !isLoading
                        ? "bg-gradient-to-r from-teal-500 to-cyan-400 text-white hover:shadow-xl hover:scale-105"
                        : "bg-slate-200 text-slate-500 cursor-not-allowed"
                    }`}
                  >
                    {isLoading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Starting Camera...
                      </>
                    ) : (
                      <>
                        <Play className="w-5 h-5" />
                        Start AI Workout Session
                      </>
                    )}
                  </button>
                ) : (
                  <div className="space-y-2">
                    <button
                      onClick={stopExerciseSession}
                      className="w-full py-3 rounded-lg bg-red-500 text-white font-semibold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                    >
                      <Square className="w-5 h-5" />
                      Stop Session
                    </button>
                    <button
                      onClick={resetSession}
                      className="w-full py-2 rounded-lg bg-slate-200 text-slate-700 font-medium hover:bg-slate-300 transition-all flex items-center justify-center gap-2"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Reset Count
                    </button>
                  </div>
                )}
              </div>

              {cameraError && (
                <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-red-700">{cameraError}</p>
                  </div>
                </div>
              )}

              {/* Voice Status */}
              {isSessionActive && (
                <div className={`mt-4 p-3 rounded-lg border ${
                  voiceEnabled ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className="flex items-center gap-2">
                    {voiceEnabled ? (
                      <Volume2 className="w-4 h-4 text-green-600" />
                    ) : (
                      <VolumeX className="w-4 h-4 text-gray-600" />
                    )}
                    <p className={`text-sm ${voiceEnabled ? 'text-green-700' : 'text-gray-700'}`}>
                      Voice: {voiceEnabled ? 'ON' : 'OFF'}
                    </p>
                  </div>
                  {lastSpoken && (
                    <p className="text-xs text-gray-600 mt-1 truncate" title={lastSpoken}>
                      Last: {lastSpoken}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Stats Panel */}
            {isSessionActive && (
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold mb-4">Live Stats</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 rounded-lg bg-blue-50">
                    <p className="text-2xl font-bold text-blue-600">{aiFeedback.reps}</p>
                    <p className="text-xs text-blue-500">REPS</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-green-50">
                    <p className={`text-lg font-bold ${getStageColor(aiFeedback.stage)}`}>
                      {getStageText(aiFeedback.stage)}
                    </p>
                    <p className="text-xs text-green-500">STAGE</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-purple-50">
                    <p className="text-lg font-bold text-purple-600">
                      {typeof aiFeedback.angle === 'number' ? aiFeedback.angle.toFixed(0) : '0'}°
                    </p>
                    <p className="text-xs text-purple-500">ANGLE</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-orange-50">
                    <p className="text-lg font-bold text-orange-600">
                      {typeof aiFeedback.symmetry === 'number' ? aiFeedback.symmetry.toFixed(1) : '0.0'}°
                    </p>
                    <p className="text-xs text-orange-500">SYMMETRY</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column */}
          <div className="xl:col-span-3 space-y-6">
            {/* Camera Section */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-teal-50">
                  <Camera className="w-6 h-6 text-teal-500" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Live Camera Feed</h2>
                  <p className="text-sm text-slate-500">
                    {isSessionActive 
                      ? `AI analyzing ${exerciseDisplayNames[selectedExercise]} form in real-time` 
                      : "Camera feed will start when session begins"}
                  </p>
                </div>
              </div>

              <div className="relative">
                {/* Local Camera Feed */}
                <div className="aspect-video bg-slate-900 rounded-xl overflow-hidden mb-4">
                  {isSessionActive ? (
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-800">
                      <div className="text-center text-slate-400">
                        <Video className="w-12 h-12 mx-auto mb-3" />
                        <p>Camera feed will appear here</p>
                        <p className="text-sm mt-1">Click "Start AI Workout Session" to begin</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* AI Processed Feed */}
                {isSessionActive && (
                  <div>
                    <div className="text-sm text-slate-500 mb-2 flex items-center gap-2">
                      <Camera className="w-4 h-4" />
                      AI Processed Feed (with Pose Detection):
                    </div>
                    <img 
                      src={`http://localhost:5000/video_feed?exercise=${selectedExercise}`}
                      alt="AI Processed Feed"
                      className="w-full aspect-video rounded-lg border-2 border-teal-300 object-cover"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* AI Feedback Panel */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-blue-50">
                  <AlertCircle className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">AI Form Feedback</h2>
                  <p className="text-sm text-slate-500">
                    Real-time corrections and suggestions
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Feedback Messages */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-slate-700">Form Corrections</h3>
                  {aiFeedback.feedback && aiFeedback.feedback.length > 0 ? (
                    <div className="space-y-2">
                      {aiFeedback.feedback.map((msg, index) => (
                        <div
                          key={index}
                          className={`p-3 rounded-lg border flex items-start gap-3 ${
                            msg.includes('💪') || msg.includes('🔥') || msg.includes('🎯') || msg.includes('👍')
                              ? 'bg-green-50 border-green-200'
                              : 'bg-yellow-50 border-yellow-200'
                          }`}
                        >
                          {msg.includes('💪') || msg.includes('🔥') || msg.includes('🎯') || msg.includes('👍') ? (
                            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                          )}
                          <p className={`text-sm ${
                            msg.includes('💪') || msg.includes('🔥') || msg.includes('🎯') || msg.includes('👍')
                              ? 'text-green-700'
                              : 'text-yellow-700'
                          }`}>
                            {msg}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 rounded-lg bg-green-50 border border-green-200 text-center">
                      <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                      <p className="text-sm text-green-700">Good form! Keep it up!</p>
                    </div>
                  )}
                </div>

                {/* Exercise Tips */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-slate-700">Exercise Tips</h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-teal-50">
                      <div className="w-6 h-6 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-teal-600 text-xs font-bold">1</span>
                      </div>
                      <p className="text-sm text-teal-700">
                        <strong>Full Range:</strong> Complete each movement fully
                      </p>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-teal-50">
                      <div className="w-6 h-6 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-teal-600 text-xs font-bold">2</span>
                      </div>
                      <p className="text-sm text-teal-700">
                        <strong>Control:</strong> Move slowly and deliberately
                      </p>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-teal-50">
                      <div className="w-6 h-6 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-teal-600 text-xs font-bold">3</span>
                      </div>
                      <p className="text-sm text-teal-700">
                        <strong>Breathing:</strong> Exhale on exertion, inhale on release
                      </p>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-teal-50">
                      <div className="w-6 h-6 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-teal-600 text-xs font-bold">4</span>
                      </div>
                      <p className="text-sm text-teal-700">
                        <strong>Voice:</strong> Enable voice for hands-free feedback
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}