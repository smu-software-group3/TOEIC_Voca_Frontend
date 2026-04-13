import React, { useState } from "react";
import { Form } from "../components/Form";
import { Input } from "../components/Input";
import { Button } from "../components/Button";

export default function PasswordChange() {
  const [email, setEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [isVerificationSent, setIsVerificationSent] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
  };

  const handleNoopClick = (e) => {
    e.preventDefault();
  };

  const handleVerificationSend = (e) => {
    e.preventDefault();
    setIsVerificationSent(true);
    setIsEmailVerified(false);
  };

  const handleVerificationCheck = (e) => {
    e.preventDefault();
    setIsEmailVerified(true);
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
          등록된 이메일로 인증 후 비밀번호를 변경할 수 있습니다.
        </p>

        <Input
          type="email"
          placeholder="이메일"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Button buttonText="인증번호 받기" onClick={handleVerificationSend} />

        {isVerificationSent && (
          <>
            <Input
              placeholder="인증번호"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
            />
            <Button buttonText="인증번호 확인" onClick={handleVerificationCheck} />
          </>
        )}

        {isEmailVerified && (
          <>
            <p style={{ margin: 0, fontSize: "13px", color: "#047857" }}>
              이메일 인증이 완료되었습니다.
            </p>
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
            <Button buttonText="비밀번호 변경" onClick={handleNoopClick} />
          </>
        )}
      </Form>
    </div>
  );
}
