import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAIkC9pqJFCE0FPVJBeQqyMkM2MjB7xXOI",
  authDomain: "koppo-ai.firebaseapp.com",
  projectId: "koppo-ai",
  storageBucket: "koppo-ai.firebasestorage.app",
  messagingSenderId: "163810851712",
  appId: "1:163810851712:web:eebdc1db4305d345eb1f65",
  measurementId: "G-JY2Y637FHF",
  databaseURL: "https://koppo-ai-default-rtdb.firebaseio.com"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);

// Export the app instance
export default app;
