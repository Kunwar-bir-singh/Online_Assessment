"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";
import { authApi } from "./api";
import { tokenManager, UserData } from "./token-manager";
import { toast } from "@/hooks/use-toast";

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    name: string,
    email: string,
    password: string,
    address: string,
  ) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Check for existing tokens on mount
  useEffect(() => {
    const initializeAuth = () => {
      const userData = tokenManager.getUserFromToken();
      if (userData) {
        console.log("USER DATA", userData);
        setUser({
          id: userData?.id.toString(),
          name: userData?.name,
          email: userData?.email,
          address: userData?.address,
        });
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      setIsLoading(true);
      try {
        const data = await authApi.login(email, password);
        setUser({
          id: data?.user?.id.toString(),
          name: data?.user?.name,
          email: data?.user?.email,
          address: data?.user?.address,
        });

        toast({
          title: "Success",
          description: "You have been logged in successfully.",
          variant: "default",
        });
      } catch (error: any) {
        const errorMessage = error.message || "Login failed. Please try again.";
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [router],
  );

  const register = useCallback(
    async (name: string, email: string, password: string, address: string) => {
      setIsLoading(true);
      try {
        const data = await authApi.register(name, email, password, address);
        setUser({
          id: data?.user?.id?.toString(),
          name: data?.user?.name,
          email: data?.user?.email,
          address: data?.user?.address,
        });

        toast({
          title: "Success",
          description: "Your account has been created successfully.",
          variant: "default",
        });
      } catch (error: any) {
        const errorMessage =
          error.message || "Registration failed. Please try again.";
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [router],
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
      toast({
        title: "Logged Out",
        description: "You have been logged out successfully.",
        variant: "default",
      });
    } catch {
      // Clear tokens even if API call fails
      tokenManager.clearTokens();
    } finally {
      setUser(null);
      // Redirect to login page
      router.push("/");
    }
  }, [router]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
