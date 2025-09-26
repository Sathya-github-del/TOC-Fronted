"use client";

import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ProtectedRoute({ children, requireSignup = false, requireLogin = false }) {
  const { signedUp, loggedIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (requireSignup && !signedUp) {
      // Redirect to signup if signup is required but user hasn't signed up
      router.push('/?view=signup');
      return;
    }

    if (requireLogin && !loggedIn) {
      // Redirect to login if login is required but user isn't logged in
      router.push('/?view=login');
      return;
    }

    // Special case: if user is already logged in, don't allow access to profile setup
    if (requireSignup && !requireLogin && loggedIn) {
      router.push('/?view=profile');
      return;
    }
  }, [signedUp, loggedIn, requireSignup, requireLogin, router]);

  // Don't render children if protection requirements aren't met
  if (requireSignup && !signedUp) return null;
  if (requireLogin && !loggedIn) return null;
  if (requireSignup && !requireLogin && loggedIn) return null;

  return children;
}
