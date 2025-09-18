// src/state/auth.jsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut as fbSignOut,
  updateProfile
} from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";

const AuthContext = createContext(null);
export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      try {
        setUser(u || null);
        if (u) {
          const ref = doc(db, "users", u.uid);
          await setDoc(
            ref,
            {
              uid: u.uid,
              email: u.email || "",
              displayName: u.displayName || (u.email?.split("@")[0] || "User"),
              emailVerified: !!u.emailVerified,
              photoURL: u.photoURL || null,
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          );
        }
      } catch (e) {
        console.error("Auth init error:", e);
      } finally {
        setInitializing(false);
      }
    });
    return () => unsub();
  }, []);

  // --- Sign up ---
  async function signUp(arg1, arg2, arg3) {
    let email, password, displayName;
    if (typeof arg1 === "object" && arg1 !== null) {
      ({ email, password, displayName } = arg1);
    } else {
      email = arg1;
      password = arg2;
      displayName = arg3;
    }
    if (!email || !password) throw new Error("Email and password are required");

    const cred = await createUserWithEmailAndPassword(auth, email, password);
    if (displayName) {
      try {
        await updateProfile(cred.user, { displayName });
      } catch (err) {
        console.warn("Failed to update profile:", err);
      }
    }

    const ref = doc(db, "users", cred.user.uid);
    await setDoc(
      ref,
      {
        uid: cred.user.uid,
        email: cred.user.email || "",
        displayName: cred.user.displayName || (cred.user.email?.split("@")[0] || "User"),
        emailVerified: !!cred.user.emailVerified,
        photoURL: cred.user.photoURL || null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    return cred.user;
  }

  // --- Sign in ---
  async function signIn(arg1, arg2) {
    let email, password;
    if (typeof arg1 === "object" && arg1 !== null) {
      ({ email, password } = arg1);
    } else {
      email = arg1;
      password = arg2;
    }
    if (!email || !password) throw new Error("Email and password are required");
    const { user } = await signInWithEmailAndPassword(auth, email, password);
    return user;
  }

  async function sendReset(email) {
    if (!email) throw new Error("Please enter your email.");
    await sendPasswordResetEmail(auth, email);
  }

  async function signOut() {
    await fbSignOut(auth);
  }

  const value = useMemo(
    () => ({
      user,
      initializing,
      signUp,
      signIn,
      sendReset,
      signOut
    }),
    [user, initializing]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
