import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import "./Landing.css";
import { useAuth } from "../../contexts/AuthContext";

// Landing page: minimal nav (left logo), hero and features sections.
export default function Landing() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/main");
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="landing-root">
      <section className="hero-section">
        <div className="hero-card fade-slide-up">
          <h1>
            <span className="brand">VocaStats</span>에 오신 것을
            <br />
            환영합니다.
          </h1>
          <p className="hero-subtitle">
            서비스를 이용하려면 로그인을 해주세요.
          </p>
          <div className="hero-actions">
            <button
              className="landing-login-btn"
              onClick={() => navigate("/login")}
              type="button"
            >
              로그인
            </button>
          </div>
        </div>
      </section>

      <section className="features-section">
        <h2 className="fade-slide-up">VocaStats와 함께라면</h2>
        <p className="sub">단어 암기부터 실력 확인까지, 모든 것을 한 곳에서</p>

        <div className="feature-grid">
          <article className="feature-card fade-slide-up">
            <div className="feature-icon-wrap purple">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="3" width="7" height="4" rx="1" />
                <rect x="3" y="10" width="7" height="4" rx="1" />
                <rect x="3" y="17" width="7" height="4" rx="1" />
                <line x1="14" y1="5" x2="21" y2="5" />
                <line x1="14" y1="12" x2="21" y2="12" />
                <line x1="14" y1="19" x2="21" y2="19" />
              </svg>
            </div>
            <h3>스마트 단어장</h3>
            <p>효율적인 단어장으로 체계적인 공부를 시작해보세요!</p>
          </article>

          <article className="feature-card fade-slide-up">
            <div className="feature-icon-wrap green">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="9 11 12 14 22 4" />
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
              </svg>
            </div>
            <h3>다양한 테스트</h3>
            <p>
              객관식, 주관식 다양한 유형으로 실력을 테스트하고 틀린 단어를
              재학습하세요.
            </p>
          </article>

          <article className="feature-card fade-slide-up">
            <div className="feature-icon-wrap orange">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
              </svg>
            </div>
            <h3>학습 통계 대시보드</h3>
            <p>나의 학습 패턴을 분석해 약점 단어를 집중 공략할 수 있어요.</p>
          </article>
        </div>
      </section>
    </div>
  );
}
