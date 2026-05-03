import "./App.css";
import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { Sidebar } from "./components/Sidebar";

function App() {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const navbarHeight = 64;
  const navigate = useNavigate();

  useEffect(() => {
    const updateViewport = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobileView(mobile);

      if (!mobile) {
        setIsMobileSidebarOpen(false);
      }
    };

    updateViewport();
    window.addEventListener("resize", updateViewport);

    return () => window.removeEventListener("resize", updateViewport);
  }, []);

  return (
    <div
      style={{
        height: "100vh",
        display: "block",
        background:
          "linear-gradient(145deg, #e8e4ff 0%, #d4e8ff 30%, #c8f5f0 60%, #e8e4ff 100%)",
        overflow: "hidden",
      }}
    >
      <header
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: navbarHeight,
          zIndex: 1202,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 18px",
          boxSizing: "border-box",
          background: "rgba(15, 23, 42, 0.78)",
          backdropFilter: "blur(14px)",
          borderBottom: "1px solid rgba(139, 92, 246, 0.18)",
        }}
      >
        <button
          type="button"
          aria-label={
            isMobileView
              ? isMobileSidebarOpen
                ? "사이드바 닫기"
                : "사이드바 열기"
              : isSidebarCollapsed
                ? "사이드바 열기"
                : "사이드바 닫기"
          }
          onClick={() => {
            if (isMobileView) {
              setIsMobileSidebarOpen((prev) => !prev);
            } else {
              setIsSidebarCollapsed((prev) => !prev);
            }
          }}
          style={{
            position: "absolute",
            left: 18,
            top: "50%",
            transform: "translateY(-50%)",
            width: "40px",
            height: "40px",
            borderRadius: "10px",
            border: "none",
            background: "transparent",
            color: "#e9d5ff",
            boxShadow: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            padding: 0,
          }}
        >
          <span style={{ fontSize: "22px", lineHeight: 1 }}>☰</span>
        </button>

        <div
          onClick={() => navigate("/")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            color: "#e9d5ff",
            fontWeight: 800,
            letterSpacing: "-0.02em",
            cursor: "pointer",
            position: "absolute",
            left: 74,
            top: "50%",
            transform: "translateY(-50%)",
          }}
        >
          <span
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              background: "linear-gradient(135deg, #7c3aed, #0d9488)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
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
          <span>VocaStats</span>
        </div>
      </header>

      <Sidebar
        isMobile={isMobileView}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
        topOffset={navbarHeight}
      />

      {isMobileView && isMobileSidebarOpen && (
        <div
          onClick={() => setIsMobileSidebarOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.45)",
            zIndex: 995,
          }}
        />
      )}

      <div
        style={{
          height: `calc(100vh - ${navbarHeight}px)`,
          marginTop: navbarHeight,
          marginLeft: isMobileView ? 0 : isSidebarCollapsed ? 0 : 320,
          width: isMobileView ? "100%" : isSidebarCollapsed ? "100%" : "calc(100% - 320px)",
          boxSizing: "border-box",
          overflowY: "auto",
          background:
            "linear-gradient(145deg, #e8e4ff 0%, #d4e8ff 30%, #c8f5f0 60%, #e8e4ff 100%)",
          transition: isMobileView
            ? "none"
            : "margin-left 0.25s ease, width 0.25s ease",
        }}
      >
        <Outlet />
      </div>
    </div>
  );
}

export default App;
