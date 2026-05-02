import React, { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";

export default function AuthLayout() {
  const navigate = useNavigate();
  const [isHoveringLogo, setIsHoveringLogo] = useState(false);

  return (
    <div style={{ position: "relative", minHeight: "100vh" }}>
      <button
        type="button"
        aria-label="홈으로 이동"
        onClick={() => navigate("/")}
        onMouseEnter={() => setIsHoveringLogo(true)}
        onMouseLeave={() => setIsHoveringLogo(false)}
        style={{
          position: "fixed",
          top: "16px",
          left: "16px",
          zIndex: 1200,
          display: "flex",
          alignItems: "center",
          gap: "9px",
          padding: "9px 12px 9px 10px",
          border: "none",
          borderRadius: "12px",
          background: isHoveringLogo
            ? "linear-gradient(180deg, #2a275d 0%, #17213f 100%)"
            : "linear-gradient(180deg, #1e1b4b 0%, #0f172a 100%)",
          boxShadow: isHoveringLogo
            ? "0 12px 28px rgba(15, 23, 42, 0.22)"
            : "0 10px 24px rgba(15, 23, 42, 0.18)",
          cursor: "pointer",
          transition:
            "background 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease",
          transform: isHoveringLogo ? "translateY(-1px)" : "translateY(0)",
        }}
      >
        <span
          style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg, #7c3aed, #0d9488)",
            boxShadow: isHoveringLogo
              ? "0 0 12px rgba(124, 58, 237, 0.55)"
              : "0 0 10px rgba(124, 58, 237, 0.4)",
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
        </span>
        <span
          style={{
            fontSize: 14,
            fontWeight: 700,
            letterSpacing: "-0.3px",
            color: isHoveringLogo ? "#e9d5ff" : "#c4b5fd",
            transition: "color 0.2s ease",
          }}
        >
          VocaStats
        </span>
      </button>

      <Outlet />
    </div>
  );
}
