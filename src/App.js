import "./App.css";
import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./components/Sidebar";

function App() {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const sidebarWidth = 260;
  const sidebarOffset = isMobileView || isSidebarCollapsed ? 0 : sidebarWidth;

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
        minHeight: "100vh",
        background:
          "linear-gradient(145deg, #e8e4ff 0%, #d4e8ff 30%, #c8f5f0 60%, #e8e4ff 100%)",
        overflowX: "hidden",
      }}
    >
      {((isMobileView && !isMobileSidebarOpen) || isSidebarCollapsed) && (
        <button
          type="button"
          aria-label="사이드바 열기"
          onClick={() => {
            if (isMobileView) setIsMobileSidebarOpen(true);
            else setIsSidebarCollapsed(false);
          }}
          style={{
            position: "fixed",
            top: "16px",
            left: "16px",
            zIndex: 1201,
            width: "44px",
            height: "44px",
            borderRadius: "12px",
            border: "none",
            background: "linear-gradient(135deg, #1e1b4b, #0f766e)",
            color: "#fff",
            boxShadow: "0 8px 20px rgba(15, 23, 42, 0.25)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <span style={{ fontSize: "22px", lineHeight: 1 }}>☰</span>
        </button>
      )}

      <Sidebar
        isMobile={isMobileView}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
      />

      {isMobileView && isMobileSidebarOpen && (
        <div
          onClick={() => setIsMobileSidebarOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.45)",
            zIndex: 990,
          }}
        />
      )}

      <div
        style={{
          marginLeft: isMobileView ? 0 : sidebarOffset,
          minHeight: "100vh",
          width: isMobileView
            ? "100%"
            : `calc(100% - ${sidebarOffset}px)`,
          boxSizing: "border-box",
          paddingTop: isMobileView ? "72px" : 0,
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
