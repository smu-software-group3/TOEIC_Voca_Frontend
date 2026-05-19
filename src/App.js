import { useEffect, useMemo, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { clearAuthTokens, getMemberInfo, logout } from "./api/server";
import { useAuth } from "./contexts/AuthContext";
import logoDefault from "./img/logo_default.png";
import "./App.css";
import DefaultProfile from "./components/DefaultProfile";
import ScrollToTop from "./components/ScrollToTop";

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
    case "manage":
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
  const { isAuthenticated, refreshAuthState } = useAuth();
  const [memberName, setMemberName] = useState("사용자");
  const [memberRole, setMemberRole] = useState("");
  const [memberProfileImage, setMemberProfileImage] = useState("");
  const isAdmin =
    memberRole === "ROLE_ADMIN" || memberRole.toLowerCase() === "admin";

  const navItems = useMemo(
    () => [
      { label: "단어장 조회", path: "/word", enabled: true, icon: "book" },
      { label: "단어 테스트", path: "/wtest", enabled: true, icon: "test" },
      { label: "재학습", path: "/retest", enabled: true, icon: "retest" },
      ...(isAdmin
        ? [
            {
              label: "단어장 관리",
              path: "/admin",
              enabled: true,
              icon: "manage",
            },
          ]
        : []),
      { label: "프로필", path: "/profile", enabled: true, icon: "profile" },
    ],
    [isAdmin],
  );

  useEffect(() => {
    let mounted = true;

    async function loadMemberName() {
      if (!isAuthenticated) {
        if (mounted) {
          setMemberName("사용자");
          setMemberRole("");
          setMemberProfileImage("");
        }
        return;
      }

      try {
        const response = await getMemberInfo();
        const payload = response?.data || response || {};
        const displayName =
          payload.nickname || payload.username || "로그인을 해주세요";
        const role =
          payload.role ||
          payload.userRole ||
          (Array.isArray(payload.roles)
            ? typeof payload.roles[0] === "string"
              ? payload.roles[0]
              : payload.roles[0]?.role
            : "");

        if (mounted) {
          setMemberName(displayName);
          setMemberRole(role || "");
          setMemberProfileImage(payload.profileImage || "");
        }
      } catch {
        if (mounted) {
          setMemberName("사용자");
          setMemberRole("");
          setMemberProfileImage("");
        }
      }
    }

    loadMemberName();

    const handleProfileChange = (event) => {
      const payload = (event && event.detail) || {};
      const profileImage = payload.profileImage || "";
      const newName = payload.nickname || payload.username || null;

      setMemberProfileImage(profileImage);
      if (newName) setMemberName(newName);
    };

    window.addEventListener("profilechange", handleProfileChange);

    return () => {
      mounted = false;
      window.removeEventListener("profilechange", handleProfileChange);
    };
  }, [isAuthenticated]);

  const handleNavigate = (path) => {
    if (!path) {
      return;
    }

    navigate(path);
  };

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
    refreshAuthState();
    setMemberName("사용자");
    setMemberRole("");
    setMemberProfileImage("");
    navigate("/login");
  };

  const isActivePath = (path) => location.pathname.startsWith(path);

  return (
    <div className="app-layout">
      <header className="app-navbar">
        <div className="app-navbar-inner">
          {/* 상단 로고는 템플릿의 브랜드 영역을 그대로 대체한다. */}
          <div>
            <button
              type="button"
              className="app-logo"
              aria-label="홈으로 이동"
              onClick={() => navigate("/main")}
            >
              <span className="app-logo-frame" aria-hidden="true">
                <img
                  src={logoDefault}
                  alt="VocaStats 로고"
                  className="app-logo-image"
                />
              </span>
            </button>
          </div>

          {isAuthenticated /* 가운데 메뉴는 템플릿의 상단 내비게이션과 동일한 구조를 따른다. */ && (
            <>
              <ul className="app-nav-links">
                {navItems.map((item) => {
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
                  className="app-profile-button"
                  aria-label="사용자 정보"
                  onClick={() => navigate("/profile")}
                >
                  <DefaultProfile
                    src={memberProfileImage}
                    alt="사용자 프로필 사진"
                    width={50}
                    height={50}
                  />
                  <span className="app-user-name">{memberName}</span>
                </button>

                {isAuthenticated && (
                  <button
                    type="button"
                    className="app-logout-button"
                    onClick={handleLogout}
                  >
                    로그아웃
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </header>

      <main className="app-content">
        <ScrollToTop />
        <Outlet />
      </main>

      {isAuthenticated && (
        <nav
          className="app-bottom-nav"
          aria-label="모바일 하단 내비게이션"
          style={{
            gridTemplateColumns: `repeat(${navItems.length}, minmax(0, 1fr))`,
          }}
        >
          {navItems.map((item) => {
            const active = item.path ? isActivePath(item.path) : false;

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
      )}
    </div>
  );
}

export default App;
