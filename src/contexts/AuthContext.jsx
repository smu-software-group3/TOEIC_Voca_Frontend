import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Navigate, useLocation } from "react-router-dom";
import { getStoredAccessToken } from "../api/server";

const AuthContext = createContext(null);

function readAuthState() {
  return {
    isAuthenticated: !!getStoredAccessToken(),
  };
}

export function AuthProvider({ children }) {
  const [authState, setAuthState] = useState(readAuthState);

  useEffect(() => {
    const syncAuthState = () => setAuthState(readAuthState());

    window.addEventListener("authchange", syncAuthState);
    window.addEventListener("storage", syncAuthState);

    return () => {
      window.removeEventListener("authchange", syncAuthState);
      window.removeEventListener("storage", syncAuthState);
    };
  }, []);

  const value = useMemo(
    () => ({
      isAuthenticated: authState.isAuthenticated,
      refreshAuthState: () => setAuthState(readAuthState()),
    }),
    [authState.isAuthenticated],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}

export function RequireAuth({ children }) {
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location.pathname,
          message: "로그인이 필요합니다. 먼저 로그인해주세요.",
        }}
      />
    );
  }

  return children;
}
