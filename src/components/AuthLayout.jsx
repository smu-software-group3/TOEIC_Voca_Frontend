import React, { useEffect, useMemo, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { getMemberInfo } from "../api/server";
import { useAuth } from "../contexts/AuthContext";
import logoDefault from "../img/logo_default.png";
import "./AuthLayout.css";

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

export default function AuthLayout() {
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

  // 인증된 사용자의 닉네임을 navbar 오른쪽에 표시한다.
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
    <div className="auth-layout">
      <header className="auth-navbar">
        <div className="auth-navbar-inner">
          {/* 로고는 템플릿의 상단 브랜드 영역 역할을 한다. */}
          <button
            type="button"
            className="auth-logo"
            aria-label="홈으로 이동"
            onClick={() => navigate("/")}
          >
            <span className="auth-logo-frame" aria-hidden="true">
              <img
                src={logoDefault}
                alt="VocaStats 로고"
                className="auth-logo-image"
              />
            </span>
          </button>

          {/* 중앙 메뉴는 템플릿의 카드 전환용 링크를 대신한다. */}
          <ul className="auth-nav-links">
            {navItems.map((item) => {
              if (!item.enabled) {
                return (
                  <li key={item.label}>
                    <span className="auth-nav-link--disabled">
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
                      "auth-nav-link",
                      isActivePath(item.path) && "auth-nav-link--active",
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

          <div className="auth-nav-right">
            <button
              type="button"
              className="auth-notice-button"
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
              <span className="auth-notice-badge">3</span>
            </button>

            {/* 사용자 영역은 닉네임과 드롭다운 화살표만 보여준다. */}
            <button
              type="button"
              className="auth-profile-button"
              aria-label="사용자 정보"
            >
              <span className="auth-avatar" aria-hidden="true">
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
              <span className="auth-user-name">
                {memberName}
                <svg
                  className="auth-user-arrow"
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

      <main className="auth-content">
        <Outlet />
      </main>

      <nav className="auth-bottom-nav" aria-label="모바일 하단 내비게이션">
        {navItems.map((item) => {
          const active =
            item.enabled && item.path ? isActivePath(item.path) : false;

          if (!item.enabled) {
            return (
              <button
                key={item.label}
                type="button"
                className="auth-bottom-nav-item auth-bottom-nav-item--disabled"
                disabled
              >
                <span className="auth-bottom-nav-icon" aria-hidden="true">
                  {renderNavIcon(item.icon)}
                </span>
                <span className="auth-bottom-nav-label">{item.label}</span>
              </button>
            );
          }

          return (
            <button
              key={item.label}
              type="button"
              className={[
                "auth-bottom-nav-item",
                active && "auth-bottom-nav-item--active",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => handleNavigate(item.path)}
            >
              {item.icon === "profile" ? (
                <span
                  className="auth-bottom-nav-profile-photo"
                  aria-hidden="true"
                >
                  {renderNavIcon(item.icon)}
                </span>
              ) : (
                <span className="auth-bottom-nav-icon" aria-hidden="true">
                  {renderNavIcon(item.icon)}
                </span>
              )}
              <span className="auth-bottom-nav-label">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
