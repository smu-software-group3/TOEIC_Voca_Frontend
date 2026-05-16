import { useEffect, useMemo, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { getMemberInfo } from "./api/server";
import { useAuth } from "./contexts/AuthContext";
import logoDefault from "./img/logo_default.png";
import "./App.css";

function renderNavIcon(type) {
  switch (type) {
    case "book":
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 3H20v18H6.5A2.5 2.5 0 0 1 4 18.5v-13A2.5 2.5 0 0 1 6.5 3Z" />
        </svg>
      );
    case "test":
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="4" y="3" width="16" height="18" rx="2" />
          <path d="M8 7h8" />
          <path d="M8 11h8" />
          <path d="M8 15h5" />
        </svg>
      );
    case "retest":
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 12a9 9 0 0 1 15-6.7L20 7" />
          <path d="M20 4v5h-5" />
          <path d="M21 12a9 9 0 0 1-15 6.7L4 17" />
          <path d="M4 20v-5h5" />
        </svg>
      );
    case "dashboard":
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 19h16" />
          <path d="M6 17V9" />
          <path d="M11 17V5" />
          <path d="M16 17v-7" />
        </svg>
      );
    case "profile":
    default:
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="8" r="4" />
          <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
        </svg>
      );
  }
}

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const [memberName, setMemberName] = useState("사용자");

  const navItems = useMemo(
    () => [
      { label: "단어장 조회", path: "/word", enabled: true, icon: "book" },
      { label: "단어 테스트", path: "/wtest", enabled: true, icon: "test" },
      { label: "재학습", path: "/retest", enabled: true, icon: "retest" },
      { label: "대시보드", path: null, enabled: false, icon: "dashboard" },
      { label: "프로필", path: "/profile", enabled: true, icon: "profile" },
    ],
    [],
  );

  useEffect(() => {
    let mounted = true;

    async function loadMemberName() {
      if (!isAuthenticated) {
        if (mounted) {
          setMemberName("사용자");
        }
        return;
      }

      try {
        const response = await getMemberInfo();
        const payload = response?.data || response || {};
        const displayName = payload.nickname || payload.username || "사용자";

        if (mounted) {
          setMemberName(displayName);
        }
      } catch {
        if (mounted) {
          setMemberName("사용자");
        }
      }
    }

    loadMemberName();

    return () => {
      mounted = false;
    };
  }, [isAuthenticated]);

  const handleNavigate = (path) => {
    if (!path) {
      return;
    }

    navigate(path);
  };

  const isActivePath = (path) => location.pathname.startsWith(path);

  return (
    <div className="app-layout">
      <header className="app-navbar">
        <div className="app-navbar-inner">
          {/* 상단 로고는 템플릿의 브랜드 영역을 그대로 대체한다. */}
          <button
            type="button"
            className="app-logo"
            aria-label="홈으로 이동"
            onClick={() => navigate("/")}
          >
            <span className="app-logo-frame" aria-hidden="true">
              <img
                src={logoDefault}
                alt="VocaStats 로고"
                className="app-logo-image"
              />
            </span>
          </button>

          {/* 가운데 메뉴는 템플릿의 상단 내비게이션과 동일한 구조를 따른다. */}
          <ul className="app-nav-links">
            {navItems.map((item) => {
              if (!item.enabled) {
                return (
                  <li key={item.label}>
                    <span className="app-nav-link app-nav-link--disabled">
                      {item.label}
                    </span>
                  </li>
                );
              }

              return (
                <li key={item.label}>
                  <button
                    type="button"
                    className={[
                      "app-nav-link",
                      isActivePath(item.path) && "app-nav-link--active",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    onClick={() => handleNavigate(item.path)}
                  >
                    {item.label}
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="app-nav-right">
            <button
              type="button"
              className="app-notice-button"
              aria-label="알림"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 0 0-5-5.9V4a1 1 0 0 0-2 0v1.1A6 6 0 0 0 6 11v3.2a2 2 0 0 1-.6 1.4L4 17h5" />
                <path d="M9 17a3 3 0 0 0 6 0" />
              </svg>
              <span className="app-notice-badge">3</span>
            </button>

            <button
              type="button"
              className="app-profile-button"
              aria-label="사용자 정보"
            >
              <span className="app-avatar" aria-hidden="true">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                </svg>
              </span>
              <span className="app-user-name">
                {memberName}
                <svg
                  className="app-user-arrow"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </span>
            </button>
          </div>
        </div>
      </header>

      <main className="app-content">
        <Outlet />
      </main>

      <nav className="app-bottom-nav" aria-label="모바일 하단 내비게이션">
        {navItems.map((item) => {
          const active =
            item.enabled && item.path ? isActivePath(item.path) : false;

          if (!item.enabled) {
            return (
              <button
                key={item.label}
                type="button"
                className="app-bottom-nav-item app-bottom-nav-item--disabled"
                disabled
              >
                <span className="app-bottom-nav-icon" aria-hidden="true">
                  {renderNavIcon(item.icon)}
                </span>
                <span className="app-bottom-nav-label">{item.label}</span>
              </button>
            );
          }

          return (
            <button
              key={item.label}
              type="button"
              className={[
                "app-bottom-nav-item",
                active && "app-bottom-nav-item--active",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => handleNavigate(item.path)}
            >
              {item.icon === "profile" ? (
                <span
                  className="app-bottom-nav-profile-photo"
                  aria-hidden="true"
                >
                  {renderNavIcon(item.icon)}
                </span>
              ) : (
                <span className="app-bottom-nav-icon" aria-hidden="true">
                  {renderNavIcon(item.icon)}
                </span>
              )}
              <span className="app-bottom-nav-label">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

export default App;
