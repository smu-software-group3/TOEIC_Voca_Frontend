import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Navigate, useLocation } from "react-router-dom";
import {
  clearAuthTokens,
  getStoredAccessToken,
  getStoredRefreshToken,
  refreshAccessToken,
} from "../api/server";

const AuthContext = createContext(null);

function readAuthState() {
  const accessToken = getStoredAccessToken();
  const refreshToken = getStoredRefreshToken();

  return {
    isAuthenticated: !!accessToken,
    isRestoring: !accessToken && !!refreshToken,
  };
}

export function AuthProvider({ children }) {
  const [authState, setAuthState] = useState(readAuthState);

  useEffect(() => {
    const syncAuthState = () => setAuthState(readAuthState());

    let isMounted = true;

    const restoreSession = async () => {
      const accessToken = getStoredAccessToken();
      const refreshToken = getStoredRefreshToken();

      if (accessToken || !refreshToken) {
        return;
      }

      try {
        await refreshAccessToken();
      } catch {
        clearAuthTokens();
      } finally {
        if (isMounted) {
          setAuthState(readAuthState());
        }
      }
    };

    window.addEventListener("authchange", syncAuthState);
    window.addEventListener("storage", syncAuthState);
    restoreSession();

    return () => {
      isMounted = false;
      window.removeEventListener("authchange", syncAuthState);
      window.removeEventListener("storage", syncAuthState);
    };
  }, []);

  const value = useMemo(
    () => ({
      isAuthenticated: authState.isAuthenticated,
      isRestoring: authState.isRestoring,
      refreshAuthState: () => setAuthState(readAuthState()),
    }),
    [authState.isAuthenticated, authState.isRestoring],
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
  const { isAuthenticated, isRestoring } = useAuth();

  if (isRestoring) {
    return <div role="status">로그인 정보를 불러오는 중...</div>;
  }

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
