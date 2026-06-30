"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { auth as firebaseAuth, isFirebaseConfigured } from "@/lib/firebase";
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut as firebaseSignOut, 
  User as FirebaseUser 
} from "firebase/auth";
import { dbService, UserProfile, AIMemory } from "@/lib/db";

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  isMockMode: boolean;
  loginWithGoogle: () => Promise<void>;
  loginMock: (name: string, peakHours: "morning" | "afternoon" | "night") => Promise<void>;
  logout: () => Promise<void>;
  updatePeakHours: (peakHours: "morning" | "afternoon" | "night") => Promise<void>;
  updateMemory: (memory: AIMemory) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isMockMode, setIsMockMode] = useState<boolean>(true);

  // Sync auth state
  useEffect(() => {
    if (isFirebaseConfigured && firebaseAuth) {
      setIsMockMode(false);
      const unsubscribe = firebaseAuth.onAuthStateChanged(async (firebaseUser) => {
        if (firebaseUser) {
          // Fetch user profile from DB or create it
          const profile = await dbService.getProfile(firebaseUser.uid);
          if (profile) {
            setUser(profile);
          } else {
            const newProfile: UserProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              photoURL: firebaseUser.photoURL,
              peakHours: "morning",
              onboarded: false,
              aiMemory: {
                studyTimePreference: "Morning focus, late night reviews",
                averageCodingSpeed: "Moderate pace, regular check-ins",
                typicalProcrastinationPattern: "Tends to delay research tasks",
                preferredWorkSessionLength: 45,
                notes: "Initial system settings configured."
              }
            };
            await dbService.saveProfile(newProfile);
            setUser(newProfile);
          }
        } else {
          setUser(null);
        }
        setLoading(false);
      });
      return () => unsubscribe();
    } else {
      // Mock mode initialization
      setIsMockMode(true);
      if (typeof window !== "undefined") {
        const localProfile = localStorage.getItem("deadline_ai_mock_user");
        if (localProfile) {
          setUser(JSON.parse(localProfile));
        }
      }
      setLoading(false);
    }
  }, []);

  const loginWithGoogle = async () => {
    if (isFirebaseConfigured && firebaseAuth) {
      const provider = new GoogleAuthProvider();
      try {
        await signInWithPopup(firebaseAuth, provider);
      } catch (error) {
        console.error("Google Sign-In Error:", error);
        throw error;
      }
    } else {
      // Fallback to Mock login
      await loginMock("Workspace Admin", "morning");
    }
  };

  const loginMock = async (name: string, peakHours: "morning" | "afternoon" | "night") => {
    const mockUid = "mock_user_12345";
    const mockProfile: UserProfile = {
      uid: mockUid,
      email: "demo@deadline.ai",
      displayName: name,
      photoURL: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${name}`,
      peakHours: peakHours,
      onboarded: true,
      aiMemory: {
        studyTimePreference: peakHours === "morning" ? "Highly focused in mornings" : peakHours === "afternoon" ? "Peak execution in afternoons" : "Night owl - code flows best late",
        averageCodingSpeed: "Standard execution (1.2x multiplier)",
        typicalProcrastinationPattern: "Snoozes large tasks initially",
        preferredWorkSessionLength: 50,
        notes: "Learns user habits actively."
      }
    };
    
    if (typeof window !== "undefined") {
      localStorage.setItem("deadline_ai_mock_user", JSON.stringify(mockProfile));
      // Save in our dbService too
      await dbService.saveProfile(mockProfile);
    }
    
    setUser(mockProfile);
    setIsMockMode(true);
  };

  const logout = async () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("deadline_ai_mock_user");
    }
    setUser(null);
    setIsMockMode(false);
    
    if (isFirebaseConfigured && firebaseAuth) {
      await firebaseSignOut(firebaseAuth);
    }
    
    // Hard force route back to landing
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
  };

  const updatePeakHours = async (peakHours: "morning" | "afternoon" | "night") => {
    if (!user) return;
    const updated = { ...user, peakHours, onboarded: true };
    await dbService.saveProfile(updated);
    if (isMockMode && typeof window !== "undefined") {
      localStorage.setItem("deadline_ai_mock_user", JSON.stringify(updated));
    }
    setUser(updated);
  };

  const updateMemory = async (aiMemory: AIMemory) => {
    if (!user) return;
    const updated = { ...user, aiMemory };
    await dbService.saveProfile(updated);
    if (isMockMode && typeof window !== "undefined") {
      localStorage.setItem("deadline_ai_mock_user", JSON.stringify(updated));
    }
    setUser(updated);
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        loading, 
        isMockMode, 
        loginWithGoogle, 
        loginMock, 
        logout, 
        updatePeakHours, 
        updateMemory 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
