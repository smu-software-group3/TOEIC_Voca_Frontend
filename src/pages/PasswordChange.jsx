import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { changePassword } from "../api/server";
import "./PasswordChange.css";

export default function PasswordChange() {
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // 입력값을 검증한 뒤 서버에 비밀번호 변경 요청을 보낸다.
  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");
    setLoading(true);

    if (!currentPassword || !newPassword || !newPasswordConfirm) {
      setError("모든 항목을 입력해주세요.");
      setLoading(false);
      return;
    }

    try {
      const response = await changePassword(
        currentPassword,
        newPassword,
        newPasswordConfirm,
      );

      if (response.success === true) {
        setMessage(
          "비밀번호가 성공적으로 변경되었습니다. 로그인 페이지로 이동합니다.",
        );
        setTimeout(() => {
          navigate("/login");
        }, 1200);
      } else {
        setError("비밀번호 변경에 실패했습니다.");
      }
    } catch (err) {
      setError(err.message || "비밀번호 변경 요청에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pwc-page">
      <div className="pwc-card">
        <div className="pwc-left">
          <div className="pwc-logo">
            <span className="pwc-logo-part pwc-logo-voca">VOCA</span>
            <span className="pwc-logo-part pwc-logo-stats">STATS</span>
          </div>
          <p className="pwc-logo-sub">VOCABULARY · STATISTICS</p>
          <h1 className="pwc-headline">
            보안을 위해 비밀번호를 안전하게 변경하세요
          </h1>
          <p className="pwc-subtext">
            현재 비밀번호 확인 후 새 비밀번호로 업데이트합니다.
          </p>
          <ul className="pwc-features">
            <li className="pwc-feature">
              <span className="pwc-feature-icon pwc-feature-icon-purple">
                🔐
              </span>
              현재 비밀번호 확인
            </li>
            <li className="pwc-feature">
              <span className="pwc-feature-icon pwc-feature-icon-green">
                ✅
              </span>
              새 비밀번호로 즉시 반영
            </li>
          </ul>
        </div>

        <div className="pwc-right">
          <h2 className="pwc-title">비밀번호 변경</h2>
          <p className="pwc-hint">
            로그인 정보가 기억나지 않나요?{" "}
            <button
              type="button"
              className="pwc-link"
              onClick={() => navigate("/pwf")}
            >
              비밀번호 찾기
            </button>
          </p>

          <form onSubmit={handleSubmit} className="pwc-form">
            <div className="pwc-field">
              <label className="pwc-label" htmlFor="currentPassword">
                현재 비밀번호
              </label>
              <input
                id="currentPassword"
                className="pwc-input"
                type="password"
                placeholder="현재 비밀번호를 입력하세요"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>

            <div className="pwc-field">
              <label className="pwc-label" htmlFor="newPassword">
                새 비밀번호
              </label>
              <input
                id="newPassword"
                className="pwc-input"
                type="password"
                placeholder="새 비밀번호를 입력하세요"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>

            <div className="pwc-field">
              <label className="pwc-label" htmlFor="newPasswordConfirm">
                새 비밀번호 확인
              </label>
              <input
                id="newPasswordConfirm"
                className="pwc-input"
                type="password"
                placeholder="새 비밀번호를 다시 입력하세요"
                autoComplete="new-password"
                value={newPasswordConfirm}
                onChange={(e) => setNewPasswordConfirm(e.target.value)}
              />
            </div>

            {error && <p className="pwc-message error">{error}</p>}
            {message && <p className="pwc-message success">{message}</p>}

            <button type="submit" className="pwc-btn" disabled={loading}>
              {loading ? "변경 중..." : "비밀번호 변경"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
