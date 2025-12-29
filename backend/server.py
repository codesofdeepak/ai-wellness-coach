from flask import Flask, Response, jsonify, request
from flask_cors import CORS
import cv2
import mediapipe as mp
import numpy as np
import collections
import time
import threading

# -------------------- Flask Setup --------------------
app = Flask(__name__)
CORS(app)  # allow frontend to fetch video stream

# -------------------- Mediapipe setup --------------------
mp_drawing = mp.solutions.drawing_utils
mp_pose = mp.solutions.pose

# -------------------- Rep counting state --------------------
class RepState:
    def __init__(self, up_thresh, down_thresh, min_rep_interval=1.0):
        self.up_thresh = up_thresh
        self.down_thresh = down_thresh
        self.stage = "down"  # Start in down position
        self.count = 0
        self.last_rep_time = 0.0
        self.min_rep_interval = min_rep_interval
        self.rep_in_progress = False

    def update(self, angle):
        now = time.time()
        counted = False
        
        # Debug print
        print(f"Angle: {angle:.1f}°, Stage: {self.stage}, Count: {self.count}")
        
        # Check for transitions
        if self.stage == "down" and angle < self.down_thresh:
            # Still in down position
            pass
        elif self.stage == "down" and angle > self.up_thresh:
            # Moved to up position - count a rep
            if now - self.last_rep_time > self.min_rep_interval:
                self.count += 1
                self.last_rep_time = now
                counted = True
                print(f"REP COUNTED! Total: {self.count}")
            self.stage = "up"
        elif self.stage == "up" and angle < self.down_thresh:
            # Moved back to down position
            self.stage = "down"
        
        return counted

# -------------------- Helper functions --------------------
def angle_between(a, b, c):
    a, b, c = np.array(a), np.array(b), np.array(c)
    ba, bc = a - b, c - b
    cosang = np.dot(ba, bc) / ((np.linalg.norm(ba) * np.linalg.norm(bc)) + 1e-8)
    return np.degrees(np.arccos(np.clip(cosang, -1.0, 1.0)))

def get_lm(landmarks, lm):
    return (landmarks[lm].x, landmarks[lm].y)

# -------------------- Exercise Monitor --------------------
class ExerciseMonitor:
    def __init__(self):
        self.states = {
            'bicep': RepState(160, 60, 1.0),      # More lenient thresholds
            'pushup': RepState(160, 100, 1.2),    # Adjusted for pushup angles
            'squat': RepState(170, 90, 1.5),      # Squat has wider range
            'lunge': RepState(170, 80, 1.3),      # Lunge angles
            'shoulder': RepState(160, 80, 1.0),   # Shoulder press
        }
        self.angle_buffers = {k: collections.deque(maxlen=3) for k in self.states}  # Smaller buffer for faster response
        self.current_data = {
            'reps': 0,
            'stage': None,
            'feedback': [],
            'symmetry': 0,
            'angle': 0
        }
        self.last_count = 0  # Track last count to detect changes

    def analyze(self, name, lm):
        if name not in self.states:
            return None
            
        fn = getattr(self, f"analyze_{name}", None)
        if fn:
            angle, feedback, counted, reps, stage, symmetry = fn(lm)
            
            # Check if rep count changed
            if reps > self.last_count:
                counted = True
                self.last_count = reps
                print(f"REP DETECTED! New count: {reps}")
            elif reps < self.last_count:
                self.last_count = reps
            
            # Add rep completion feedback
            if counted and reps > 0:
                feedback.append(f"Rep {reps} completed! 💪")
            
            self.current_data = {
                'reps': reps,
                'stage': stage,
                'feedback': feedback,
                'symmetry': symmetry,
                'angle': angle
            }
            return self.current_data
        return None

    # --- BICEP CURLS ---
    def analyze_bicep(self, lm):
        try:
            # Get landmarks for both arms
            lsh = get_lm(lm, mp_pose.PoseLandmark.LEFT_SHOULDER)
            lel = get_lm(lm, mp_pose.PoseLandmark.LEFT_ELBOW)
            lwr = get_lm(lm, mp_pose.PoseLandmark.LEFT_WRIST)
            
            rsh = get_lm(lm, mp_pose.PoseLandmark.RIGHT_SHOULDER)
            rel = get_lm(lm, mp_pose.PoseLandmark.RIGHT_ELBOW)
            rwr = get_lm(lm, mp_pose.PoseLandmark.RIGHT_WRIST)
            
            # Calculate angles
            left_angle = angle_between(lsh, lel, lwr)
            right_angle = angle_between(rsh, rel, rwr)
            
            # Use the smaller angle (more curled arm) for rep counting
            current_angle = min(left_angle, right_angle)
            
            # Apply smoothing
            self.angle_buffers['bicep'].append(current_angle)
            smoothed_angle = sum(self.angle_buffers['bicep']) / len(self.angle_buffers['bicep'])
            
            # Update rep counter
            counted = self.states['bicep'].update(smoothed_angle)
            
            feedback = []
            symmetry_diff = abs(left_angle - right_angle)
            
            # Form feedback
            if smoothed_angle > 150:
                feedback.append("Extend arms fully")
            elif smoothed_angle < 60:
                feedback.append("Good contraction!")
            
            if symmetry_diff > 25:
                feedback.append("Keep arms symmetrical")
                
            if self.states['bicep'].stage == "up" and smoothed_angle < 140:
                feedback.append("Lift higher")
            elif self.states['bicep'].stage == "down" and smoothed_angle > 80:
                feedback.append("Lower completely")
                
            return smoothed_angle, feedback, counted, self.states['bicep'].count, self.states['bicep'].stage, symmetry_diff
            
        except Exception as e:
            print(f"Bicep analysis error: {e}")
            return 0, ["Adjust position"], False, self.states['bicep'].count, "ready", 0

    # --- PUSH-UPS ---
    def analyze_pushup(self, lm):
        try:
            lsh, lel, lwr = get_lm(lm, mp_pose.PoseLandmark.LEFT_SHOULDER), get_lm(lm, mp_pose.PoseLandmark.LEFT_ELBOW), get_lm(lm, mp_pose.PoseLandmark.LEFT_WRIST)
            rsh, rel, rwr = get_lm(lm, mp_pose.PoseLandmark.RIGHT_SHOULDER), get_lm(lm, mp_pose.PoseLandmark.RIGHT_ELBOW), get_lm(lm, mp_pose.PoseLandmark.RIGHT_WRIST)
            
            left_angle = angle_between(lsh, lel, lwr)
            right_angle = angle_between(rsh, rel, rwr)
            current_angle = (left_angle + right_angle) / 2
            
            self.angle_buffers['pushup'].append(current_angle)
            smoothed_angle = sum(self.angle_buffers['pushup']) / len(self.angle_buffers['pushup'])
            
            counted = self.states['pushup'].update(smoothed_angle)
            
            feedback = []
            symmetry_diff = abs(left_angle - right_angle)
            
            if smoothed_angle > 150:
                feedback.append("Arms straight")
            elif smoothed_angle < 100:
                feedback.append("Good depth!")
                
            if symmetry_diff > 20:
                feedback.append("Balance both sides")
                
            return smoothed_angle, feedback, counted, self.states['pushup'].count, self.states['pushup'].stage, symmetry_diff
            
        except Exception as e:
            print(f"Pushup analysis error: {e}")
            return 0, ["Adjust position"], False, self.states['pushup'].count, "ready", 0

    # --- SQUATS ---
    def analyze_squat(self, lm):
        try:
            lhip, lk, la = get_lm(lm, mp_pose.PoseLandmark.LEFT_HIP), get_lm(lm, mp_pose.PoseLandmark.LEFT_KNEE), get_lm(lm, mp_pose.PoseLandmark.LEFT_ANKLE)
            rhip, rk, ra = get_lm(lm, mp_pose.PoseLandmark.RIGHT_HIP), get_lm(lm, mp_pose.PoseLandmark.RIGHT_KNEE), get_lm(lm, mp_pose.PoseLandmark.RIGHT_ANKLE)
            
            left_angle = angle_between(lhip, lk, la)
            right_angle = angle_between(rhip, rk, ra)
            current_angle = (left_angle + right_angle) / 2
            
            self.angle_buffers['squat'].append(current_angle)
            smoothed_angle = sum(self.angle_buffers['squat']) / len(self.angle_buffers['squat'])
            
            counted = self.states['squat'].update(smoothed_angle)
            
            feedback = []
            symmetry_diff = abs(left_angle - right_angle)
            
            if smoothed_angle > 160:
                feedback.append("Stand tall")
            elif smoothed_angle < 90:
                feedback.append("Excellent depth! 🔥")
                
            if symmetry_diff > 15:
                feedback.append("Even weight distribution")
                
            return smoothed_angle, feedback, counted, self.states['squat'].count, self.states['squat'].stage, symmetry_diff
            
        except Exception as e:
            print(f"Squat analysis error: {e}")
            return 0, ["Adjust position"], False, self.states['squat'].count, "ready", 0

    # --- LUNGES ---
    def analyze_lunge(self, lm):
        try:
            lhip, lk, la = get_lm(lm, mp_pose.PoseLandmark.LEFT_HIP), get_lm(lm, mp_pose.PoseLandmark.LEFT_KNEE), get_lm(lm, mp_pose.PoseLandmark.LEFT_ANKLE)
            rhip, rk, ra = get_lm(lm, mp_pose.PoseLandmark.RIGHT_HIP), get_lm(lm, mp_pose.PoseLandmark.RIGHT_KNEE), get_lm(lm, mp_pose.PoseLandmark.RIGHT_ANKLE)
            
            left_angle = angle_between(lhip, lk, la)
            right_angle = angle_between(rhip, rk, ra)
            current_angle = min(left_angle, right_angle)  # Use the more bent knee
            
            self.angle_buffers['lunge'].append(current_angle)
            smoothed_angle = sum(self.angle_buffers['lunge']) / len(self.angle_buffers['lunge'])
            
            counted = self.states['lunge'].update(smoothed_angle)
            
            feedback = []
            symmetry_diff = abs(left_angle - right_angle)
            
            if smoothed_angle < 80:
                feedback.append("Perfect lunge! 🎯")
            elif smoothed_angle < 110:
                feedback.append("Good form")
                
            if symmetry_diff > 25:
                feedback.append("Alternate legs evenly")
                
            return smoothed_angle, feedback, counted, self.states['lunge'].count, self.states['lunge'].stage, symmetry_diff
            
        except Exception as e:
            print(f"Lunge analysis error: {e}")
            return 0, ["Adjust position"], False, self.states['lunge'].count, "ready", 0

    # --- SHOULDER PRESS ---
    def analyze_shoulder(self, lm):
        try:
            lsh, lel, lwr = get_lm(lm, mp_pose.PoseLandmark.LEFT_SHOULDER), get_lm(lm, mp_pose.PoseLandmark.LEFT_ELBOW), get_lm(lm, mp_pose.PoseLandmark.LEFT_WRIST)
            rsh, rel, rwr = get_lm(lm, mp_pose.PoseLandmark.RIGHT_SHOULDER), get_lm(lm, mp_pose.PoseLandmark.RIGHT_ELBOW), get_lm(lm, mp_pose.PoseLandmark.RIGHT_WRIST)
            
            # Vertical movement angles
            left_angle = angle_between(lel, lsh, (lsh[0], lsh[1] - 0.3))
            right_angle = angle_between(rel, rsh, (rsh[0], rsh[1] - 0.3))
            current_angle = (left_angle + right_angle) / 2
            
            self.angle_buffers['shoulder'].append(current_angle)
            smoothed_angle = sum(self.angle_buffers['shoulder']) / len(self.angle_buffers['shoulder'])
            
            counted = self.states['shoulder'].update(smoothed_angle)
            
            feedback = []
            symmetry_diff = abs(left_angle - right_angle)
            
            if smoothed_angle > 150:
                feedback.append("Arms fully extended! 👍")
            elif smoothed_angle < 80:
                feedback.append("Good press form")
                
            if symmetry_diff > 20:
                feedback.append("Press evenly")
                
            return smoothed_angle, feedback, counted, self.states['shoulder'].count, self.states['shoulder'].stage, symmetry_diff
            
        except Exception as e:
            print(f"Shoulder analysis error: {e}")
            return 0, ["Adjust position"], False, self.states['shoulder'].count, "ready", 0

monitor = ExerciseMonitor()
current_exercise = "bicep"

# -------------------- Flask Routes --------------------
@app.route("/video_feed")
def video_feed():
    global current_exercise
    exercise = request.args.get("exercise", "bicep")
    current_exercise = exercise
    return Response(gen_frames(exercise), mimetype="multipart/x-mixed-replace; boundary=frame")

def gen_frames(exercise):
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("Error: Could not open webcam")
        return

    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
    
    with mp_pose.Pose(min_detection_confidence=0.7, min_tracking_confidence=0.7) as pose:
        while True:
            success, frame = cap.read()
            if not success:
                break
            
            frame = cv2.flip(frame, 1)
            image = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            image.flags.writeable = False
            results = pose.process(image)
            image.flags.writeable = True
            image = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)

            if results.pose_landmarks:
                lm = results.pose_landmarks.landmark
                data = monitor.analyze(exercise, lm)
                
                if data:
                    mp_drawing.draw_landmarks(image, results.pose_landmarks, mp_pose.POSE_CONNECTIONS)
                    
                    # Display info
                    cv2.putText(image, f"{exercise.upper()} REPS: {data['reps']}", (20, 40),
                                cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
                    cv2.putText(image, f"Stage: {data['stage']}", (20, 80),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 0), 2)
                    cv2.putText(image, f"Angle: {data['angle']:.1f}°", (20, 110),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 0), 2)
                    
                    # Display feedback
                    y = 150
                    for msg in data['feedback'][:3]:
                        cv2.putText(image, msg, (20, y), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 0), 2)
                        y += 30

            ret, buffer = cv2.imencode(".jpg", image)
            if not ret:
                break
            yield (b"--frame\r\nContent-Type: image/jpeg\r\n\r\n" + buffer.tobytes() + b"\r\n")

    cap.release()

@app.route("/exercise_data")
def exercise_data():
    return jsonify(monitor.current_data)

@app.route("/status")
def status():
    return jsonify({
        "status": "Server running",
        "exercises": list(monitor.states.keys()),
        "current_exercise": current_exercise
    })

@app.route("/reset_count")
def reset_count():
    exercise = request.args.get("exercise", "bicep")
    if exercise in monitor.states:
        monitor.states[exercise].count = 0
        monitor.states[exercise].stage = "down"
        monitor.current_data['reps'] = 0
        monitor.current_data['stage'] = "down"
        monitor.last_count = 0
    return jsonify({"status": "Count reset", "exercise": exercise})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)