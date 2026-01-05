import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";

export interface UserProfile {
  id: string;
  name: string;
  role: "CUSTOMER" | "WORKER" | "UNASSIGNED";
  firebaseUid: string;
  email: string;
  phone: string;
  workerProfile?: any;
  customerProfile?: any;
}

export function useUserProfile() {
  const { user, loading: authLoading } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUserProfile() {
      if (authLoading) {
        setLoading(true);
        return;
      }
      
      if (!user) {
        setUserProfile(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        // Get the Firebase ID token
        const token = await user.getIdToken();
        
        const response = await fetch('/api/user/profile', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (!response.ok) {
          if (response.status === 401) {
            setUserProfile(null);
            setLoading(false);
            return;
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const profile: UserProfile = await response.json();
        setUserProfile(profile);
      } catch (err) {
        console.error('Error fetching user profile:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setUserProfile(null);
      } finally {
        setLoading(false);
      }
    }

    fetchUserProfile();
  }, [user, authLoading]);

  return {
    userProfile,
    loading: loading || authLoading,
    error,
    isAuthenticated: !!user && !!userProfile,
  };
}
