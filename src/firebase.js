import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBrYzj1ZfdympVERMkjpS33WCGJCnN97aE",
  authDomain: "ai-wellness-caoach.firebaseapp.com",
  projectId: "ai-wellness-caoach",
  storageBucket: "ai-wellness-caoach.appspot.com",
  messagingSenderId: "1005230870802",
  appId: "1:1005230870802:web:6ecf0496e26ad49f1323cb",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
