import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { getFirestore, collection, addDoc, query, where, orderBy, getDocs } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDX5xJmgmM0jvjKDF7ey_Kjt9er2iHQwLE",
  authDomain: "assist-b02e5.firebaseapp.com",
  projectId: "assist-b02e5",
  storageBucket: "assist-b02e5.firebasestorage.app",
  messagingSenderId: "391726588628",
  appId: "1:391726588628:web:db712d98c30848c5591141"
};

// Debug log to check if config is loaded
console.log('Firebase Config:', {
  apiKey: firebaseConfig.apiKey ? 'Present' : 'Missing',
  authDomain: firebaseConfig.authDomain ? 'Present' : 'Missing',
  projectId: firebaseConfig.projectId ? 'Present' : 'Missing',
  storageBucket: firebaseConfig.storageBucket ? 'Present' : 'Missing',
  messagingSenderId: firebaseConfig.messagingSenderId ? 'Present' : 'Missing',
  appId: firebaseConfig.appId ? 'Present' : 'Missing'
});

let app;
let auth;
let db;

try {
  console.log('Initializing Firebase...');
  if (getApps().length === 0) {
    console.log('No existing Firebase apps found, creating new app');
    app = initializeApp(firebaseConfig);
  } else {
    console.log('Using existing Firebase app');
    app = getApp();
  }
  
  console.log('Getting Auth instance...');
  auth = getAuth(app);
  
  console.log('Getting Firestore instance...');
  db = getFirestore(app);
  
  console.log('Firebase initialization successful');
} catch (error) {
  console.error('Firebase initialization error:', error);
  console.error('Error details:', {
    code: error.code,
    message: error.message,
    stack: error.stack
  });
  throw error;
}

// Authentication methods
export async function signInWithGoogle() {
  console.log('Attempting Google sign in...');
  const provider = new GoogleAuthProvider();
  
  // Add these scopes for Chrome extension
  provider.addScope('https://www.googleapis.com/auth/userinfo.email');
  provider.addScope('https://www.googleapis.com/auth/userinfo.profile');
  
  try {
    const result = await signInWithPopup(auth, provider);
    console.log('Google sign in successful:', result.user.email);
    return result.user;
  } catch (error) {
    console.error('Login failed:', error);
    console.error('Login error details:', {
      code: error.code,
      message: error.message,
      stack: error.stack
    });
    throw error;
  }
}

export async function getUserProfile() {
  console.log('Getting user profile...');
  const user = auth.currentUser;
  console.log('Current user:', user ? user.email : 'No user');
  return user;
}

export async function signOutUser() {
  console.log('Attempting sign out...');
  try {
    await signOut(auth);
    console.log('Sign out successful');
  } catch (error) {
    console.error('Sign-out failed:', error);
    throw error;
  }
}

// Firestore methods
export async function storeHistory(prompt, response) {
  const user = auth.currentUser;
  if (!user) {
    console.log('No user logged in, cannot store history');
    return;
  }

  console.log('Storing history for user:', user.email);
  try {
    const docRef = await addDoc(collection(db, 'history'), {
      userId: user.uid,
      prompt,
      response,
      timestamp: new Date()
    });
    console.log('History stored successfully, doc ID:', docRef.id);
  } catch (error) {
    console.error('Error storing history:', error);
    console.error('Store history error details:', {
      code: error.code,
      message: error.message,
      stack: error.stack
    });
    throw error;
  }
}

export async function fetchUserHistory() {
  const user = auth.currentUser;
  if (!user) {
    console.log('No user logged in, cannot fetch history');
    return [];
  }

  console.log('Fetching history for user:', user.email);
  try {
    const q = query(
      collection(db, 'history'),
      where('userId', '==', user.uid),
      orderBy('timestamp', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    console.log('History fetched successfully, count:', querySnapshot.size);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching history:', error);
    console.error('Fetch history error details:', {
      code: error.code,
      message: error.message,
      stack: error.stack
    });
    return [];
  }
}

// Export the Firestore instance
export { db }; 