import React, { createContext, useContext, useEffect, useState } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyCi_syoMD2Co6AqaRCS2kIjV_t2sfVqWJw",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "finance-a88e4.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "finance-a88e4",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "finance-a88e4.firebasestorage.app",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "982874806548",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:982874806548:web:aa25e7a3a3bb7dded5ca01",
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || "G-TDGVVHBS0S"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Configure Google Auth Provider
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

const AuthContext = createContext(null);

// Helper function to get user-friendly error messages
const getAuthErrorMessage = (error) => {
  switch (error.code) {
    case 'auth/user-not-found':
      return 'Пользователь не найден';
    case 'auth/wrong-password':
      return 'Неверный пароль';
    case 'auth/email-already-in-use':
      return 'Этот email уже используется';
    case 'auth/weak-password':
      return 'Пароль слишком слабый';
    case 'auth/invalid-email':
      return 'Неверный формат email';
    case 'auth/popup-closed-by-user':
      return 'Окно авторизации было закрыто';
    case 'auth/popup-blocked':
      return 'Всплывающие окна заблокированы браузером';
    case 'auth/cancelled-popup-request':
      return 'Запрос авторизации отменен';
    case 'auth/unauthorized-domain':
      return 'Домен не авторизован для OAuth операций';
    case 'auth/operation-not-allowed':
      return 'Данный способ авторизации отключен';
    case 'auth/network-request-failed':
      return 'Ошибка сети. Проверьте подключение к интернету';
    case 'auth/too-many-requests':
      return 'Слишком много попыток. Попробуйте позже';
    default:
      return error.message || 'Произошла ошибка авторизации';
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(() => {
    // Инициализация темной темы из localStorage
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Применение темной темы к document.documentElement
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  const login = async (email, password) => {
    try {
      return await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error('Login error:', error);
      throw new Error(getAuthErrorMessage(error));
    }
  };

  const register = async (email, password) => {
    try {
      return await createUserWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error('Registration error:', error);
      throw new Error(getAuthErrorMessage(error));
    }
  };

  const loginWithGoogle = async () => {
    try {
      return await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Google login error:', error);
      throw new Error(getAuthErrorMessage(error));
    }
  };

  const logout = () => signOut(auth);
  const toggleDarkMode = () => setDarkMode(prev => !prev);

  const value = { 
    user, 
    login, 
    register, 
    loginWithGoogle, 
    logout, 
    loading, 
    auth,
    darkMode,
    toggleDarkMode 
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
