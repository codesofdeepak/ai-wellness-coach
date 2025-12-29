import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "your api key",
  authDomain: "ai-wellness-caoach.firebaseapp.com",
  projectId: "ai-wellness-caoach",
  storageBucket: "ai-wellness-caoach.appspot.com",
  messagingSenderId: " ",
  appId: " ",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
