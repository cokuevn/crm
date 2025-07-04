import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged 
} from 'firebase/auth';

// Firebase configuration - make it optional
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || import.meta.env.VITE_FIREBASE_API_KEY || 'demo-key',
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'demo-app.firebaseapp.com',
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || import.meta.env.VITE_FIREBASE_PROJECT_ID || 'demo-app',
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'demo-app.appspot.com',
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '123456789',
  appId: process.env.REACT_APP_FIREBASE_APP_ID || import.meta.env.VITE_FIREBASE_APP_ID || 'demo-app-id'
};

// Initialize Firebase with error handling
let app = null;
let auth = null;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
} catch (error) {
  console.warn('Firebase initialization failed, using demo mode:', error.message);
  auth = null;
}

// Auth context
const AuthContext = createContext();

// Auth reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_USER':
      return { ...state, user: action.payload, loading: false };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    case 'LOGOUT':
      return { ...state, user: null, loading: false };
    default:
      return state;
  }
};

// Initial state
const initialState = {
  user: null,
  loading: true,
  error: null
};

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Listen for auth state changes
  useEffect(() => {
    if (!auth) {
      // Demo mode - auto-login with demo user
      const demoUser = {
        uid: 'demo-user-uid',
        email: 'demo@test.com',
        displayName: 'Demo User'
      };
      localStorage.setItem('user', JSON.stringify(demoUser));
      dispatch({ type: 'SET_USER', payload: demoUser });
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        const userData = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName
        };
        localStorage.setItem('user', JSON.stringify(userData));
        dispatch({ type: 'SET_USER', payload: userData });
      } else {
        localStorage.removeItem('user');
        dispatch({ type: 'SET_USER', payload: null });
      }
    });

    return () => unsubscribe();
  }, []);

  // Auth methods
  const login = async (email, password) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userData = {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        displayName: userCredential.user.displayName
      };
      
      localStorage.setItem('user', JSON.stringify(userData));
      dispatch({ type: 'SET_USER', payload: userData });
      return userData;
    } catch (error) {
      console.error('Login error:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  };

  const register = async (email, password) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });
      
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const userData = {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        displayName: userCredential.user.displayName
      };
      
      localStorage.setItem('user', JSON.stringify(userData));
      dispatch({ type: 'SET_USER', payload: userData });
      return userData;
    } catch (error) {
      console.error('Register error:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('user');
      dispatch({ type: 'LOGOUT' });
    } catch (error) {
      console.error('Logout error:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  };

  // Get auth headers for API calls
  const getAuthHeaders = () => {
    return state.user?.uid ? { authorization: `Bearer ${state.user.uid}` } : {};
  };

  const value = {
    ...state,
    login,
    register,
    logout,
    getAuthHeaders,
    clearError: () => dispatch({ type: 'CLEAR_ERROR' })
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};