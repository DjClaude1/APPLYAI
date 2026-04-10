import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from '../firebase';

interface AuthContextType {
  user: User | null;
  userData: any | null;
  loading: boolean;
  login: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubUserData: Unsubscribe | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      // Clean up previous listener if it exists
      if (unsubUserData) {
        unsubUserData();
        unsubUserData = null;
      }

      if (currentUser) {
        const userRef = doc(db, 'users', currentUser.uid);
        
        try {
          const userSnap = await getDoc(userRef);
          if (!userSnap.exists()) {
            const newUserData = {
              uid: currentUser.uid,
              email: currentUser.email,
              displayName: currentUser.displayName,
              plan: 'free',
              resumeCount: 0,
              applicationCount: 0,
              createdAt: new Date().toISOString(),
            };
            await setDoc(userRef, newUserData);
            setUserData(newUserData);
          } else {
            setUserData(userSnap.data());
          }

          // Listen for real-time updates to user data
          unsubUserData = onSnapshot(userRef, (doc) => {
            if (doc.exists()) {
              setUserData(doc.data());
            }
          }, (error) => {
            handleFirestoreError(error, OperationType.GET, `users/${currentUser.uid}`);
          });
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, `users/${currentUser.uid}`);
        }
      } else {
        setUserData(null);
      }
      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      if (unsubUserData) unsubUserData();
    };
  }, []);

  const login = async () => {
    await signInWithPopup(auth, googleProvider);
  };

  const loginWithEmail = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const signUpWithEmail = async (email: string, pass: string, name: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    await updateProfile(userCredential.user, { displayName: name });
    
    // Create user doc immediately to ensure it exists
    const userRef = doc(db, 'users', userCredential.user.uid);
    const newUserData = {
      uid: userCredential.user.uid,
      email: email,
      displayName: name,
      plan: 'free',
      resumeCount: 0,
      applicationCount: 0,
      createdAt: new Date().toISOString(),
    };
    await setDoc(userRef, newUserData);
    setUserData(newUserData);
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      userData, 
      loading, 
      login, 
      loginWithEmail, 
      signUpWithEmail, 
      logout 
    }}>
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
