import React, { useState } from "react";
import {
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  Chrome,
} from "lucide-react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { auth } from "./firebase";

export default function Auth({ onLoginSuccess }) {
  const [login, setLogin] = useState(true);
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const [data, setData] = useState({
    email: "",
    password: "",
  });

  const notify = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  };

  const errorMap = (code) => {
    switch (code) {
      case "auth/user-not-found":
        return "User does not exist";
      case "auth/wrong-password":
        return "Wrong password";
      case "auth/email-already-in-use":
        return "Email already in use";
      case "auth/weak-password":
        return "Password must be 6+ characters";
      default:
        return "Authentication failed";
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      login
        ? await signInWithEmailAndPassword(auth, data.email, data.password)
        : await createUserWithEmailAndPassword(
            auth,
            data.email,
            data.password
          );
      notify("Login successful 🎉");
      setTimeout(onLoginSuccess, 800);
    } catch (e) {
      setError(errorMap(e.code));
    } finally {
      setLoading(false);
    }
  };

  const googleLogin = async () => {
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
      notify("Logged in with Google 🎉");
      setTimeout(onLoginSuccess, 800);
    } catch {
      setError("Google login failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 to-cyan-50 px-4">
      {toast && (
        <div className="fixed top-6 bg-teal-500 text-white px-6 py-3 rounded-lg shadow">
          {toast}
        </div>
      )}

      <div className="bg-white w-full max-w-md p-8 rounded-2xl shadow-xl">
        <div className="text-center mb-6">
          <div className="mx-auto w-14 h-14 bg-teal-500 rounded-full flex items-center justify-center">
            <Lock className="text-white" />
          </div>
          <h2 className="text-2xl font-bold mt-3">AI Wellness Coach</h2>
        </div>

        {error && (
          <div className="flex gap-2 items-center bg-red-50 text-red-600 p-3 rounded mb-4">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        <form onSubmit={submit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            onChange={(e) =>
              setData({ ...data, email: e.target.value })
            }
            className="w-full border p-2 rounded"
            required
          />

          <div className="relative">
            <input
              type={show ? "text" : "password"}
              placeholder="Password"
              onChange={(e) =>
                setData({ ...data, password: e.target.value })
              }
              className="w-full border p-2 rounded pr-10"
              required
            />
            <button
              type="button"
              onClick={() => setShow(!show)}
              className="absolute right-3 top-2.5 text-gray-400"
            >
              {show ? <EyeOff /> : <Eye />}
            </button>
          </div>

          <button
            disabled={loading}
            className="w-full bg-teal-500 text-white py-2 rounded flex justify-center gap-2"
          >
            {loading && <Loader2 className="animate-spin" />}
            {login ? "Log In" : "Sign Up"}
          </button>
        </form>

        <button
          onClick={googleLogin}
          className="w-full mt-4 border py-2 rounded flex justify-center gap-2"
        >
          <Chrome />
          Continue with Google
        </button>

        <p className="text-center mt-4 text-sm">
          {login ? (
            <>
              No account?{" "}
              <button
                onClick={() => setLogin(false)}
                className="text-teal-600"
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Have an account?{" "}
              <button
                onClick={() => setLogin(true)}
                className="text-teal-600"
              >
                Log in
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
