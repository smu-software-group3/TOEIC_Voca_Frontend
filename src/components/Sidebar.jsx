import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { logout } from "../api/server";

export function Sidebar() {
  const navigate = useNavigate();
  const [hasToken, setHasToken] = useState(!!localStorage.getItem("token"));

  useEffect(() => {
    const syncTokenState = () => {
      setHasToken(!!localStorage.getItem("token"));
    };

    window.addEventListener("storage", syncTokenState);
    return () => window.removeEventListener("storage", syncTokenState);
  }, []);

  const handleLogout = async () => {
    try {
      const response = await logout();

      if (!response?.success) {
        throw new Error(response?.message || "로그아웃 요청에 실패했습니다.");
      }
    } catch (requestError) {
      if (requestError.code !== "UNAUTHORIZED") {
        alert(requestError.message || "로그아웃 요청에 실패했습니다.");
        return;
      }
    }

    localStorage.removeItem("token");
    setHasToken(false);
    navigate("/login");
  };

  const handleSetTemporaryToken = () => {
    const token = "your-temporary-token";
    localStorage.setItem("token", token);
    setHasToken(true);
  };

  return (
    <div
      style={{
        width: "260px",
        flexShrink: 0,
        background: "linear-gradient(180deg, #1e1b4b 0%, #0f172a 100%)",
        padding: "28px 20px",
        display: "flex",
        flexDirection: "column",
        gap: "2px",
        borderRight: "0.5px solid rgba(139, 92, 246, 0.15)",
        position: "fixed",
        top: 0,
        left: 0,
        height: "100vh",
        overflowY: "auto",
        zIndex: 1000,
      }}
    >
      {/* Logo */}
      <div
        onClick={() => navigate("/")}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "9px",
          marginBottom: "24px",
          padding: "0 4px",
          cursor: "pointer",
          transition: "opacity 0.2s ease",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
      >
        <div
          style={{
            width: "34px",
            height: "34px",
            borderRadius: "10px",
            background: "linear-gradient(135deg, #7c3aed, #0d9488)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 10px rgba(124, 58, 237, 0.4)",
          }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            strokeLinecap="round"
          >
            <path
              d="M12 2L2 7l10 5 10-5-10-5z"
              stroke="#e9d5ff"
              strokeWidth="2"
            />
            <path d="M2 17l10 5 10-5" stroke="#5eead4" strokeWidth="2" />
            <path d="M2 12l10 5 10-5" stroke="#c4b5fd" strokeWidth="2" />
          </svg>
        </div>
        <div>
          <div
            style={{
              fontSize: "15px",
              fontWeight: "700",
              letterSpacing: "-0.3px",
              color: "#c4b5fd",
            }}
          >
            VocaStats
          </div>
        </div>
      </div>

      {/* Navigation Section - VOCA */}
      <p
        style={{
          fontSize: "11px",
          fontWeight: "700",
          letterSpacing: "0.1em",
          padding: "12px 10px 4px",
          color: "#a78bfa",
        }}
      >
        VOCA
      </p>
      <div
        onClick={() => navigate("/word")}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "10px 12px",
          borderRadius: "8px",
          fontSize: "14px",
          color: "#64748b",
          cursor: "pointer",
          transition: "all 0.2s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "rgba(139, 92, 246, 0.18)";
          e.currentTarget.style.color = "#c4b5fd";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.color = "#64748b";
        }}
      >
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
        </svg>
        단어장
      </div>
      <div
        onClick={() => navigate("/wtest")}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "10px 12px",
          borderRadius: "8px",
          fontSize: "14px",
          color: "#64748b",
          cursor: "pointer",
          transition: "all 0.2s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "rgba(139, 92, 246, 0.18)";
          e.currentTarget.style.color = "#c4b5fd";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.color = "#64748b";
        }}
      >
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        테스트
      </div>

      {/* Bottom Profile Section */}
      <div
        style={{
          marginTop: "auto",
          paddingTop: "16px",
          borderTop: "0.5px solid rgba(139, 92, 246, 0.12)",
          display: "flex",
          flexDirection: "column",
          gap: "2px",
        }}
      >
        <div
          onClick={() => navigate("/login")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 12px",
            borderRadius: "8px",
            fontSize: "14px",
            color: "#64748b",
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(139, 92, 246, 0.18)";
            e.currentTarget.style.color = "#c4b5fd";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "#64748b";
          }}
        >
          로그인
        </div>
        <div
          onClick={() => navigate("/register")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 12px",
            borderRadius: "8px",
            fontSize: "14px",
            color: "#64748b",
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(139, 92, 246, 0.18)";
            e.currentTarget.style.color = "#c4b5fd";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "#64748b";
          }}
        >
          회원가입
        </div>
        <div
          onClick={() => navigate("/profile")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 12px",
            borderRadius: "8px",
            fontSize: "14px",
            background: "rgba(139, 92, 246, 0.18)",
            color: "#c4b5fd",
            fontWeight: "500",
            cursor: "pointer",
          }}
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          내 프로필
        </div>
        {hasToken && (
          <div
            onClick={handleLogout}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 12px",
              borderRadius: "8px",
              fontSize: "14px",
              color: "#64748b",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(139, 92, 246, 0.18)";
              e.currentTarget.style.color = "#c4b5fd";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "#64748b";
            }}
          >
            로그아웃
          </div>
        )}
        <div
          onClick={handleSetTemporaryToken}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 12px",
            borderRadius: "8px",
            fontSize: "13px",
            color: "#64748b",
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(139, 92, 246, 0.18)";
            e.currentTarget.style.color = "#c4b5fd";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "#64748b";
          }}
        >
          임시 토큰
        </div>
      </div>
    </div>
  );
}
