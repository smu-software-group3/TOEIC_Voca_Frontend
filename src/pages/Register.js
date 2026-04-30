import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signup, verifyEmail } from "../api/server";
import "./Register.css";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // 기본 가입 정보를 서버에 보내고 다음 단계로 넘어간다.
  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);

    if (password !== confirmPassword) {
      setError("비밀번호가 일치하지 않습니다.");
      setLoading(false);
      return;
    }

    try {
      await signup(email.trim(), password, confirmPassword);
      setMessage(
        "회원가입이 완료되었습니다. 이메일로 받은 인증 코드를 입력해주세요.",
      );
      setRegistrationComplete(true);
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err.message || "회원가입 요청에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 이메일 인증 코드를 확인하고 성공 시 로그인 화면으로 이동한다.
  const handleVerify = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);

    try {
      await verifyEmail(email.trim(), verificationCode.trim());
      setMessage("이메일 인증이 완료되었습니다. 로그인 페이지로 이동합니다.");
      setTimeout(() => {
        navigate("/login");
      }, 1200);
    } catch (err) {
      setError(err.message || "이메일 인증 요청에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const currentStep = registrationComplete ? 2 : 1;

  return (
    <div className="register-page">
      <div className="register-card">
        <div className="register-left">
          <div className="register-logo">
            <span className="register-logo-part register-logo-voca">VOCA</span>
            <span className="register-logo-part register-logo-stats">STATS</span>
          </div>
          <p className="register-logo-sub">VOCABULARY · STATISTICS</p>
          <h1 className="register-headline">지금 시작하면 내일의 어휘가 달라집니다</h1>
          <p className="register-subtext">2단계로 간편하게 가입하세요.</p>

          <ul className="register-steps">
            <li className="register-step">
              <div className={`register-step-num ${currentStep === 1 ? "active" : "done"}`}>
                {currentStep === 1 ? "1" : "✓"}
              </div>
              <div>
                <span className="register-step-title">기본 정보 입력</span>
                <span className="register-step-desc">이메일 · 비밀번호 등록</span>
              </div>
            </li>
            <li className="register-step">
              <div className={`register-step-num ${currentStep === 2 ? "active" : "idle"}`}>
                2
              </div>
              <div>
                <span className={`register-step-title ${currentStep === 2 ? "" : "idle"}`}>
                  이메일 인증
                </span>
                <span className="register-step-desc">인증 코드 확인</span>
              </div>
            </li>
          </ul>
        </div>

        <div className="register-right">
          <h2 className="register-title">{registrationComplete ? "이메일 인증" : "회원가입"}</h2>
          <p className="register-hint">
            이미 계정이 있으신가요?{" "}
            <button
              type="button"
              className="register-link"
              onClick={() => navigate("/login")}
            >
              로그인
            </button>
          </p>

          <div className="register-progress">
            <div className={`register-dot ${currentStep === 1 ? "active" : "done"}`} />
            <div className={`register-dot ${currentStep === 2 ? "active" : ""}`} />
          </div>

          {!registrationComplete ? (
            <form onSubmit={handleSubmit} className="register-panel">
              <div className="register-field">
                <label className="register-label" htmlFor="email">
                  이메일
                </label>
                <input
                  id="email"
                  className="register-input"
                  type="email"
                  placeholder="example@email.com"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="register-field">
                <label className="register-label" htmlFor="password">
                  비밀번호
                </label>
                <input
                  id="password"
                  className="register-input"
                  type="password"
                  placeholder="비밀번호를 입력하세요"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div className="register-field">
                <label className="register-label" htmlFor="confirmPassword">
                  비밀번호 확인
                </label>
                <input
                  id="confirmPassword"
                  className="register-input"
                  type="password"
                  placeholder="비밀번호를 다시 입력하세요"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              {message && <p className="register-message success">{message}</p>}
              {error && <p className="register-message error">{error}</p>}

              <button type="submit" className="register-btn" disabled={loading}>
                {loading ? "처리 중..." : "다음 단계"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerify} className="register-panel">
              <div className="register-field">
                <label className="register-label" htmlFor="verifyEmail">
                  이메일
                </label>
                <input
                  id="verifyEmail"
                  className="register-input"
                  type="email"
                  value={email}
                  disabled
                />
              </div>

              <div className="register-field">
                <label className="register-label" htmlFor="verificationCode">
                  인증 코드
                </label>
                <input
                  id="verificationCode"
                  className="register-input"
                  type="text"
                  placeholder="이메일로 받은 인증 코드를 입력하세요"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  required
                />
              </div>

              {message && <p className="register-message success">{message}</p>}
              {error && <p className="register-message error">{error}</p>}

              <button type="submit" className="register-btn" disabled={loading}>
                {loading ? "인증 중..." : "인증 완료"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
