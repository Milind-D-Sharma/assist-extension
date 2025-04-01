// Firebase Configuration
// Replace these values with your Firebase project configuration
// Get these from Firebase Console > Project Settings > General > Your apps > Web app
export const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "AIzaSyDX5xJmgmM0jvjKDF7ey_Kjt9er2iHQwLE",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "assist-b02e5.firebaseapp.com",
  projectId: process.env.FIREBASE_PROJECT_ID || "assist-b02e5",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "assist-b02e5.firebasestorage.app",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "391726588628",
  appId: process.env.FIREBASE_APP_ID || "1:391726588628:web:db712d98c30848c5591141",
  measurementId: process.env.FIREBASE_MEASUREMENT_ID || "G-GGL76PDB01"
};

// Initialize Firebase
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export { app, analytics };

// OpenAI Configuration
export const openaiConfig = {
  apiKey: process.env.OPENAI_API_KEY,
  defaultModel: "gpt-4",
  maxTokens: 1000,
  temperature: 0.7,
  presencePenalty: 0.6,
  frequencyPenalty: 0.5
};

// Extension Configuration
export const extensionConfig = {
  name: "Assist Extension",
  version: "1.0.0",
  defaultSettings: {
    theme: "light",
    model: "gpt-4",
    voiceEnabled: true
  }
}; 