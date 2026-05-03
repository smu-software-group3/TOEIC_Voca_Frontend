import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { clearAuthTokens, getMemberInfo, logout } from "../api/server";

export function Sidebar({
  isMobile = false,
  isMobileOpen = false,
  onCloseMobile,
  isCollapsed = false,
  onToggleCollapse,
  topOffset = 0,
  style,
}) {
  const navigate = useNavigate();
  const [hasToken, setHasToken] = useState(!!localStorage.getItem("token"));
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const syncTokenState = () => {
      setHasToken(!!localStorage.getItem("token"));
    };

    window.addEventListener("storage", syncTokenState);
    return () => window.removeEventListener("storage", syncTokenState);
  }, []);

  useEffect(() => {
    const loadRole = async () => {
      if (!hasToken) {
        setIsAdmin(false);
        return;
      }

      try {
        const memberInfo = await getMemberInfo();
        const payload = memberInfo?.data || memberInfo || {};
        const role =
          payload.role ||
          payload.userRole ||
          (Array.isArray(payload.roles)
            ? typeof payload.roles[0] === "string"
              ? payload.roles[0]
              : payload.roles[0]?.role
            : "");

        setIsAdmin(role === "ROLE_ADMIN");
      } catch {
        setIsAdmin(false);
      }
    };

    loadRole();
  }, [hasToken]);

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

    clearAuthTokens();
    setHasToken(false);
    if (isMobile) {
      onCloseMobile?.();
    }
    navigate("/login");
  };

  const handleNavigate = (path) => {
    navigate(path);
    if (isMobile) {
      onCloseMobile?.();
    }
  };

  return (
    <div
      style={{
        width: isMobile ? "260px" : "320px",
        flexShrink: 0,
        background: "linear-gradient(180deg, #1e1b4b 0%, #0f172a 100%)",
        padding: "28px 20px",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        gap: "2px",
        borderRight: isCollapsed
          ? "none"
          : "0.5px solid rgba(139, 92, 246, 0.15)",
        position: "fixed",
        top: topOffset,
        left: 0,
        height: `calc(100vh - ${topOffset}px)`,
        overflowY: "hidden",
        zIndex: 1000,
        transition:
          "transform 0.25s ease, box-shadow 0.25s ease, width 0.25s ease",
        transform: isMobile
          ? !isMobileOpen
            ? "translateX(-100%)"
            : "translateX(0)"
          : isCollapsed
            ? "translateX(-100%)"
            : "translateX(0)",
        boxShadow: isMobile ? "0 12px 30px rgba(15, 23, 42, 0.22)" : "none",
        ...style,
      }}
    >
      {/* Logo */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          marginBottom: "24px",
          padding: "0 4px",
          flexShrink: 0,
        }}
      >
        <div
          onClick={() => handleNavigate("/")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "9px",
            cursor: "pointer",
            transition: "opacity 0.2s ease",
            whiteSpace: "nowrap",
            overflow: "hidden",
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
              flexShrink: 0,
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
          <div style={{ marginLeft: 8, overflow: "hidden" }}>
            <div
              style={{
                fontSize: "15px",
                fontWeight: "700",
                letterSpacing: "-0.3px",
                color: "#c4b5fd",
                whiteSpace: "nowrap",
              }}
            >
              VocaStats
            </div>
          </div>
        </div>

        {/* Collapse/close button: shown to the right of the logo when sidebar is expanded.
            On desktop it toggles collapsed state; on mobile it closes the mobile sidebar. */}
        {(isMobile ? isMobileOpen : !isCollapsed) && (
          <button
            type="button"
            aria-label={isMobile ? "사이드바 닫기" : "사이드바 접기"}
            onClick={() => {
              if (isMobile) onCloseMobile?.();
              else onToggleCollapse?.();
            }}
            style={{
              marginLeft: "auto",
              width: 36,
              height: 36,
              borderRadius: 8,
              border: "none",
              background: "transparent",
              color: "#c4b5fd",
              cursor: "pointer",
            }}
          >
            ‹
          </button>
        )}
      </div>

      {/* Navigation Section - VOCA */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          marginRight: "-20px",
          paddingRight: "20px",
          paddingBottom: "12px",
        }}
      >
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
          onClick={() => handleNavigate("/word")}
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
        {isAdmin && (
          <div
            onClick={() => handleNavigate("/admin")}
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
              whiteSpace: "nowrap",
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
              <path d="M3 7h18" />
              <path d="M6 7V5h12v2" />
              <path d="M5 7l1 12h12l1-12" />
            </svg>
            <span>관리자 단어장 관리</span>
          </div>
        )}
        <div
          onClick={() => handleNavigate("/wtest")}
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
      </div>

      {/* Bottom Profile Section */}
      <div
        style={{
          marginTop: "auto",
          paddingTop: "12px",
          paddingLeft: "12px",
          paddingRight: "12px",
          paddingBottom: "12px",
          borderTop: "0.5px solid rgba(139, 92, 246, 0.12)",
          display: "flex",
          flexDirection: "column",
          gap: "2px",
          flexShrink: 0,
        }}
      >
        <div
          onClick={() => handleNavigate("/login")}
          style={{
            display: hasToken ? "none" : "flex",
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
          onClick={() => handleNavigate("/register")}
          style={{
            display: hasToken ? "none" : "flex",
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
          onClick={() => handleNavigate("/profile")}
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
      </div>
    </div>
  );
}
