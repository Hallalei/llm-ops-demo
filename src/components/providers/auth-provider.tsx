"use client";

import { createContext, type ReactNode, useContext } from "react";
import type { UserRole } from "@/db/schema";

interface AuthContextValue {
  role: UserRole;
  canEdit: boolean;
  isSuperAdmin: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: ReactNode;
  role: UserRole;
}

export function AuthProvider({ children, role }: AuthProviderProps) {
  const value: AuthContextValue = {
    role,
    canEdit: role === "superadmin" || role === "admin",
    isSuperAdmin: role === "superadmin",
    isAdmin: role === "superadmin" || role === "admin",
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
