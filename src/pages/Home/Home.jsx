import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMemberInfo } from "../../api/server";
import { useAuth } from "../../contexts/AuthContext";
import "./Home.css";

export default function Home() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function fetch() {
      setLoading(true);
      setError("");
      // 로그인 여부 확인; 비로그인 시 API 호출 건너뜀
      if (!isAuthenticated) {
        if (mounted) {
          setLoading(false);
        }
        return;
      }
      try {
        const response = await getMemberInfo();
        if (!response?.success) {
          throw new Error(
            response?.message || "회원 정보 조회에 실패했습니다.",
          );
        }

        if (mounted) setUserProfile(response.data);
      } catch (err) {
        if (!mounted) {
          return;
        }

        if (err.code === "UNAUTHORIZED") {
          setError("인증이 필요합니다. 로그인 후 이용해주세요.");
        } else {
          setError(err.message || "회원 정보 조회에 실패했습니다.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetch();

    return () => {
      mounted = false;
    };
  }, [isAuthenticated]);

  if (loading) {
    return (
      <div className="home-fullscreen">
        <p>불러오는 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="home-fullscreen">
        <p role="alert">{error}</p>
      </div>
    );
  }

  const displayName =
    userProfile?.username || userProfile?.nickname || "사용자";

  return (
    <div className="home-page">
      <div className="home-inner">
        <div className="home-card">
          {isAuthenticated ? (
            <h1 style={{ margin: 0, fontSize: "26px", fontWeight: 900 }}>
              {displayName}님, 환영합니다.
            </h1>
          ) : (
            <h1 style={{ margin: 0, fontSize: "26px", fontWeight: 900 }}>
              VocaStats에 오신 것을 환영합니다.
            </h1>
          )}
          <p style={{ marginTop: "8px", color: "#6b7280" }}>
            VOCA STATS에 오신 것을 환영합니다. 오늘의 학습을 시작해보세요.
          </p>

          {/* 비로그인 사용자에게는 경고 배너를 노출 */}
          {!isAuthenticated && (
            <div className="alert-banner" role="alert">
              <span>
                로그인이 필요합니다. 일부 기능은 로그인 후에 이용할 수 있습니다.
              </span>
              <button
                onClick={() => navigate("/login")}
                className="btn btn-primary"
              >
                로그인
              </button>
              <button
                onClick={() => navigate("/register")}
                className="btn btn-outline"
              >
                회원가입
              </button>
            </div>
          )}

          <div className="home-actions">
            <button
              onClick={() => navigate(isAuthenticated ? "/word" : "/login")}
              className="action-btn primary"
            >
              내 단어장
            </button>
            <button
              onClick={() => navigate(isAuthenticated ? "/wtest" : "/login")}
              className="action-btn gradient"
            >
              오늘의 테스트 시작
            </button>
            <button
              onClick={() => navigate(isAuthenticated ? "/profile" : "/login")}
              className="action-btn ghost"
            >
              내 프로필 보기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
