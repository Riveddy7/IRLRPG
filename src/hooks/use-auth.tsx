
"use client";

import type { User as FirebaseUser } from 'firebase/auth';
import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { auth, db } from '@/lib/firebase';
import { 
  onAuthStateChanged, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  UserCredential
} from 'firebase/auth';
import { doc, setDoc, Timestamp, getDoc } from 'firebase/firestore';
import type { Player } from '@/types'; 
import { useToast } from './use-toast';
import { useRouter } from 'next/navigation';
import { defaultAvatarKey } from '@/config/avatar-config'; // Import default avatar key

interface AuthContextType {
  user: FirebaseUser | null;
  isLoading: boolean;
  error: string | null;
  registerUser: (email: string, pass: string) => Promise<UserCredential | null>;
  loginUser: (email: string, pass: string) => Promise<UserCredential | null>;
  logoutUser: () => Promise<void>;
  createNewPlayerDocument: (userId: string, email: string | null) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const createNewPlayerDocument = useCallback(async (userId: string, email: string | null) => {
    const playerDocRef = doc(db, 'players', userId);
    
    const playerDocSnap = await getDoc(playerDocRef);
    if (playerDocSnap.exists()) {
      console.log(`Player document for UID ${userId} already exists. Skipping creation.`);
      return;
    }

    const newPlayerProfile: Player = {
      id: userId,
      name: email?.split('@')[0] || 'Novato', 
      genderAvatarKey: defaultAvatarKey, // Use default avatar key
      level: 1,
      xp: 0,
      coins: 0,
      stats: {}, 
      statDescriptions: {}, 
      hasCompletedQuiz: false, 
    };
    
    try {
      await setDoc(playerDocRef, newPlayerProfile);
    } catch (e) {
      console.error("Error creating initial player document:", e);
      toast({ title: "Error de Configuración de Perfil", description: "No se pudo crear el perfil inicial del jugador.", variant: "destructive" });
      throw e; 
    }
  }, [toast]);


  const registerUser = async (email: string, pass: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      await createNewPlayerDocument(userCredential.user.uid, userCredential.user.email);
      toast({ title: '¡Registro Exitoso!', description: 'Ahora personaliza tu aventura.' });
      router.push('/dashboard'); 
      return userCredential;
    } catch (e: any) {
      console.error("Registration error:", e);
      setError(e.message || 'Falló el registro. Intenta de nuevo.');
      toast({ title: 'Falló el Registro', description: e.message || 'Verifica tus datos e intenta de nuevo.', variant: 'destructive' });
      setIsLoading(false);
      return null;
    }
  };

  const loginUser = async (email: string, pass: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, pass);
      toast({ title: '¡Login Exitoso!', description: '¡Bienvenido de vuelta!' });
      router.push('/dashboard');
      return userCredential;
    } catch (e: any) {
      console.error("Login error:", e);
      setError(e.message || 'Falló el login. Verifica tus credenciales.');
      toast({ title: 'Falló el Login', description: e.message || 'Email o contraseña incorrectos.', variant: 'destructive' });
      setIsLoading(false);
      return null;
    }
  };

  const logoutUser = async () => {
    setIsLoading(true);
    try {
      await signOut(auth);
      setUser(null); 
      toast({ title: 'Sesión Cerrada', description: '¡Hasta la próxima aventura!' });
      router.push('/login'); 
    } catch (e: any) {
      console.error("Logout error:", e);
      setError(e.message || 'Falló el logout.');
      toast({ title: 'Falló el Logout', description: e.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, error, registerUser, loginUser, logoutUser, createNewPlayerDocument }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
