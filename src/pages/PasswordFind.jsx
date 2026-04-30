import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { findPassword } from "../api/server";
import "./PasswordFind.css";

export default function PasswordFind() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // 이메일을 검증한 뒤 임시 비밀번호 발급을 요청한다.
  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");

    if (!email.trim()) {
      setError("이메일을 입력해주세요.");
      return;
    }

    setLoading(true);

    try {
      const response = await findPassword(email.trim());

      if (response?.success === true) {
        setMessage("입력한 이메일로 임시 비밀번호가 발송되었습니다.");
        setEmail("");
      } else {
        setError(response?.message || "비밀번호 찾기 요청에 실패했습니다.");
      }
    } catch (err) {
      setError(err.message || "비밀번호 찾기 요청에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pwf-page">
      <div className="pwf-card">
        <div className="pwf-left">
          <div className="pwf-logo">
            <span className="pwf-logo-part pwf-logo-voca">VOCA</span>
            <span className="pwf-logo-part pwf-logo-stats">STATS</span>
          </div>
          <p className="pwf-logo-sub">VOCABULARY · STATISTICS</p>
          <h1 className="pwf-headline">비밀번호를 잊으셨나요? 이메일로 즉시 재설정하세요</h1>
          <p className="pwf-subtext">가입 이메일로 임시 비밀번호를 전송해 드립니다.</p>
          <ul className="pwf-features">
            <li className="pwf-feature">
              <span className="pwf-feature-icon pwf-feature-icon-purple">📧</span>
              이메일 한 번으로 간편 요청
            </li>
            <li className="pwf-feature">
              <span className="pwf-feature-icon pwf-feature-icon-green">⚡</span>
              임시 비밀번호 즉시 발급
            </li>
          </ul>
        </div>

        <div className="pwf-right">
          <h2 className="pwf-title">비밀번호 찾기</h2>
          <p className="pwf-hint">
            비밀번호가 기억나셨나요?{" "}
            <button type="button" className="pwf-link" onClick={() => navigate("/login")}>
              로그인
            </button>
          </p>

          <form onSubmit={handleSubmit} className="pwf-form">
            <div className="pwf-field">
              <label className="pwf-label" htmlFor="email">이메일</label>
              <input
                id="email"
                className="pwf-input"
                type="email"
                placeholder="example@email.com"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {error && <p className="pwf-message error">{error}</p>}
            {message && <p className="pwf-message success">{message}</p>}

            <button type="submit" className="pwf-btn" disabled={loading}>
              {loading ? "전송 중..." : "임시 비밀번호 발급"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
