import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  isAutoLoginEnabled,
  login,
  setAutoLoginEnabled,
  storeAuthTokensFromResponse,
} from "../api/server";
import "./Login.css";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [autoLogin, setAutoLogin] = useState(isAutoLoginEnabled());
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const loginNotice = location.state?.message;

  // 로그인 요청을 보내고 토큰을 저장한 뒤 메인 화면으로 이동한다.
  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      setAutoLoginEnabled(autoLogin);

      const data = await login(email, password);
      console.log("로그인 응답 데이터:", data);
      const authTokens = storeAuthTokensFromResponse(
        data,
        {},
        {
          persistRefreshToken: autoLogin,
        },
      );

      if (!authTokens.accessToken) {
        throw new Error("로그인 토큰을 받지 못했습니다.");
      }
      console.log("로그인 성공:", data);
      navigate("/");
      // TODO: 로그인 성공 후 리다이렉트 또는 사용자 상태 저장
    } catch (err) {
      setError(err.message || "로그인에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-left">
          <div className="login-logo">
            <span className="login-logo-part login-logo-voca">VOCA</span>
            <span className="login-logo-part login-logo-stats">STATS</span>
          </div>
          <p className="login-logo-sub">VOCABULARY · STATISTICS</p>
          <h1 className="login-headline">어휘와 통계로 완성하는 영어 학습</h1>
          <p className="login-subtext">단어를 외우고, 데이터로 확인하세요.</p>
          <ul className="login-features">
            <li className="login-feature">
              <span className="login-feature-icon login-feature-icon-purple">
                📖
              </span>
              단어장 · 테스트 · 계정 관리
            </li>
            <li className="login-feature">
              <span className="login-feature-icon login-feature-icon-green">
                📊
              </span>
              학습 통계 · 진도 확인
            </li>
          </ul>
        </div>

        <div className="login-right">
          <h2 className="login-form-title">로그인</h2>
          {loginNotice && (
            <p
              className="login-error"
              role="alert"
              style={{ marginBottom: 12 }}
            >
              {loginNotice}
            </p>
          )}
          <p className="login-register-hint">
            처음이신가요?{" "}
            <button
              type="button"
              className="login-register-link"
              onClick={() => navigate("/register")}
            >
              회원가입
            </button>
          </p>

          <form onSubmit={handleSubmit}>
            <div className="login-field">
              <label className="login-label" htmlFor="email">
                이메일
              </label>
              <input
                id="email"
                className="login-input"
                type="email"
                placeholder="example@email.com"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="login-field">
              <label className="login-label" htmlFor="password">
                비밀번호
              </label>
              <input
                id="password"
                className="login-input"
                type="password"
                placeholder="비밀번호를 입력하세요"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="login-forgot"
                onClick={() => navigate("/pwf")}
              >
                비밀번호를 잊으셨나요?
              </button>
            </div>

            <label className="login-auto-row" htmlFor="autoLogin">
              <input
                id="autoLogin"
                className="login-auto-checkbox"
                type="checkbox"
                checked={autoLogin}
                onChange={(e) => setAutoLogin(e.target.checked)}
              />
              <span className="login-auto-label">자동 로그인</span>
            </label>

            {error && <p className="login-error">{error}</p>}

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? "로그인 중..." : "로그인"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
