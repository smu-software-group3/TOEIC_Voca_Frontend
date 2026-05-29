import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getDashboard, getMemberInfo } from "../../api/server";
import { useAuth } from "../../contexts/AuthContext";
import homeMascot from "../../img/logo_with_character_tr.png";
import "./Main.css";
import DefaultProfile from "../../components/DefaultProfile";

function toPercent(value) {
  const numeric = Number(value);

  if (!Number.isFinite(numeric)) {
    return "0%";
  }

  const normalized = numeric <= 1 ? numeric * 100 : numeric;
  return `${Math.round(normalized * 10) / 10}%`;
}
const ENCOURAGEMENT_MESSAGES = [
  "오늘도 단어 하나씩, 꾸준히가 실력이 됩니다! 💪",
  "어제보다 오늘 더 똑똑해지는 중! 🧠",
  "TOEIC 목표 점수, 오늘 한 발짝 더 가까워져요. 🎯",
  "꾸준한 학습이 가장 강력한 무기예요. 📚",
  "오늘 외운 단어가 시험장에서 빛날 거예요. ✨",
  "잠깐이라도 괜찮아요, 오늘 학습 시작해봐요! 🦉",
  "포기하지 않는 사람이 결국 이깁니다. 🏆",
  "매일 조금씩, 결과는 크게 달라져요. 📈",
  "오늘의 복습이 내일의 자신감이 됩니다. 🌟",
  "단어 하나가 점수 하나예요, 같이 해봐요! 🚀",
];

export default function Main() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [userProfile, setUserProfile] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [dashboardError, setDashboardError] = useState("");
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

        try {
          const dashboardResponse = await getDashboard();
          if (dashboardResponse?.success) {
            if (mounted) setDashboard(dashboardResponse.data);
          } else {
            if (mounted)
              setDashboardError(
                dashboardResponse?.message ||
                  "대시보드 정보를 불러오지 못했습니다.",
              );
          }
        } catch (dashboardRequestError) {
          if (mounted) {
            setDashboardError(
              dashboardRequestError.message ||
                "대시보드 정보를 불러오지 못했습니다.",
            );
          }
        }
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
  const profileImage = userProfile?.profileImage || "";
  const todayStats = dashboard?.todayStats || {};
  const streak = dashboard?.streak || {};
  const score = dashboard?.score || {};
  const welcomeMessage =
    ENCOURAGEMENT_MESSAGES[
      Math.floor(Math.random() * ENCOURAGEMENT_MESSAGES.length)
    ];

  return (
    <div className="home-page">
      {!isAuthenticated ? (
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
      ) : (
        <div className="home-inner">
          <div className="home-card">
            <div className="home-logo-wrap" aria-hidden="true">
              <img
                src={homeMascot}
                alt="VocaStats 로고"
                className="home-logo"
              />
            </div>

            {isAuthenticated ? (
              <div
                style={{ display: "flex", gap: "8px", alignItems: "center" }}
              >
                <DefaultProfile
                  className="home-profile-avatar"
                  src={profileImage}
                  alt="사용자 프로필 사진"
                  width={80}
                  height={80}
                />
                <h1 style={{ margin: 0, fontSize: "26px", fontWeight: 900 }}>
                  {displayName}님, 환영합니다.
                </h1>
              </div>
            ) : (
              <h1 style={{ margin: 0, fontSize: "26px", fontWeight: 900 }}>
                VocaStats에 오신 것을 환영합니다.
              </h1>
            )}
            <p style={{ marginTop: "8px", color: "#6b7280" }}>
              {welcomeMessage}
            </p>

            {dashboard && (
              <div className="home-dashboard-grid">
                <div className="home-dashboard-item">
                  <span className="home-dashboard-label">
                    오늘 학습한 단어 수
                  </span>
                  <strong className="home-dashboard-value">
                    {Number(todayStats.studiedWordCount || 0).toLocaleString()}
                  </strong>
                </div>
                <div className="home-dashboard-item">
                  <span className="home-dashboard-label">평균 정답률</span>
                  <strong className="home-dashboard-value">
                    {toPercent(todayStats.avgCorrectRate)}
                  </strong>
                </div>
                <div className="home-dashboard-item">
                  <span className="home-dashboard-label">연속 학습 일수</span>
                  <strong className="home-dashboard-value">
                    {Number(streak.currentStreak || 0).toLocaleString()}일
                  </strong>
                </div>
                <div className="home-dashboard-item">
                  <span className="home-dashboard-label">사용자 점수</span>
                  <strong className="home-dashboard-value">
                    {Number(score.score || 0).toLocaleString()}
                  </strong>
                </div>
              </div>
            )}

            {dashboardError && !dashboard && (
              <p className="home-score-error" role="alert">
                {dashboardError}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
