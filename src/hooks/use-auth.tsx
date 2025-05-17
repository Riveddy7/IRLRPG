
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
import { doc, setDoc, Timestamp, writeBatch, collection, getDoc } from 'firebase/firestore';
import type { Player, Task, Habit } from '@/types';
import { useToast } from './use-toast';
import { useRouter } from 'next/navigation';

// Default data for new users, similar to what was in useLifeQuestStore
const defaultTasksData: Omit<Task, 'id' | 'createdAt' | 'status' | 'userId'>[] = [
  { title: 'Conquer The Mementos', description: 'Reach the depths of Mementos', priority: 'Critical', xpReward: 100 },
  { title: 'Ace Midterms', description: 'Study hard and get top scores', priority: 'High', xpReward: 50, dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() },
];

const defaultHabitsData: Omit<Habit, 'id' | 'createdAt' | 'currentStreak' | 'longestStreak' | 'lastCompletedDate' | 'userId'>[] = [
  { title: 'Daily Training', type: 'Good', frequency: 'Daily', targetStat: 'power', statImprovementValue: 1 },
];


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
    
    // Check if player document already exists
    const playerDocSnap = await getDoc(playerDocRef);
    if (playerDocSnap.exists()) {
      console.log(`Player document for UID ${userId} already exists. Skipping creation.`);
      return;
    }

    const newPlayerProfile: Player = {
      id: userId,
      name: email?.split('@')[0] || 'New Phantom',
      avatarUrl: `https://placehold.co/128x128.png?text=${(email?.charAt(0) || 'N').toUpperCase()}`,
      dataAiHint: 'gamer avatar',
      level: 1,
      xp: 0,
      stats: { power: 5, guts: 5, intel: 5, charm: 5, focus: 5 },
    };
    
    try {
      await setDoc(playerDocRef, newPlayerProfile);
      toast({ title: "Welcome, Phantom!", description: "Your LifeQuest profile is ready!"});

      // Add default tasks and habits for the new user
      const batch = writeBatch(db);
      defaultTasksData.forEach(taskData => {
        const taskColRef = collection(db, 'players', userId, 'tasks');
        const newTaskRef = doc(taskColRef); // Auto-generate ID
        
        const taskPayload: { [key: string]: any } = {
          ...taskData, // Includes title, description, priority, xpReward
          status: 'To Do',
          createdAt: Timestamp.now(),
        };

        if (taskData.dueDate) {
          taskPayload.dueDate = Timestamp.fromDate(new Date(taskData.dueDate));
        }
        // If taskData.dueDate is undefined, the dueDate field will not be set in taskPayload

        batch.set(newTaskRef, taskPayload);
      });

      defaultHabitsData.forEach(habitData => {
        const habitColRef = collection(db, 'players', userId, 'habits');
        const newHabitRef = doc(habitColRef); // Auto-generate ID
        batch.set(newHabitRef, {
          ...habitData,
          currentStreak: 0,
          longestStreak: 0,
          createdAt: Timestamp.now(),
        });
      });
      await batch.commit();
      toast({ title: "Initial setup complete!", description: "Default tasks and habits added."});

    } catch (e) {
      console.error("Error creating player document or initial data:", e);
      toast({ title: "Profile Setup Error", description: "Could not create your player profile or initial data.", variant: "destructive" });
      throw e; // Re-throw to be caught by registerUser
    }
  }, [toast]);


  const registerUser = async (email: string, pass: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      await createNewPlayerDocument(userCredential.user.uid, userCredential.user.email);
      toast({ title: 'Registration Successful!', description: 'Welcome to LifeQuest RPG!' });
      router.push('/dashboard'); 
      return userCredential;
    } catch (e: any) {
      console.error("Registration error:", e);
      // If error is because user already exists, Firebase auth itself will throw 'auth/email-already-in-use'
      // Our createNewPlayerDocument also checks if player doc exists, so it won't try to overwrite.
      setError(e.message || 'Failed to register. Please try again.');
      toast({ title: 'Registration Failed', description: e.message || 'Please check your details and try again.', variant: 'destructive' });
      setIsLoading(false);
      return null;
    }
  };

  const loginUser = async (email: string, pass: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, pass);
      toast({ title: 'Login Successful!', description: 'Welcome back!' });
      router.push('/dashboard');
      return userCredential;
    } catch (e: any) {
      console.error("Login error:", e);
      setError(e.message || 'Failed to login. Please check your credentials.');
      toast({ title: 'Login Failed', description: e.message || 'Incorrect email or password.', variant: 'destructive' });
      setIsLoading(false);
      return null;
    }
  };

  const logoutUser = async () => {
    setIsLoading(true);
    try {
      await signOut(auth);
      setUser(null); 
      toast({ title: 'Logged Out', description: 'See you next time!' });
      router.push('/login'); 
    } catch (e: any) {
      console.error("Logout error:", e);
      setError(e.message || 'Failed to logout.');
      toast({ title: 'Logout Failed', description: e.message, variant: 'destructive' });
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
