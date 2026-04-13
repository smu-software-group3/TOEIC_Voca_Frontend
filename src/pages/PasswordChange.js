import React, { useState } from "react";
import { Form } from "../components/Form";
import { Input } from "../components/Input";
import { Button } from "../components/Button";

export default function PasswordChange() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    setMessage("");
    setError("");

    if (!currentPassword || !newPassword || !newPasswordConfirm) {
      setError("모든 항목을 입력해주세요.");
      return;
    }

    const payload = {
      currentPassword,
      newPassword,
      newPasswordConfirm,
    };

    console.log("비밀번호 변경 요청 payload:", payload);
    setMessage("비밀번호 변경 요청을 전송했습니다.");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f3f4f6",
        padding: "24px",
        boxSizing: "border-box",
      }}
    >
      <Form onSubmit={handleSubmit}>
        <h2 style={{ margin: 0, textAlign: "center", color: "#111827" }}>
          비밀번호 변경
        </h2>
        <p
          style={{
            margin: 0,
            fontSize: "14px",
            color: "#4b5563",
            lineHeight: 1.5,
          }}
        >
          현재 비밀번호와 새 비밀번호를 입력해 비밀번호를 변경합니다.
        </p>

        <Input
          type="password"
          placeholder="현재 비밀번호"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
        />

        <Input
          type="password"
          placeholder="새 비밀번호"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
        <Input
          type="password"
          placeholder="새 비밀번호 확인"
          value={newPasswordConfirm}
          onChange={(e) => setNewPasswordConfirm(e.target.value)}
        />

        {error && (
          <p style={{ margin: 0, fontSize: "13px", color: "#dc2626" }}>
            {error}
          </p>
        )}
        {message && (
          <p style={{ margin: 0, fontSize: "13px", color: "#047857" }}>
            {message}
          </p>
        )}

        <Button buttonText="비밀번호 변경" />
      </Form>
    </div>
  );
}
